#!/usr/bin/env node

import fs from 'node:fs/promises'
import path from 'node:path'
import {
  appendSongSeedEntry,
  buildSongSeedFromBulkResolvedEntry,
  buildSongSeedFromResolvedCandidate,
  detectCatalogDuplicate,
  parseCatalogEntries,
  parseBulkSongLine,
  readLocalEnvValue,
  readSongsCatalog,
  resolveSongQuery,
  writeBulkReport,
  writeSongsCatalog,
} from './artist-catalog-lib.mjs'

function printUsage() {
  console.log(`Usage:
  npm run songs:check -- "Imagine Dragons Believer"
  npm run songs:add -- "Imagine Dragons Believer"
  npm run songs:bulk -- --file ./songs.txt
  npm run songs:bulk-import -- --report ./private/artist-catalog-reports/bulk-report-....json
`)
}

function parseArgs(argv) {
  const [command, ...rest] = argv
  const flags = { command, positionals: [] }

  for (let index = 0; index < rest.length; index += 1) {
    const argument = rest[index]

    if (argument.startsWith('--')) {
      const key = argument.slice(2)
      const value = rest[index + 1]

      if (!value || value.startsWith('--')) {
        throw new Error(`Missing value for --${key}`)
      }

      flags[key] = value
      index += 1
      continue
    }

    flags.positionals.push(argument)
  }

  return flags
}

function printResolvedCandidate(candidate) {
  console.log(`Resolved song: ${candidate.lastFmTrack.canonicalSongTitle}`)
  console.log(`Resolved artist: ${candidate.lastFmTrack.canonicalArtist}`)
  console.log(`Era: ${candidate.era ?? 'n/a'}`)
  console.log(`Region: ${candidate.region ?? 'n/a'}`)
  console.log(`Popularity tier: ${candidate.popularityTier ?? 'n/a'}`)

  if (candidate.iTunesLookup.match) {
    console.log(`Album: ${candidate.iTunesLookup.match.collectionName ?? 'n/a'}`)
    console.log(`Preview: ${candidate.iTunesLookup.match.previewUrl}`)
    console.log(`Artwork: ${candidate.iTunesLookup.match.artworkUrl ?? 'n/a'}`)
  }
}

function printCandidateList(candidates) {
  if (!candidates?.length) {
    return
  }

  console.log('Candidate matches:')

  for (const candidate of candidates) {
    if (!candidate?.lastFmTrack) {
      continue
    }

    console.log(
      `- ${candidate.lastFmTrack.canonicalArtist} - ${candidate.lastFmTrack.canonicalSongTitle} (score ${candidate.score})`,
    )
  }
}

function printBulkLineStatus(prefix, lineNumber, message) {
  console.log(`[${lineNumber}] ${prefix}: ${message}`)
}

async function resolveQueryOrThrow(query) {
  const lastFmApiKey = await readLocalEnvValue('LASTFM_API_KEY')
  const resolution = await resolveSongQuery(query, {
    lastFmApiKey,
  })

  if (resolution.status !== 'resolved' || !resolution.candidate) {
    if (resolution.reason) {
      console.error(resolution.reason)
    }

    printCandidateList(resolution.candidates)
    throw new Error('Could not resolve the song query with enough confidence.')
  }

  return resolution
}

async function runCheck(flags) {
  const query = flags.positionals.join(' ').trim()

  if (!query) {
    throw new Error('check requires a quoted song query')
  }

  const resolution = await resolveQueryOrThrow(query)
  printResolvedCandidate(resolution.candidate)
}

async function runAdd(flags) {
  const query = flags.positionals.join(' ').trim()

  if (!query) {
    throw new Error('add requires a quoted song query')
  }

  const resolution = await resolveQueryOrThrow(query)
  const seed = buildSongSeedFromResolvedCandidate(resolution.candidate)
  const source = await readSongsCatalog()
  const entries = parseCatalogEntries(source)
  const duplicate = detectCatalogDuplicate(
    entries,
    seed.id,
    seed.songTitle,
    seed.artistName,
  )

  if (duplicate) {
    throw new Error(
      duplicate.type === 'id'
        ? `Catalog already contains id "${duplicate.entry.id}".`
        : `Catalog already contains "${duplicate.entry.songTitle}" by "${duplicate.entry.artistName}".`,
    )
  }

  const nextSource = appendSongSeedEntry(source, seed)
  await writeSongsCatalog(nextSource)

  printResolvedCandidate(resolution.candidate)
  console.log(`Generated id: ${seed.id}`)
  console.log(`Aliases: ${seed.aliases.join(', ')}`)
  console.log(`Added "${seed.songTitle}" by "${seed.artistName}" to the catalog.`)
}

async function runBulk(flags) {
  if (!flags.file) {
    throw new Error('bulk requires --file')
  }

  const filePath = path.resolve(process.cwd(), flags.file)
  const raw = await fs.readFile(filePath, 'utf8')
  const lines = raw.split(/\r?\n/)
  const lastFmApiKey = await readLocalEnvValue('LASTFM_API_KEY')
  const results = []
  const candidateLineCount = lines.reduce((count, line) => {
    return parseBulkSongLine(line) ? count + 1 : count
  }, 0)

  console.log(`Starting bulk validation for ${candidateLineCount} song quer${candidateLineCount === 1 ? 'y' : 'ies'}.`)
  console.log(`Input file: ${filePath}`)

  for (let index = 0; index < lines.length; index += 1) {
    const lineNumber = index + 1
    const line = lines[index]

    try {
      const query = parseBulkSongLine(line)

      if (!query) {
        if (line.trim()) {
          printBulkLineStatus('skip', lineNumber, 'comment or empty line')
        }
        continue
      }

      printBulkLineStatus('start', lineNumber, query)
      const resolution = await resolveSongQuery(query, { lastFmApiKey })
      const topCandidate =
        resolution.candidate && resolution.status === 'resolved'
          ? `${resolution.candidate.lastFmTrack.canonicalArtist} - ${resolution.candidate.lastFmTrack.canonicalSongTitle}`
          : resolution.candidates?.[0]?.lastFmTrack
            ? `${resolution.candidates[0].lastFmTrack.canonicalArtist} - ${resolution.candidates[0].lastFmTrack.canonicalSongTitle}`
            : 'no candidate'

      results.push({
        lineNumber,
        query,
        status: resolution.status,
        reason: resolution.reason,
        resolved:
          resolution.candidate && resolution.status === 'resolved'
            ? {
                songTitle: resolution.candidate.lastFmTrack.canonicalSongTitle,
                artistName: resolution.candidate.lastFmTrack.canonicalArtist,
                era: resolution.candidate.era,
                region: resolution.candidate.region,
                popularityTier: resolution.candidate.popularityTier,
                previewAvailable: resolution.candidate.iTunesLookup.status === 'available',
              }
            : null,
        candidates:
          resolution.candidates?.slice(0, 3).map((candidate) => ({
            songTitle: candidate.lastFmTrack?.canonicalSongTitle ?? null,
            artistName: candidate.lastFmTrack?.canonicalArtist ?? null,
            score: candidate.score ?? null,
          })) ?? [],
      })

      if (resolution.status === 'resolved') {
        printBulkLineStatus('resolved', lineNumber, topCandidate)
      } else {
        printBulkLineStatus(
          resolution.status,
          lineNumber,
          `${resolution.reason ?? 'resolution did not succeed'}${topCandidate !== 'no candidate' ? `; top candidate: ${topCandidate}` : ''}`,
        )
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown error'
      results.push({
        lineNumber,
        query: line,
        status: 'invalid',
        reason,
        resolved: null,
        candidates: [],
      })
      printBulkLineStatus('invalid', lineNumber, reason)
    }
  }

  const resolvedCount = results.filter((result) => result.status === 'resolved').length
  const ambiguousCount = results.filter((result) => result.status === 'ambiguous').length
  const unavailableCount = results.filter((result) => result.status === 'unavailable').length
  const invalidCount = results.filter((result) => result.status === 'invalid').length
  const reportPath = await writeBulkReport(results)

  console.log(`Validated ${results.length} song entries.`)
  console.log(`Resolved: ${resolvedCount}`)
  console.log(`Ambiguous: ${ambiguousCount}`)
  console.log(`Unavailable: ${unavailableCount}`)
  console.log(`Invalid: ${invalidCount}`)
  console.log(`Report: ${reportPath}`)

  if (ambiguousCount || unavailableCount || invalidCount) {
    process.exitCode = 1
  }
}

async function runBulkImport(flags) {
  if (!flags.report) {
    throw new Error('bulk-import requires --report')
  }

  const reportPath = path.resolve(process.cwd(), flags.report)
  const reportSource = await fs.readFile(reportPath, 'utf8')
  const report = JSON.parse(reportSource)
  const reportResults = Array.isArray(report?.results) ? report.results : null

  if (!reportResults) {
    throw new Error('Bulk report must contain a top-level results array.')
  }

  console.log(`Importing verified songs from report: ${reportPath}`)

  let catalogSource = await readSongsCatalog()
  let catalogEntries = parseCatalogEntries(catalogSource)
  let importedCount = 0
  let skippedCount = 0
  let skippedDuplicateCount = 0
  let skippedInvalidCount = 0

  for (const result of reportResults) {
    const lineNumber = result?.lineNumber ?? '?'

    if (result?.status !== 'resolved' || !result?.resolved) {
      skippedCount += 1
      printBulkLineStatus('skip', lineNumber, `status ${result?.status ?? 'unknown'}`)
      continue
    }

    try {
      const seed = buildSongSeedFromBulkResolvedEntry(result.resolved)
      const duplicate = detectCatalogDuplicate(
        catalogEntries,
        seed.id,
        seed.songTitle,
        seed.artistName,
      )

      if (duplicate) {
        skippedCount += 1
        skippedDuplicateCount += 1
        printBulkLineStatus(
          'skip',
          lineNumber,
          duplicate.type === 'id'
            ? `duplicate id ${duplicate.entry.id}`
            : `duplicate song ${duplicate.entry.artistName} - ${duplicate.entry.songTitle}`,
        )
        continue
      }

      catalogSource = appendSongSeedEntry(catalogSource, seed)
      catalogEntries = parseCatalogEntries(catalogSource)
      importedCount += 1
      printBulkLineStatus('imported', lineNumber, `${seed.artistName} - ${seed.songTitle}`)
    } catch (error) {
      skippedCount += 1
      skippedInvalidCount += 1
      printBulkLineStatus(
        'skip',
        lineNumber,
        error instanceof Error ? error.message : 'Unknown import error',
      )
    }
  }

  if (importedCount > 0) {
    await writeSongsCatalog(catalogSource)
  }

  console.log(`Imported: ${importedCount}`)
  console.log(`Skipped: ${skippedCount}`)
  console.log(`Skipped duplicates: ${skippedDuplicateCount}`)
  console.log(`Skipped invalid: ${skippedInvalidCount}`)
}

async function main() {
  const flags = parseArgs(process.argv.slice(2))

  switch (flags.command) {
    case 'check':
      await runCheck(flags)
      break
    case 'add':
      await runAdd(flags)
      break
    case 'bulk':
      await runBulk(flags)
      break
    case 'bulk-import':
      await runBulkImport(flags)
      break
    case undefined:
      printUsage()
      process.exitCode = 1
      break
    default:
      throw new Error(`Unknown command: ${flags.command}`)
  }
}

await main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  printUsage()
  process.exitCode = 1
})
