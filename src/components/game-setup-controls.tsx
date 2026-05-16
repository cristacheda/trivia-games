import type { ElementType } from 'react'
import { Button } from '@/components/ui/button'
import {
  QUESTION_COUNT_OPTIONS,
  type QuestionCount,
} from '@/lib/question-count'
import { cn } from '@/lib/utils'

interface GameSetupControlsProps {
  questionCount: QuestionCount
  soundButtonLabel: string
  soundEnabled: boolean
  soundIcon: ElementType
  onQuestionCountChange: (questionCount: QuestionCount) => void
  onToggleSound: () => void
}

export function GameSetupControls({
  questionCount,
  soundButtonLabel,
  soundEnabled,
  soundIcon: SoundIcon,
  onQuestionCountChange,
  onToggleSound,
}: GameSetupControlsProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="flex flex-wrap items-center gap-2 rounded-[24px] border border-border bg-white/70 p-2">
        <span className="px-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Rounds
        </span>
        {QUESTION_COUNT_OPTIONS.map((option) => {
          const isSelected = option === questionCount

          return (
            <button
              aria-pressed={isSelected}
              className={cn(
                'min-w-11 rounded-full px-3 py-2 text-sm font-semibold transition',
                isSelected
                  ? 'bg-primary text-primary-foreground shadow-[0_10px_24px_-16px_rgba(31,122,69,0.9)]'
                  : 'bg-white text-foreground hover:bg-secondary',
              )}
              data-testid={`question-count-${option}`}
              key={option}
              onClick={() => onQuestionCountChange(option)}
              type="button"
            >
              {option}
            </button>
          )
        })}
      </div>
      <Button
        aria-pressed={soundEnabled}
        className="w-full justify-center sm:w-auto"
        data-testid="sound-toggle"
        onClick={onToggleSound}
        type="button"
        variant="outline"
      >
        <SoundIcon className="h-4 w-4" />
        {soundButtonLabel}
      </Button>
    </div>
  )
}
