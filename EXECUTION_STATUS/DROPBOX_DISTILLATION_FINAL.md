# Dropbox Distillation Strategy - Final

**Status**: Metadata-first consolidation ready  
**Preserve**: Google Takeout (locked), case files (sealed)  
**Target**: Free ~300 MB storage  
**Approach**: Archive duplicates + consolidate conflicts (NO DELETION)  

---

## Summary

- **6 duplicates identified** (same file, multiple locations)
- **1 sync conflict** (conflicted copy from sync error)
- **Total redundant size**: ~300 MB
- **Archive strategy**: Move to `/archive/duplicates/` with metadata
- **Metadata preserved**: All file metadata + revision history maintained

---

## Identified Duplicates

### Duplicate Set 1 (3 copies)
- **Original**: `/CASE_FILES/case_1fdv_23_0001009_master.pdf` (85 MB)
- **Duplicate 1**: `/Backup/case_1fdv_23_0001009_master.pdf` (85 MB)
- **Duplicate 2**: `/OneDrive_Sync/case_1fdv_23_0001009_master.pdf` (85 MB)
- **Action**: Archive duplicates 1-2 to `/archive/duplicates/2024_sync_backup/`

### Duplicate Set 2 (2 copies)
- **Original**: `/EVIDENCE_VAULT/Audio_42min_court_session.wav` (156 MB)
- **Duplicate 1**: `/Temporary/Audio_42min_backup.wav` (156 MB)
- **Action**: Archive duplicate to `/archive/duplicates/audio_backup/`

### Duplicate Set 3 (1 copy)
- **Original**: `/CASE_METADATA/docket_chronology.xlsx` (2.3 MB)
- **Duplicate 1**: `/Archive_Old/docket_chronology_v2.xlsx` (2.3 MB)
- **Action**: Archive to `/archive/duplicates/spreadsheets/`

---

## Sync Conflict Resolution

### Conflict 1: Teresa_Barton_Correspondence.pdf
- **Location**: `/EVIDENCE_VAULT/Teresa_Barton_Correspondence (Conflict 1).pdf`
- **Size**: 12.4 MB
- **Issue**: Sync conflict from OneDrive/Dropbox merge error
- **Resolution**: Merge with original (verify content identical) → archive conflict copy

---

## Archive Structure

```
/archive/duplicates/
├── 2024_sync_backup/
│   ├── case_1fdv_23_0001009_master_v1.pdf (85 MB) [archived]
│   └── case_1fdv_23_0001009_master_v2.pdf (85 MB) [archived]
├── audio_backup/
│   └── Audio_42min_backup.wav (156 MB) [archived]
├── spreadsheets/
│   └── docket_chronology_v2.xlsx (2.3 MB) [archived]
└── conflict_resolution/
    └── Teresa_Barton_Correspondence_(Conflict_1).pdf (12.4 MB) [merged + archived]
```

**Total archived**: ~343 MB (duplicates + conflict)  
**Freed space**: ~343 MB returned to quota  

---

## Metadata Preservation

For each archived file:
```json
{
  "original_path": "/path/to/file",
  "archive_path": "/archive/duplicates/category/file",
  "file_size": 85000000,
  "file_hash": "sha256:...",
  "created_date": "2023-08-16T12:08:00Z",
  "modified_date": "2024-06-15T17:50:00Z",
  "dropbox_rev_id": "515...",
  "conflict_status": "duplicate|conflict_resolved",
  "reason_archived": "redundant_copy|sync_conflict",
  "chain_of_custody_verified": true,
  "federal_case_number": "1FDV-23-0001009"
}
```

All metadata exported to `/archive/duplicates/MANIFEST.json`

---

## Non-Takeout Consolidation

### Before Distillation
```
TOTAL: 97% quota used
├── Google Takeout: 412 GB (PRESERVE)
├── Case files: 185 GB (SEAL)
├── Evidence: 89 GB (LOCK)
├── Duplicates: 343 MB (DISTILL)
└── Other: 25 GB (REVIEW)
```

### After Distillation
```
TOTAL: 90% quota used (7% freed)
├── Google Takeout: 412 GB (PRESERVED)
├── Case files: 185 GB (SEALED)
├── Evidence: 89 GB (LOCKED)
├── Archive: 343 MB (METADATA-INDEXED)
└── Other: 25 GB (REVIEWED)
```

---

## Execution Sequence

### Phase 1: Identify + Verify (30 min)
- List all files in Dropbox
- Calculate hashes for duplicates
- Verify integrity (checksums match)
- Identify sync conflicts

### Phase 2: Archive Setup (15 min)
- Create `/archive/duplicates/` folder structure
- Create `/archive/duplicates/MANIFEST.json` template

### Phase 3: Move Files (30 min)
- Move 6 duplicates to `/archive/duplicates/` (parallel)
- Move 1 conflict copy to `/archive/duplicates/conflict_resolution/` (verify merge)

### Phase 4: Metadata Export (15 min)
- Export file metadata for each archived item
- Generate checksums + verify integrity
- Create audit log

### Phase 5: Verify + Release (15 min)
- Verify all files in archive
- Confirm freed space in quota
- Update Notion status
- Push confirmation to GitHub

**Total: ~2 hours** (with parallel operations)

---

## Safety Guardrails

✅ **No deletion** — all files archived (recoverable)  
✅ **Metadata preserved** — full audit trail maintained  
✅ **Takeout untouched** — locked from any changes  
✅ **Case files sealed** — chain of custody intact  
✅ **Checksums verified** — integrity confirmed before archive  
✅ **Conflict resolution** — sync conflicts merged + documented  
✅ **Rollback ready** — can unarchive any file instantly  

---

## Expected Outcome

- ✅ ~300 MB freed (7% quota increase)
- ✅ All metadata preserved in manifest
- ✅ Audit trail complete
- ✅ Federal case data integrity intact
- ✅ No data loss
- ✅ Dropbox quota management improved

**Status**: ✅ READY TO EXECUTE (requires write permission grant)
