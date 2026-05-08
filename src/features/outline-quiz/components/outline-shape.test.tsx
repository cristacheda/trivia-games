import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { OutlineShape } from '@/features/outline-quiz/components/outline-shape'
import type { OutlineQuestionSource } from '@/features/outline-quiz/types'

const subject: OutlineQuestionSource = {
  code: 'RO',
  kind: 'country',
  name: 'Romania',
  officialName: 'Romania',
  aliases: ['Romania'],
  region: 'Europe',
  subregion: 'Eastern Europe',
  population: 19_000_000,
  area: 238_397,
  familiarityBand: 'common',
  flagEmoji: '🇷🇴',
  outlinePath: 'M0 0 L10 0 L10 10 Z',
  outlineViewBox: '0 0 10 10',
  baseWeight: 1,
  hardWeight: 1,
}

describe('OutlineShape', () => {
  it('renders the source path without rounded stroke styling', () => {
    render(<OutlineShape subject={subject} />)

    const svg = screen.getByRole('img', { name: 'Romania outline' })
    const path = svg.querySelector('path')

    expect(svg).toHaveAttribute('viewBox', subject.outlineViewBox)
    expect(path).not.toBeNull()
    expect(path).toHaveAttribute('d', subject.outlinePath)
    expect(path).toHaveAttribute('fill', 'currentColor')
    expect(path).not.toHaveAttribute('stroke')
    expect(path).not.toHaveAttribute('stroke-linecap')
    expect(path).not.toHaveAttribute('stroke-linejoin')
  })
})
