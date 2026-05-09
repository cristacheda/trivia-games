# Artist Catalog CLI

This CLI maintains the `Guess the Artist by Song` catalog in `src/features/guess-the-artist/data/songs.ts`.

## Requirements

- Add `LASTFM_API_KEY=` to `.env.local`
- MusicBrainz and iTunes do not require API keys

## Commands

### Check one query

Validate and resolve a single free-form query without writing to the catalog.

```bash
npm run songs:check -- "Imagine Dragons Believer"
```

What it does:

- tries multiple artist/title splits
- uses Last.fm to correct the canonical artist and track
- uses MusicBrainz to derive era and region
- uses iTunes to verify preview availability

### Add one query

Resolve a single free-form query and append it directly to the catalog on success.

```bash
npm run songs:add -- "Imagine Dragons Believer"
```

The command writes only when all of these are true:

- the query resolves with high confidence
- the iTunes preview is available
- era, region, and popularity tier are derived
- the song is not already in the catalog

### Bulk validate from a text file

Validate one free-form query per line and write a JSON report.

```bash
npm run songs:bulk -- --file ./bulk_list.txt
```

Input format:

```txt
Imagine Dragons Believer
Lady Gaga Bad Romance
# comments are ignored
```

Bulk output:

- terminal progress logs for each line
- a JSON report in `private/artist-catalog-reports/`

Result statuses:

- `resolved`: fully verified and usable for import
- `ambiguous`: multiple plausible matches
- `unavailable`: no valid verified result
- `invalid`: malformed line or other processing failure

### Import from a verified bulk report

Import only resolved, preview-verified entries from a previously generated bulk report.

```bash
npm run songs:bulk-import -- --report ./private/artist-catalog-reports/bulk-report-....json
```

Import behavior:

- imports only entries with `status: "resolved"`
- requires `previewAvailable: true`
- skips duplicate ids
- skips duplicate song/artist pairs
- skips incomplete resolved entries instead of aborting the entire import

## Notes

- `songs:bulk` does not write to the catalog
- `songs:bulk-import` is the second-step write path for verified bulk results
- The CLI rate-limits MusicBrainz requests and retries transient upstream failures
