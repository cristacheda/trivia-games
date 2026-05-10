/**
 * Cocktail Catalog CLI
 *
 * Fetches cocktail data from TheCocktailDB (free API key "1") and generates
 * src/features/guess-the-cocktail/data/cocktails.ts, plus downloads images
 * to public/cocktails/{id}.jpg.
 *
 * Usage:
 *   npm run cocktails:fetch            # Full crawl: fetch all, download images, regenerate data file
 *   npm run cocktails:fetch -- --no-images  # Skip image downloads
 *
 * Rate limiting: 1100ms between letter-search requests, 1100ms between image downloads.
 */

import { createWriteStream, existsSync, mkdirSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import https from 'node:https'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const IMAGES_DIR = path.join(ROOT, 'public', 'cocktails')
const DATA_FILE = path.join(ROOT, 'src', 'features', 'guess-the-cocktail', 'data', 'cocktails.ts')

const API_BASE = 'https://www.thecocktaildb.com/api/json/v1/1'
const COOLDOWN_MS = 1100

const POPULAR_COCKTAIL_NAMES = new Set([
  'mojito', 'margarita', 'old fashioned', 'negroni', 'cosmopolitan', 'daiquiri',
  'piña colada', 'pina colada', 'sex on the beach', 'tequila sunrise', 'white russian',
  'bloody mary', 'gin and tonic', 'long island iced tea', 'aperol spritz', 'manhattan',
  'whisky sour', 'whiskey sour', 'singapore sling', 'mai tai', 'mojito', 'dark n stormy',
  "dark 'n' stormy", 'screwdriver', 'harvey wallbanger', 'black russian', 'americano',
  'french 75', 'zombie', 'gimlet', 'tom collins', 'john collins',
])

const OBSCURE_COCKTAIL_NAMES = new Set([
  'bijou', 'naked and famous', 'vieux carré', 'trinidad sour', 'toronto', 'tipperary',
  'hanky panky', 'angel face', 'monkey gland', 'final ward', 'corpse reviver',
  'chrysanthemum', 'twentieth century', 'tuxedo', 'martinez', 'remember the maine',
  'satan\'s whiskers', 'de la louisiane', 'greenpoint', 'red hook', 'brooklyn',
  'left hand', 'little italy', 'monte carlo', 'paddy', 'palmetto',
])

const KNOWN_ABBREVIATIONS = {
  'long island iced tea': ['LIIT', 'Long Island Ice Tea'],
  'gin and tonic': ['G&T'],
  'rum and coke': ['Cuba Libre'],
  'vodka and tonic': ['V&T'],
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch (err) {
          reject(new Error(`Failed to parse JSON from ${url}: ${err.message}`))
        }
      })
      res.on('error', reject)
    }).on('error', reject)
  })
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(dest)
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close()
        downloadFile(res.headers.location, dest).then(resolve).catch(reject)
        return
      }
      res.pipe(file)
      file.on('finish', () => file.close(resolve))
      file.on('error', reject)
      res.on('error', reject)
    }).on('error', (err) => {
      file.close()
      reject(err)
    })
  })
}

function getPopularityTier(name) {
  const lower = name.toLowerCase()
  if (POPULAR_COCKTAIL_NAMES.has(lower)) return 'popular'
  if (OBSCURE_COCKTAIL_NAMES.has(lower)) return 'obscure'
  return 'common'
}

function buildAliases(name) {
  const aliases = [name]
  const lower = name.toLowerCase()

  if (name.startsWith('The ')) {
    aliases.push(name.slice(4))
  }

  const known = KNOWN_ABBREVIATIONS[lower]
  if (known) {
    aliases.push(...known)
  }

  if (name.includes('&')) {
    aliases.push(name.replace(/&/g, 'and'))
  }
  if (name.toLowerCase().includes(' and ')) {
    aliases.push(name.replace(/ and /gi, ' & '))
  }

  if (name.includes('ñ') || name.includes('é') || name.includes('è') || name.includes('ü')) {
    const ascii = name
      .normalize('NFKD')
      .replace(/\p{Diacritic}/gu, '')
    if (ascii !== name) aliases.push(ascii)
  }

  return [...new Set(aliases)]
}

function extractIngredients(cocktail) {
  const ingredients = []
  for (let i = 1; i <= 15; i++) {
    const ing = cocktail[`strIngredient${i}`]
    if (ing && ing.trim()) {
      ingredients.push(ing.trim())
    }
  }
  return ingredients
}

function formatAliasesArray(aliases) {
  return `[${aliases.map((a) => JSON.stringify(a)).join(', ')}]`
}

function formatIngredientsArray(ingredients) {
  return `[${ingredients.map((i) => JSON.stringify(i)).join(', ')}]`
}

function generateDataFile(cocktails) {
  const lines = [`import type { DifficultyId } from '@/types/game'
import type { CocktailPopularityTier, CocktailQuestionSource } from '@/features/guess-the-cocktail/types'

type CocktailSeed = Omit<CocktailQuestionSource, 'weightModifier'>

const cocktailSeeds: CocktailSeed[] = [`]

  for (const c of cocktails) {
    lines.push(
      `  { id: ${JSON.stringify(c.id)}, name: ${JSON.stringify(c.name)}, aliases: ${formatAliasesArray(c.aliases)}, category: ${JSON.stringify(c.category)}, alcoholic: ${JSON.stringify(c.alcoholic)}, imageLocalPath: ${JSON.stringify(c.imageLocalPath)}, ingredients: ${formatIngredientsArray(c.ingredients)}, popularityTier: ${JSON.stringify(c.popularityTier)} },`
    )
  }

  lines.push(`]

function computeCocktailSelectionWeight(cocktail: CocktailSeed, difficultyId: DifficultyId) {
  const tier = cocktail.popularityTier as CocktailPopularityTier

  if (difficultyId === 'level-1') {
    if (tier === 'popular') return 2.4
    if (tier === 'common') return 1.0
    return 0.3
  }

  if (difficultyId === 'level-2') {
    if (tier === 'popular') return 1.5
    if (tier === 'common') return 1.0
    return 0.7
  }

  if (tier === 'popular') return 0.8
  if (tier === 'common') return 1.0
  return 1.9
}

export const cocktailQuestionBank: CocktailQuestionSource[] = cocktailSeeds.map((cocktail) => ({
  ...cocktail,
  weightModifier: computeCocktailSelectionWeight(cocktail, 'level-1'),
}))

export const cocktailQuestionBankById = new Map(
  cocktailQuestionBank.map((cocktail) => [cocktail.id, cocktail]),
)

export function applyCocktailDifficultyWeights(difficultyId: DifficultyId) {
  return cocktailSeeds.map((cocktail) => ({
    ...cocktail,
    weightModifier: computeCocktailSelectionWeight(cocktail, difficultyId),
  }))
}
`)

  return lines.join('\n')
}

async function fetchAllCocktails() {
  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('')
  const all = new Map()

  for (const letter of letters) {
    const url = `${API_BASE}/search.php?f=${letter}`
    console.log(`Fetching cocktails starting with "${letter.toUpperCase()}"…`)

    try {
      const data = await fetchJson(url)

      if (data.drinks) {
        for (const drink of data.drinks) {
          if (!all.has(drink.idDrink)) {
            all.set(drink.idDrink, drink)
          }
        }
        console.log(`  Found ${data.drinks.length} cocktails (total: ${all.size})`)
      } else {
        console.log(`  No cocktails found for "${letter.toUpperCase()}"`)
      }
    } catch (err) {
      console.error(`  Error fetching "${letter}": ${err.message}`)
    }

    await sleep(COOLDOWN_MS)
  }

  return [...all.values()]
}

async function downloadImages(cocktails, skipExisting = true) {
  mkdirSync(IMAGES_DIR, { recursive: true })

  let downloaded = 0
  let skipped = 0
  let failed = 0

  for (const cocktail of cocktails) {
    const dest = path.join(IMAGES_DIR, `${cocktail.id}.jpg`)

    if (skipExisting && existsSync(dest)) {
      skipped++
      continue
    }

    if (!cocktail.imageUrl) {
      console.log(`  Skipping ${cocktail.name} — no image URL`)
      failed++
      continue
    }

    try {
      console.log(`  Downloading image for ${cocktail.name}…`)
      await downloadFile(cocktail.imageUrl, dest)
      downloaded++
    } catch (err) {
      console.error(`  Failed to download image for ${cocktail.name}: ${err.message}`)
      failed++
    }

    await sleep(COOLDOWN_MS)
  }

  console.log(`\nImages: ${downloaded} downloaded, ${skipped} skipped, ${failed} failed`)
}

async function main() {
  const args = process.argv.slice(2)
  const skipImages = args.includes('--no-images')

  console.log('Fetching all cocktails from TheCocktailDB (free API)…\n')
  const raw = await fetchAllCocktails()

  console.log(`\nTotal unique cocktails fetched: ${raw.length}`)
  console.log('Processing cocktail data…\n')

  const cocktails = raw.map((drink) => {
    const id = slugify(drink.strDrink)
    const name = drink.strDrink
    const popularityTier = getPopularityTier(name)
    const aliases = buildAliases(name)
    const ingredients = extractIngredients(drink)

    return {
      id,
      name,
      aliases,
      category: drink.strCategory ?? 'Cocktail',
      alcoholic: drink.strAlcoholic ?? 'Alcoholic',
      imageLocalPath: `/cocktails/${id}.jpg`,
      imageUrl: drink.strDrinkThumb,
      ingredients,
      popularityTier,
    }
  }).sort((a, b) => a.name.localeCompare(b.name))

  const popularCount = cocktails.filter((c) => c.popularityTier === 'popular').length
  const commonCount = cocktails.filter((c) => c.popularityTier === 'common').length
  const obscureCount = cocktails.filter((c) => c.popularityTier === 'obscure').length

  console.log(`Popularity breakdown: ${popularCount} popular, ${commonCount} common, ${obscureCount} obscure`)

  if (!skipImages) {
    console.log('\nDownloading cocktail images…')
    await downloadImages(cocktails)
  }

  console.log('\nGenerating cocktails.ts data file…')
  const fileContent = generateDataFile(cocktails)
  await writeFile(DATA_FILE, fileContent, 'utf8')

  console.log(`\nDone! Generated ${DATA_FILE}`)
  console.log(`Total cocktails in catalog: ${cocktails.length}`)
  console.log('\nNext steps:')
  console.log('  1. Review src/features/guess-the-cocktail/data/cocktails.ts')
  console.log('  2. Adjust popularityTier assignments if needed')
  console.log('  3. Run npm run check to verify everything compiles')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
