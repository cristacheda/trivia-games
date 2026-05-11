import { cn } from '@/lib/utils'

interface CountryFlagProps {
  countryCode: string
  label: string
  className?: string
}

const flagModules = import.meta.glob<string>('/node_modules/flag-icons/flags/4x3/*.svg', {
  query: '?raw',
  eager: true,
  import: 'default',
})

const flagSvgMap: Record<string, string> = Object.fromEntries(
  Object.entries(flagModules).map(([path, svg]) => {
    const code = path.replace(/.*\/([a-z]+)\.svg$/, '$1').toUpperCase()
    return [code, svg]
  }),
)

const blobUrlCache = new Map<string, string>()

function getFlagBlobUrl(countryCode: string): string | null {
  const svg = flagSvgMap[countryCode]
  if (!svg) return null
  const cached = blobUrlCache.get(countryCode)
  if (cached) return cached
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  blobUrlCache.set(countryCode, url)
  return url
}

export function CountryFlag({
  countryCode,
  label,
  className,
}: CountryFlagProps) {
  const blobUrl = getFlagBlobUrl(countryCode)

  if (!blobUrl) {
    return (
      <div
        aria-label={label}
        className={cn(
          'flex aspect-[3/2] items-center justify-center bg-secondary text-4xl',
          className,
        )}
      >
        🏳️
      </div>
    )
  }

  return (
    <img
      alt={label}
      className={cn('block aspect-[3/2] w-full', className)}
      src={blobUrl}
    />
  )
}
