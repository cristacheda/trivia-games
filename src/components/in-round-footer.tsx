import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface InRoundFooterProps {
  questionLabel: string
  hasTimeLimit: boolean
  timeLimitLabel?: string
  timeLeftLabel?: string
  timerPercent?: number
  progressValue: number
  onBack: () => void
  className?: string
}

export function InRoundFooter({
  questionLabel,
  hasTimeLimit,
  timeLimitLabel,
  timeLeftLabel,
  timerPercent = 0,
  progressValue,
  onBack,
  className,
}: InRoundFooterProps) {
  return (
    <div className={cn('fixed inset-x-0 bottom-0 z-30 px-3 pb-3 sm:px-4 sm:pb-4', className)}>
      <div className="w-full">
        <div
          className="rounded-[28px] border border-white/70 bg-[#f7fbf6]/95 p-3 shadow-[0_-10px_40px_-24px_rgba(12,49,33,0.45)] backdrop-blur-xl"
          style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="flex items-center justify-between gap-3">
            <Button data-testid="in-round-back-button" onClick={onBack} type="button" variant="outline">
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            <span
              className="text-right text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground"
              data-testid="question-progress-footer"
            >
              {questionLabel}
            </span>
          </div>

          <div className="mt-3 space-y-3">
            {hasTimeLimit ? (
              <>
                <div className="flex items-center justify-between text-sm font-semibold text-muted-foreground">
                  <span>{timeLimitLabel}</span>
                  <span>{timeLeftLabel}</span>
                </div>
                <Progress
                  data-testid="timer-progress-footer"
                  indicatorClassName={
                    timerPercent < 25
                      ? 'bg-danger'
                      : timerPercent < 50
                        ? 'bg-accent'
                        : 'bg-primary'
                  }
                  value={timerPercent}
                />
              </>
            ) : (
              <div
                className="flex items-center justify-between text-sm font-semibold text-muted-foreground"
                data-testid="learning-mode-footer"
              >
                <span>Learning mode</span>
                <span>No time limit</span>
              </div>
            )}

            <Progress className="h-1.5" data-testid="round-progress-footer" value={progressValue} />
          </div>
        </div>
      </div>
    </div>
  )
}
