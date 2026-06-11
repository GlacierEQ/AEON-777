#!/usr/bin/env python3
"""
jefs_docket_scraper.py — Bulk-download JEFS docket PDFs for a case.
Target : Hawaii JIMS/JEFS  (jimspss1.courts.state.hi.us)
Case   : 1FDV-23-0001009   (214 docket entries)

SETUP (one-time):
  pip install playwright pypdf
  playwright install chromium

USAGE:
  Step 1 — Save your logged-in session (opens a real browser window):
      python jefs_docket_scraper.py --login

  Step 2 — Bulk-download every PDF (reuses the saved session):
      python jefs_docket_scraper.py --scrape

  Step 3 — Extract text / metadata from downloaded PDFs:
      python jefs_docket_scraper.py --extract

OUTPUT:
  docket_pdfs/dkt_NNNN.pdf     — one file per docket entry
  docket_pdfs/manifest.json    — docket number → filename + row metadata
  docket_pdfs/docket_corpus.jsonl  — full extracted text (one JSON per line)
  docket_pdfs/docket_index.csv     — summary: docket #, filename, char count
  docket_pdfs/timestamp_report.csv — timestamps, filename, pdf CreationDate/ModDate
"""

import asyncio, csv, json, re, sys
from pathlib import Path
from playwright.async_api import async_playwright

# ──────────────────────────────────────────────────────────────────────────
BASE       = "https://jimspss1.courts.state.hi.us/JIMSExternal"
CASE_URL   = f"{BASE}/manage-cases.iface"
CASE_ID    = "1FDV-23-0001009"
STATE_FILE = Path("jefs_state.json")   # persisted browser auth cookies/storage
OUT_DIR    = Path("docket_pdfs")
OUT_DIR.mkdir(exist_ok=True)

POLITE_DELAY_MS = 1200   # ms between PDF clicks — be gentle to the court server

# ──────────────────────────────────────────────────────────────────────────
async def save_login():
    """
    Open a headed (visible) Chromium window so you can log into JEFS manually.
    After you have searched for the case and can see the docket list, press ENTER
    here to snapshot the session state (cookies + localStorage).
    """
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        ctx = await browser.new_context(accept_downloads=True)
        page = await ctx.new_page()
        await page.goto(CASE_URL)
        print("\n>> Browser opened. Log into JEFS, search Case ID:", CASE_ID)
        print(">> Once the docket list is visible, come back here and press ENTER.\n")
        input("   [ENTER to save session] ")
        await ctx.storage_state(path=str(STATE_FILE))
        print(f">> Session saved → {STATE_FILE}")
        await browser.close()

async def scrape():
    """
    Reuse the saved session to walk every docket row that has a PDF icon,
    click it, handle the 'Download Regular Copy' dialog, and save the file.
    Produces:  docket_pdfs/dkt_NNNN.pdf  +  docket_pdfs/manifest.json
    """
    if not STATE_FILE.exists():
        print("ERROR: Run --login first to save your session.")
        sys.exit(1)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)  # headed → fewer CAPTCHAs
        ctx = await browser.new_context(
            accept_downloads=True,
            storage_state=str(STATE_FILE)
        )
        page = await ctx.new_page()
        await page.goto(CASE_URL)
        await page.wait_for_load_state("networkidle")

        # Search for the case
        try:
            await page.select_option("select[id*='caseType']", label="DV - Divorce")
        except Exception:
            print("   (Could not set case type — trying search directly)")

        case_input = page.locator("input[id*='caseId'], input[name*='caseId']").first
        await case_input.fill(CASE_ID)
        await page.click("button:has-text('Search'), input[value='Search']")
        await page.wait_for_timeout(2000)

        # Click the case link
        await page.click(f"a:has-text('{CASE_ID}')")
        await page.wait_for_timeout(2500)

        # Collect docket rows with PDF links
        rows = await page.query_selector_all(
            "table[id*='docket'] tr, "
            "tr:has(a img[src*='document_pdf']), "
            "tr:has(a[id*='pdf'])"
        )
        print(f"\n>> Found {len(rows)} candidate rows in docket table.\n")

        manifest = []
        skipped  = 0

        for row in rows:
            pdf_link = await row.query_selector(
                "a:has(img[src*='document_pdf']), a[title*='PDF'], a[id*='pdf']"
            )
            if not pdf_link:
                continue

            cells = await row.query_selector_all("td")
            texts = [(await c.inner_text()).strip() for c in cells]

            # Best-effort: grab docket number from the row text
            dkt_num = next((t for t in texts if re.fullmatch(r"\d+", t)), None)
            if not dkt_num:
                skipped += 1
                continue

            dest = OUT_DIR / f"dkt_{int(dkt_num):04d}.pdf"
            if dest.exists():
                print(f"  ↳ Dkt {dkt_num} already downloaded — skipping.")
                manifest.append({"docket": dkt_num, "file": dest.name,
                                  "meta": texts, "status": "cached"})
                continue

            try:
                async with page.expect_download(timeout=25000) as dl_info:
                    await pdf_link.click()
                    # JEFS shows a "Download Regular Copy" confirmation button
                    confirm = await page.wait_for_selector(
                        "button:has-text('Download Regular Copy'), "
                        "input[value*='Regular'], "
                        "a:has-text('Regular Copy')",
                        timeout=8000
                    )
                    await confirm.click()
                dl = await dl_info.value
                await dl.save_as(str(dest))
                manifest.append({"docket": dkt_num, "file": dest.name,
                                  "meta": texts, "status": "downloaded"})
                print(f"  ✓ Dkt {dkt_num:>4} → {dest.name}")
            except Exception as e:
                manifest.append({"docket": dkt_num, "file": None,
                                  "meta": texts, "status": f"ERROR: {e}"})
                print(f"  ✗ Dkt {dkt_num:>4}: {e}")

            await page.wait_for_timeout(POLITE_DELAY_MS)

        (OUT_DIR / "manifest.json").write_text(json.dumps(manifest, indent=2))
        ok = sum(1 for m in manifest if m["status"] == "downloaded")
        print(f"\n>> Done. {ok} new PDFs downloaded. {skipped} rows skipped.")
        print(f"   Manifest → {OUT_DIR}/manifest.json")
        await browser.close()

def extract():
    """
    Parse every dkt_NNNN.pdf:
      • Extract full text via pypdf
      • Pull PDF metadata: CreationDate, ModDate, Author, Creator, Producer
    Produces:
      docket_pdfs/docket_corpus.jsonl   — full text, one JSON per line
      docket_pdfs/docket_index.csv      — docket #, file, char count
      docket_pdfs/timestamp_report.csv  — timestamp audit table
    """
    try:
        from pypdf import PdfReader
    except ImportError:
        print("ERROR: pip install pypdf")
        sys.exit(1)

    rows         = []
    ts_rows      = []
    pdf_files    = sorted(OUT_DIR.glob("dkt_*.pdf"))

    if not pdf_files:
        print("No PDFs found. Run --scrape first.")
        sys.exit(1)

    print(f"\n>> Extracting text from {len(pdf_files)} PDFs …\n")

    for pdf_path in pdf_files:
        dkt = pdf_path.stem.replace("dkt_", "").lstrip("0") or "0"
        try:
            reader = PdfReader(str(pdf_path))
            text   = "\n".join((pg.extract_text() or "") for pg in reader.pages)
            meta   = reader.metadata or {}
            creation = str(meta.get("/CreationDate", ""))
            modified = str(meta.get("/ModDate", ""))
            author   = str(meta.get("/Author", ""))
            creator  = str(meta.get("/Creator", ""))
            producer = str(meta.get("/Producer", ""))
        except Exception as e:
            text     = f"[EXTRACT_ERROR: {e}]"
            creation = modified = author = creator = producer = "ERROR"

        rows.append({
            "docket":   dkt,
            "file":     pdf_path.name,
            "chars":    len(text),
            "creation": creation,
            "modified": modified,
            "author":   author,
            "creator":  creator,
            "producer": producer,
            "text":     text
        })

        ts_rows.append({
            "docket":        dkt,
            "file":          pdf_path.name,
            "chars":         len(text),
            "pdf_creation":  creation,
            "pdf_modified":  modified,
            "pdf_author":    author,
            "pdf_creator":   creator,
            "pdf_producer":  producer,
        })

        print(f"  {pdf_path.name}: {len(text):,} chars  |  "
              f"created={creation[:20] if creation else 'N/A'}")

    # Write JSONL corpus (ideal for vector ingest / Supabase / LLM analysis)
    corpus_path = OUT_DIR / "docket_corpus.jsonl"
    with open(corpus_path, "w") as f:
        for r in rows:
            f.write(json.dumps(r) + "\n")

    # Write CSV index (no full text — for quick scanning)
    index_path = OUT_DIR / "docket_index.csv"
    with open(index_path, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["docket", "file", "chars", "pdf_creation", "pdf_modified",
                    "pdf_author", "pdf_creator", "pdf_producer"])
        for r in rows:
            w.writerow([r["docket"], r["file"], r["chars"],
                        r["creation"], r["modified"],
                        r["author"], r["creator"], r["producer"]])

    # Write timestamp audit report (key file for the JEFS subpoena)
    ts_path = OUT_DIR / "timestamp_report.csv"
    with open(ts_path, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["docket", "file", "pdf_creation", "pdf_modified",
                    "pdf_author", "pdf_creator", "pdf_producer", "chars"])
        for r in ts_rows:
            w.writerow([r["docket"], r["file"], r["pdf_creation"], r["pdf_modified"],
                        r["pdf_author"], r["pdf_creator"], r["pdf_producer"], r["chars"]])

    print(f"\n>> Wrote:")
    print(f"   {corpus_path}   ({len(rows)} documents, full text)")
    print(f"   {index_path}")
    print(f"   {ts_path}  ← USE THIS FOR TIMESTAMP ANALYSIS")

if __name__ == "__main__":
    if "--login"   in sys.argv: asyncio.run(save_login())
    elif "--scrape" in sys.argv: asyncio.run(scrape())
    elif "--extract" in sys.argv: extract()
    else:
        print(__doc__)
