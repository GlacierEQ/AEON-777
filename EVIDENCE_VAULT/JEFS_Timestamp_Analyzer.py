#!/usr/bin/env python3
"""
jefs_timestamp_analyzer.py

Reads  docket_pdfs/timestamp_report.csv  (produced by jefs_docket_scraper.py
--extract) and docket_pdfs/manifest.json, then produces:

  analysis/timestamp_anomalies.csv  — all pairs with gap < 300 sec
  analysis/timestamp_anomalies.txt  — human-readable report (for the brief)
  analysis/backdating_suspects.csv  — PDFs whose creation date predates the
                                      JIMS docket entry date (requires manifest
                                      to include the docket filing date)

Usage:
  python jefs_timestamp_analyzer.py

Requirements:
  pip install pypdf   (already needed for scraper)
  No additional deps.
"""

import csv, json, re, sys
from datetime import datetime, timezone
from pathlib import Path
from itertools import combinations

TS_CSV   = Path("docket_pdfs/timestamp_report.csv")
MANIFEST = Path("docket_pdfs/manifest.json")
OUT_DIR  = Path("analysis"); OUT_DIR.mkdir(exist_ok=True)

# ──────────────────────────────────────────────────────────────────────────
# PDF dates look like: D:20240628161737-10'00'  (D:YYYYMMDDHHmmSS±HH'MM')
_PDF_DATE_RE = re.compile(
    r"D:(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})"
    r"(?:([+-Z])(\d{2})'(\d{2})')?"
)

def parse_pdf_date(raw: str) -> datetime | None:
    m = _PDF_DATE_RE.search(raw or "")
    if not m: return None
    yr, mo, dy, hh, mm, ss = [int(x) for x in m.groups()[:6]]
    sign, tz_h, tz_m = m.group(7), m.group(8), m.group(9)
    if sign and sign not in ("Z",):
        offset_min = int(tz_h) * 60 + int(tz_m)
        if sign == "-": offset_min = -offset_min
        tz = timezone.utcoffset.__func__(None, __import__("datetime").timedelta(minutes=offset_min))
    else:
        tz = timezone.utc
    try:
        return datetime(yr, mo, dy, hh, mm, ss, tzinfo=timezone.utc)
    except Exception:
        return None

def main():
    if not TS_CSV.exists():
        print(f"ERROR: {TS_CSV} not found. Run:  python jefs_docket_scraper.py --extract")
        sys.exit(1)

    # Load timestamp CSV
    records = []
    with open(TS_CSV, newline="") as f:
        for row in csv.DictReader(f):
            dkt = int(row["docket"]) if row["docket"].isdigit() else None
            if dkt is None: continue
            creation = parse_pdf_date(row.get("pdf_creation",""))
            modified = parse_pdf_date(row.get("pdf_modified",""))
            records.append({
                "docket":   dkt,
                "file":     row["file"],
                "creation": creation,
                "modified": modified,
                "author":   row.get("pdf_author",""),
                "creator":  row.get("pdf_creator",""),
                "producer": row.get("pdf_producer",""),
                "raw_creation": row.get("pdf_creation",""),
                "raw_modified": row.get("pdf_modified",""),
            })
    records.sort(key=lambda r: r["docket"])
    print(f"Loaded {len(records)} records from {TS_CSV}")

    # 1. Consecutive-pair gap analysis
    # Flag any consecutive docket pair whose creation timestamps differ by < 300s
    anomalies = []
    for a, b in zip(records, records[1:]):
        if a["creation"] and b["creation"]:
            gap = abs((b["creation"] - a["creation"]).total_seconds())
            if gap < 300:
                anomalies.append({
                    "dkt_a":      a["docket"],
                    "dkt_b":      b["docket"],
                    "gap_sec":    int(gap),
                    "time_a":     a["creation"].strftime("%Y-%m-%d %H:%M:%S UTC"),
                    "time_b":     b["creation"].strftime("%Y-%m-%d %H:%M:%S UTC"),
                    "author_a":   a["author"],
                    "author_b":   b["author"],
                    "creator_a":  a["creator"],
                    "creator_b":  b["creator"],
                })

    # Write anomaly CSV
    anom_csv = OUT_DIR / "timestamp_anomalies.csv"
    with open(anom_csv, "w", newline="") as f:
        if anomalies:
            w = csv.DictWriter(f, fieldnames=anomalies[0].keys())
            w.writeheader(); w.writerows(anomalies)
    print(f"  → {len(anomalies)} anomalous pairs written to {anom_csv}")

    # Write human-readable report
    report_path = OUT_DIR / "timestamp_anomalies.txt"
    with open(report_path, "w") as f:
        f.write("JEFS TIMESTAMP ANOMALY REPORT\n")
        f.write(f"Case: 1FDV-23-0001009\n")
        f.write("=" * 70 + "\n\n")
        if not anomalies:
            f.write("No pairs with gap < 300 seconds found.\n")
        else:
            f.write(f"FOUND {len(anomalies)} PAIR(S) WITH GAP < 5 MINUTES\n\n")
            for a in sorted(anomalies, key=lambda x: x["gap_sec"]):
                marker = "⚠ IMPOSSIBLE" if a["gap_sec"] < 120 else "SUSPICIOUS"
                f.write(f"[{marker}] Dkt {a['dkt_a']:>4} → Dkt {a['dkt_b']:>4}  |  "
                        f"Gap: {a['gap_sec']} seconds\n")
                f.write(f"         Time A: {a['time_a']}  |  Creator: {a['creator_a'] or 'N/A'}\n")
                f.write(f"         Time B: {a['time_b']}  |  Creator: {a['creator_b'] or 'N/A'}\n\n")
    print(f"  → Human report written to {report_path}")

    # 2. Backdating suspects: creation date before JIMS filing date
    # The manifest.json includes row metadata from the docket table.
    # Row text often includes the filing date in format MM/DD/YYYY.
    backdate_suspects = []
    if MANIFEST.exists():
        manifest = json.loads(MANIFEST.read_text())
        dkt_map = {int(m["docket"]): m for m in manifest if str(m.get("docket","")).isdigit()}
        date_re = re.compile(r"\b(\d{1,2})/(\d{1,2})/(\d{4})\b")
        for rec in records:
            m_entry = dkt_map.get(rec["docket"])
            if not m_entry: continue
            # Find first date that looks like a filing date in the row metadata
            filing_dt = None
            for cell_text in (m_entry.get("meta") or []):
                dm = date_re.search(cell_text)
                if dm:
                    try:
                        filing_dt = datetime(int(dm.group(3)), int(dm.group(1)),
                                             int(dm.group(2)), tzinfo=timezone.utc)
                        break
                    except Exception:
                        pass
            if filing_dt and rec["creation"]:
                # Strip time and compare dates only
                if rec["creation"].date() < filing_dt.date():
                    backdate_suspects.append({
                        "docket":       rec["docket"],
                        "file":         rec["file"],
                        "pdf_creation": rec["creation"].strftime("%Y-%m-%d"),
                        "jims_filing":  filing_dt.strftime("%Y-%m-%d"),
                        "days_before":  (filing_dt.date() - rec["creation"].date()).days,
                        "author":       rec["author"],
                        "creator":      rec["creator"],
                    })

        bd_csv = OUT_DIR / "backdating_suspects.csv"
        if backdate_suspects:
            with open(bd_csv, "w", newline="") as f:
                w = csv.DictWriter(f, fieldnames=backdate_suspects[0].keys())
                w.writeheader(); w.writerows(backdate_suspects)
            print(f"  → {len(backdate_suspects)} backdating suspect(s) → {bd_csv}")
        else:
            print("  → No backdating suspects found (or manifest has no date cells).")
    else:
        print(f"  (Skipping backdating check — {MANIFEST} not found)")

    # Summary
    print("\n" + "─" * 70)
    critical = [a for a in anomalies if a["gap_sec"] < 90]
    suspicious = [a for a in anomalies if 90 <= a["gap_sec"] < 300]
    print(f"  CRITICAL (<90 sec gap):   {len(critical)}")
    print(f"  Suspicious (<5 min gap):  {len(suspicious)}")
    print(f"  Backdating suspects:      {len(backdate_suspects)}")
    if critical:
        print("\n  CRITICAL PAIRS:")
        for a in critical:
            print(f"    Dkt {a['dkt_a']} ↔ Dkt {a['dkt_b']}: {a['gap_sec']} seconds")

if __name__ == "__main__":
    main()
