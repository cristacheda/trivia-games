import * as FlagIcons from 'country-flag-icons/react/3x2'
import { cn } from '@/lib/utils'

interface CountryFlagProps {
  countryCode: string
  label: string
  className?: string
}

export function CountryFlag({
  countryCode,
  label,
  className,
}: CountryFlagProps) {
  const Flag = FlagIcons[countryCode as keyof typeof FlagIcons]

  if (!Flag) {
    return (
      <div
        aria-label={label}
        className={cn(
          'flex aspect-[4/3] items-center justify-center rounded-2xl bg-secondary text-4xl',
          className,
        )}
      >
        🏳️
      </div>
    )
  }

  return <Flag aria-label={label} className={cn('aspect-[4/3] w-full rounded-2xl object-cover', className)} />
}
