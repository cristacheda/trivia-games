import { useEffect, useState } from 'react'
import * as FlagSvgs from 'country-flag-icons/string/3x2'
import { cn } from '@/lib/utils'

interface CountryFlagProps {
  countryCode: string
  label: string
  className?: string
}

interface RasterizedFlagState {
  countryCode: string
  src: string
}

const FLAG_WIDTH = 640
const FLAG_HEIGHT = Math.round((FLAG_WIDTH * 2) / 3)
const flagPngCache = new Map<string, string>()

function rasterizeFlagSvg(svgMarkup: string) {
  return new Promise<string>((resolve, reject) => {
    const image = new Image()
    const canvas = document.createElement('canvas')
    canvas.width = FLAG_WIDTH
    canvas.height = FLAG_HEIGHT

    const context = canvas.getContext('2d')

    if (!context) {
      reject(new Error('Unable to create a 2D context for flag rasterization.'))
      return
    }

    const blob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' })
    const objectUrl = URL.createObjectURL(blob)

    image.onload = () => {
      context.clearRect(0, 0, FLAG_WIDTH, FLAG_HEIGHT)
      context.drawImage(image, 0, 0, FLAG_WIDTH, FLAG_HEIGHT)
      URL.revokeObjectURL(objectUrl)
      resolve(canvas.toDataURL('image/png'))
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Unable to load flag SVG for rasterization.'))
    }

    image.src = objectUrl
  })
}

export function CountryFlag({
  countryCode,
  label,
  className,
}: CountryFlagProps) {
  const svgMarkup = FlagSvgs[countryCode as keyof typeof FlagSvgs]
  const [rasterizedFlag, setRasterizedFlag] =
    useState<RasterizedFlagState | null>(null)
  const cachedFlag = flagPngCache.get(countryCode) ?? null
  const pngSrc =
    cachedFlag ??
    (rasterizedFlag?.countryCode === countryCode ? rasterizedFlag.src : null)

  useEffect(() => {
    let cancelled = false

    if (!svgMarkup) {
      return
    }

    if (cachedFlag) {
      return
    }

    void rasterizeFlagSvg(svgMarkup)
      .then((nextPngSrc) => {
        if (cancelled) {
          return
        }

        flagPngCache.set(countryCode, nextPngSrc)
        setRasterizedFlag({ countryCode, src: nextPngSrc })
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [cachedFlag, countryCode, svgMarkup])

  if (!svgMarkup || !pngSrc) {
    return (
      <div
        aria-label={label}
        className={cn(
          'flex aspect-[3/2] items-center justify-center rounded-2xl bg-secondary text-4xl',
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
      className={cn('block aspect-[3/2] w-full rounded-2xl', className)}
      height={FLAG_HEIGHT}
      src={pngSrc}
      width={FLAG_WIDTH}
    />
  )
}
