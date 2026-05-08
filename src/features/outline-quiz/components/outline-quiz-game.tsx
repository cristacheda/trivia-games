import {
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import { RotateCcw, Trophy, Volume2, VolumeX } from 'lucide-react'
import { useAppServices } from '@/app/app-providers'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { ConfettiLayer } from '@/features/flag-quiz/components/confetti-layer'
import { getDebugSettings } from '@/lib/debug'
import { playSoundCue, primeSound } from '@/lib/sound'
import {
  getAppPreferences,
  getGameStats,
  getPlayerId,
  recordRoundResult,
  reserveOutlineQuizSubjects,
  setLastDifficulty,
  setSoundEnabled,
  useGameStats,
  useSoundEnabled,
} from '@/lib/storage'
import { cn } from '@/lib/utils'
import type { DifficultyRule, RoundResult } from '@/types/game'
import {
  getOutlineQuizDifficultyRule,
  outlineQuizDifficultyRules,
  OUTLINE_QUIZ_COUNTRIES_PER_ROUND,
  OUTLINE_QUIZ_GAME_ID,
  OUTLINE_QUIZ_QUESTIONS_PER_ROUND,
  OUTLINE_QUIZ_STATES_PER_ROUND,
} from '@/features/outline-quiz/constants'
import { isAcceptableOutlineAnswer } from '@/features/outline-quiz/lib/match'
import { buildOutlineQuizRoundFromSubjects } from '@/features/outline-quiz/lib/round'
import { OutlineShape } from '@/features/outline-quiz/components/outline-shape'
import type {
  OutlineQuestionSource,
  OutlineQuizQuestion,
} from '@/features/outline-quiz/types'
import { scoreAnswer } from '@/features/flag-quiz/lib/scoring'

type Phase = 'setup' | 'question' | 'results'
type Resolution = 'idle' | 'correct' | 'wrong' | 'timeout'

interface OutlineQuizGameProps {
  onPhaseChange?: (phase: Phase) => void
}

function getResolutionMessage(
  resolution: Resolution,
  currentQuestion: OutlineQuizQuestion,
  difficulty: DifficultyRule,
) {
  if (resolution === 'correct') {
    return `Correct. +${difficulty.pointsPerCorrect} points.`
  }

  if (resolution === 'wrong') {
    return `Not this time. The correct answer was ${currentQuestion.subject.name}.`
  }

  if (resolution === 'timeout') {
    return `Time ran out. The correct answer was ${currentQuestion.subject.name}.`
  }

  return null
}

function formatOutlineAnswerLabel(subject: OutlineQuestionSource) {
  return subject.kind === 'country' && subject.flagEmoji
    ? `${subject.name} ${subject.flagEmoji}`
    : subject.name
}

function shuffleSubjects(values: OutlineQuestionSource[]) {
  const result = [...values]

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[swapIndex]] = [result[swapIndex], result[index]]
  }

  return result
}

export function OutlineQuizGame({ onPhaseChange }: OutlineQuizGameProps) {
  const stats = useGameStats(OUTLINE_QUIZ_GAME_ID)
  const soundEnabled = useSoundEnabled()
  const initialDifficulty =
    getGameStats(OUTLINE_QUIZ_GAME_ID).lastDifficulty ?? 'level-1'
  const [selectedDifficultyId, setSelectedDifficultyId] =
    useState(initialDifficulty)
  const [phase, setPhase] = useState<Phase>('setup')
  const [questions, setQuestions] = useState<OutlineQuizQuestion[]>([])
  const [questionIndex, setQuestionIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [remainingMs, setRemainingMs] = useState(0)
  const [resolution, setResolution] = useState<Resolution>('idle')
  const [selectedOptionCode, setSelectedOptionCode] = useState<string | null>(null)
  const [textAnswer, setTextAnswer] = useState('')
  const [result, setResult] = useState<RoundResult | null>(null)
  const [correctBurstCounter, setCorrectBurstCounter] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const advanceTimeoutRef = useRef<number | null>(null)
  const { analytics, scoreSync } = useAppServices()
  const difficulty = useMemo(
    () => getOutlineQuizDifficultyRule(selectedDifficultyId),
    [selectedDifficultyId],
  )
  const currentQuestion = questions[questionIndex]
  const progressValue = questions.length
    ? ((questionIndex + 1) / questions.length) * 100
    : 0
  const timerScale = getDebugSettings().timerScale
  const revealAnswers = getDebugSettings().revealAnswers
  const hasTimeLimit = difficulty.timeLimitSeconds !== null
  const isFeedbackLocked = resolution !== 'idle'
  const highScoreCelebrationMs =
    phase === 'results' && result?.beatHighScore ? 10000 : 0

  const finishRound = useCallback(
    async (nextScore: number, nextCorrectAnswers: number) => {
      const stored = recordRoundResult({
        gameId: OUTLINE_QUIZ_GAME_ID,
        difficultyId: selectedDifficultyId,
        totalScore: nextScore,
        correctAnswers: nextCorrectAnswers,
        totalQuestions: questions.length,
        completedAt: new Date().toISOString(),
      })

      analytics.trackEvent('round_completed', {
        gameId: OUTLINE_QUIZ_GAME_ID,
        score: stored.totalScore,
        correctAnswers: stored.correctAnswers,
        beatHighScore: stored.beatHighScore,
      })

      if (stored.beatHighScore) {
        analytics.trackEvent('high_score_beaten', {
          gameId: OUTLINE_QUIZ_GAME_ID,
          score: stored.totalScore,
        })
      }

      if (getAppPreferences().soundEnabled) {
        void playSoundCue(stored.beatHighScore ? 'high-score' : 'finish')
      }

      await scoreSync.syncRoundResult(stored)
      setResult(stored)
      setPhase('results')
      setResolution('idle')
      setSelectedOptionCode(null)
      setTextAnswer('')
    },
    [analytics, questions.length, scoreSync, selectedDifficultyId],
  )

  const goToNextQuestion = useCallback(
    (nextScore: number, nextCorrectAnswers: number) => {
      if (questionIndex >= questions.length - 1) {
        void finishRound(nextScore, nextCorrectAnswers)
        return
      }

      setQuestionIndex((current) => current + 1)
      setRemainingMs(
        difficulty.timeLimitSeconds === null
          ? 0
          : difficulty.timeLimitSeconds * 1000 * timerScale,
      )
      setResolution('idle')
      setSelectedOptionCode(null)
      setTextAnswer('')
    },
    [difficulty.timeLimitSeconds, finishRound, questionIndex, questions.length, timerScale],
  )

  const handleAnswer = useCallback(
    (
      isCorrect: boolean,
      answerLabel?: string,
      nextResolution: Resolution = isCorrect ? 'correct' : 'wrong',
    ) => {
      if (!currentQuestion || resolution !== 'idle') {
        return
      }

      const points = scoreAnswer(isCorrect, difficulty)
      const nextScore = score + points
      const nextCorrectAnswers = correctAnswers + (isCorrect ? 1 : 0)

      setScore(nextScore)
      setCorrectAnswers(nextCorrectAnswers)
      setResolution(nextResolution)
      setSelectedOptionCode(
        answerLabel && difficulty.answerMode === 'multiple-choice'
          ? currentQuestion.options.find((option) => option.name === answerLabel)
              ?.code ?? null
          : null,
      )

      if (isCorrect) {
        setCorrectBurstCounter((current) => current + 1)
      }

      if (getAppPreferences().soundEnabled) {
        void playSoundCue(isCorrect ? 'correct' : 'wrong')
      }

      analytics.trackEvent('question_answered', {
        gameId: OUTLINE_QUIZ_GAME_ID,
        difficultyId: selectedDifficultyId,
        answerMode: difficulty.answerMode,
        isCorrect,
        answerLabel: answerLabel ?? '',
      })

      advanceTimeoutRef.current = window.setTimeout(() => {
        goToNextQuestion(nextScore, nextCorrectAnswers)
      }, 900)
    },
    [
      analytics,
      correctAnswers,
      currentQuestion,
      difficulty,
      goToNextQuestion,
      resolution,
      score,
      selectedDifficultyId,
    ],
  )

  useEffect(() => {
    if (
      phase === 'question' &&
      difficulty.answerMode === 'free-text' &&
      currentQuestion
    ) {
      requestAnimationFrame(() => inputRef.current?.focus())
    } else {
      inputRef.current?.blur()
    }
  }, [currentQuestion, difficulty.answerMode, phase])

  useEffect(() => {
    if (
      phase !== 'question' ||
      !currentQuestion ||
      resolution !== 'idle' ||
      difficulty.timeLimitSeconds === null
    ) {
      return
    }

    const deadline = Date.now() + difficulty.timeLimitSeconds * 1000 * timerScale
    const interval = window.setInterval(() => {
      const nextRemaining = Math.max(0, deadline - Date.now())
      setRemainingMs(nextRemaining)

      if (nextRemaining <= 0) {
        window.clearInterval(interval)
        handleAnswer(false, undefined, 'timeout')
      }
    }, 100)

    return () => window.clearInterval(interval)
  }, [
    currentQuestion,
    difficulty.timeLimitSeconds,
    handleAnswer,
    phase,
    resolution,
    timerScale,
  ])

  useEffect(() => {
    return () => {
      if (advanceTimeoutRef.current) {
        window.clearTimeout(advanceTimeoutRef.current)
      }
    }
  }, [])

  const startRound = () => {
    const rule = getOutlineQuizDifficultyRule(selectedDifficultyId)
    if (getAppPreferences().soundEnabled) {
      void primeSound()
    }
    setLastDifficulty(OUTLINE_QUIZ_GAME_ID, selectedDifficultyId)
    const reservedSubjects = reserveOutlineQuizSubjects(
      OUTLINE_QUIZ_COUNTRIES_PER_ROUND,
      OUTLINE_QUIZ_STATES_PER_ROUND,
      selectedDifficultyId,
    )

    setQuestions(
      buildOutlineQuizRoundFromSubjects(
        rule,
        shuffleSubjects([
          ...reservedSubjects.countries,
          ...reservedSubjects.states,
        ]),
      ),
    )
    setQuestionIndex(0)
    setScore(0)
    setCorrectAnswers(0)
    setRemainingMs(
      rule.timeLimitSeconds === null ? 0 : rule.timeLimitSeconds * 1000 * timerScale,
    )
    setResolution('idle')
    setSelectedOptionCode(null)
    setTextAnswer('')
    setResult(null)
    setPhase('question')

    analytics.trackEvent('game_started', {
      gameId: OUTLINE_QUIZ_GAME_ID,
      difficultyId: selectedDifficultyId,
      playerId: getPlayerId(),
    })
  }

  useEffect(() => {
    onPhaseChange?.(phase)
  }, [onPhaseChange, phase])

  const submitTextAnswer = (event: FormEvent) => {
    event.preventDefault()
    if (!currentQuestion) {
      return
    }

    handleAnswer(
      isAcceptableOutlineAnswer(textAnswer, currentQuestion.subject),
      textAnswer,
    )
  }

  const toggleSound = async () => {
    const nextSoundEnabled = !soundEnabled
    setSoundEnabled(nextSoundEnabled)

    if (nextSoundEnabled) {
      await primeSound()
      await playSoundCue('correct')
    }
  }

  const SoundIcon = soundEnabled ? Volume2 : VolumeX
  const soundButtonLabel = soundEnabled ? 'Sound on' : 'Sound off'

  if (phase === 'setup') {
    return (
      <>
        <ConfettiLayer
          burstKey={correctBurstCounter}
          celebrationMs={highScoreCelebrationMs}
        />
        <Card className="border-primary/10">
          <CardHeader className="gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success">Playable today</Badge>
              <Badge variant="outline">
                {OUTLINE_QUIZ_QUESTIONS_PER_ROUND} outlines per round
              </Badge>
              <Badge variant="outline">18 countries + 2 US states</Badge>
              <Badge variant="outline">Anonymous progress saved locally</Badge>
            </div>
            <CardTitle>Read the shape before the options read you</CardTitle>
            <CardDescription>
              Each round cycles through UN countries and US states without repeats,
              with harder levels leaning into smaller and less familiar outlines.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-3">
              {outlineQuizDifficultyRules.map((rule) => {
                const isSelected = rule.id === selectedDifficultyId

                return (
                  <button
                    className={`rounded-[26px] border p-5 text-left transition ${
                      isSelected
                        ? 'border-primary/40 bg-primary/10 shadow-lg shadow-primary/10'
                        : 'border-border bg-white/60 hover:border-primary/30 hover:bg-white'
                    }`}
                    data-testid={`difficulty-${rule.id}`}
                    key={rule.id}
                    onClick={() => setSelectedDifficultyId(rule.id)}
                    type="button"
                  >
                    <p className="font-serif text-xl font-semibold">{rule.label}</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {rule.prompt}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      <span>
                        {rule.timeLimitSeconds === null
                          ? 'No timer'
                          : `${rule.timeLimitSeconds}s`}
                      </span>
                      <span>{rule.pointsPerCorrect} pts</span>
                      <span>
                        {rule.optionCount === null
                          ? 'Typed answer'
                          : `${rule.optionCount} options`}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="grid gap-4 rounded-[26px] bg-secondary/75 p-5 md:grid-cols-3">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
                  Best score
                </p>
                <p className="mt-2 font-serif text-3xl font-semibold">
                  {stats.highScore?.score ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
                  Last result
                </p>
                <p className="mt-2 text-lg font-semibold">
                  {stats.recentResult
                    ? `${stats.recentResult.totalScore} points`
                    : 'No rounds yet'}
                </p>
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
                  Practice profile
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Stored locally as {getPlayerId().slice(0, 8)}...
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                className="w-full sm:w-auto"
                data-testid="start-round"
                onClick={startRound}
                size="lg"
              >
                Start round
              </Button>
              <Button
                aria-pressed={soundEnabled}
                className="w-full justify-center sm:w-auto"
                data-testid="sound-toggle"
                onClick={() => void toggleSound()}
                type="button"
                variant="outline"
              >
                <SoundIcon className="h-4 w-4" />
                {soundButtonLabel}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Harder levels sharply reduce familiar European countries and pull in
              more tricky island nations, microstates, and less obvious US states.
            </p>
          </CardContent>
        </Card>
      </>
    )
  }

  if (phase === 'results' && result) {
    return (
      <>
        <ConfettiLayer
          burstKey={correctBurstCounter}
          celebrationMs={highScoreCelebrationMs}
        />
        <Card className="border-primary/10">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success">
                <Trophy className="h-3.5 w-3.5" />
                Round complete
              </Badge>
              {result.beatHighScore ? <Badge>New high score</Badge> : null}
            </div>
            <CardTitle data-testid="result-score">{result.totalScore} points</CardTitle>
            <CardDescription>
              {result.correctAnswers} correct answers across {result.totalQuestions}{' '}
              outlines on {getOutlineQuizDifficultyRule(result.difficultyId).label}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="bg-white/75">
                <CardContent className="p-5">
                  <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
                    Previous best
                  </p>
                  <p className="mt-2 font-serif text-3xl font-semibold">
                    {result.previousBestScore ?? '—'}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-white/75">
                <CardContent className="p-5">
                  <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
                    Current round
                  </p>
                  <p className="mt-2 font-serif text-3xl font-semibold">
                    {result.totalScore}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-white/75">
                <CardContent className="p-5">
                  <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
                    Difficulty
                  </p>
                  <p className="mt-2 font-serif text-3xl font-semibold">
                    {getOutlineQuizDifficultyRule(result.difficultyId).label}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button data-testid="play-again" onClick={startRound}>
                <RotateCcw className="h-4 w-4" />
                Play again
              </Button>
              <Button onClick={() => setPhase('setup')} variant="outline">
                Change difficulty
              </Button>
            </div>
          </CardContent>
        </Card>
      </>
    )
  }

  if (!currentQuestion) {
    return null
  }

  const timeLimitMs =
    difficulty.timeLimitSeconds === null
      ? 0
      : difficulty.timeLimitSeconds * 1000 * timerScale
  const timerPercent = timeLimitMs ? (remainingMs / timeLimitMs) * 100 : 0
  const resolutionMessage = getResolutionMessage(
    resolution,
    currentQuestion,
    difficulty,
  )

  return (
    <>
      <ConfettiLayer
        burstKey={correctBurstCounter}
        celebrationMs={highScoreCelebrationMs}
      />
      <Card className="border-primary/10">
        <CardHeader className="gap-4 pb-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <Badge data-testid="question-progress" variant="outline">
                Question {questionIndex + 1} / {questions.length}
              </Badge>
              <Badge variant="outline">{difficulty.label}</Badge>
              <Badge variant="outline">
                {currentQuestion.subject.kind === 'country' ? 'Country' : 'US state'}
              </Badge>
            </div>
            <div className="flex items-start gap-2">
              <Button
                aria-label={soundButtonLabel}
                aria-pressed={soundEnabled}
                className="shrink-0"
                data-testid="in-round-sound-toggle"
                onClick={() => void toggleSound()}
                size="sm"
                type="button"
                variant="outline"
              >
                <SoundIcon className="h-4 w-4" />
                <span className="sr-only">{soundButtonLabel}</span>
              </Button>
              <div className="text-right">
                <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
                  Score
                </p>
                <p
                  className="font-serif text-3xl font-semibold"
                  data-testid="live-score"
                >
                  {score}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {hasTimeLimit ? (
              <>
                <div className="flex items-center justify-between text-sm font-semibold text-muted-foreground">
                  <span>{difficulty.timeLimitSeconds}s limit</span>
                  <span>{Math.ceil(remainingMs / 1000)}s left</span>
                </div>
                <Progress
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
              <div className="flex items-center justify-between text-sm font-semibold text-muted-foreground">
                <span>Learning mode</span>
                <span>No time limit</span>
              </div>
            )}
            <Progress className="h-1.5" value={progressValue} />
          </div>
        </CardHeader>

        <CardContent className="space-y-5" data-testid="question-card">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:items-stretch">
            <div className="space-y-4">
              <div className="overflow-hidden rounded-[28px] bg-[linear-gradient(180deg,rgba(255,255,255,0.9)_0%,rgba(235,246,237,0.98)_100%)] p-4 shadow-inner sm:p-6">
                <OutlineShape
                  className="mx-auto h-[18rem] w-full max-w-xl text-[#103826] sm:h-[22rem]"
                  subject={currentQuestion.subject}
                />
              </div>
              <div className="rounded-[24px] bg-secondary/75 p-4 text-sm text-muted-foreground">
                {hasTimeLimit
                  ? 'Move quickly. Level 2 rewards fast pattern recognition on mixed country and state outlines.'
                  : 'Take your time. Harder levels still bias toward less familiar geography even without a timer.'}
              </div>
            </div>

            <div className="flex flex-col justify-between gap-4">
              {difficulty.answerMode === 'multiple-choice' ? (
                <div className="grid gap-3">
                  {currentQuestion.options.map((option) => {
                    const isCorrect = option.code === currentQuestion.subject.code
                    const isSelectedWrong =
                      selectedOptionCode === option.code && resolution === 'wrong'
                    const isRevealedCorrect =
                      isCorrect &&
                      (resolution === 'correct' ||
                        resolution === 'wrong' ||
                        resolution === 'timeout')

                    return (
                      <Button
                        className={cn(
                          'h-auto min-h-14 justify-start rounded-[22px] px-5 py-4 text-left text-base',
                          isSelectedWrong &&
                            'border-danger bg-danger/12 text-danger hover:bg-danger/12',
                          isRevealedCorrect &&
                            'border-success bg-success/12 text-success hover:bg-success/12',
                        )}
                        data-correct={
                          revealAnswers && isCorrect ? 'true' : undefined
                        }
                        data-feedback={
                          isSelectedWrong
                            ? 'wrong'
                            : isRevealedCorrect
                              ? 'correct'
                              : 'idle'
                        }
                        data-testid={`answer-${option.code}`}
                        key={option.code}
                        onClick={() => handleAnswer(isCorrect, option.name)}
                        disabled={isFeedbackLocked}
                        type="button"
                        variant="outline"
                      >
                        <span className="text-base">
                          {formatOutlineAnswerLabel(option)}
                        </span>
                      </Button>
                    )
                  })}
                </div>
              ) : (
                <form
                  className="space-y-3 rounded-[26px] bg-white/75 p-4"
                  onSubmit={submitTextAnswer}
                >
                  <label
                    className="block text-sm font-semibold text-muted-foreground"
                    htmlFor="outline-answer"
                  >
                    Type the {currentQuestion.subject.kind === 'country' ? 'country' : 'state'} name
                  </label>
                  <Input
                    autoCapitalize="words"
                    autoComplete="off"
                    autoCorrect="off"
                    data-answer={
                      revealAnswers ? currentQuestion.subject.name : undefined
                    }
                    id="outline-answer"
                    onChange={(event) => setTextAnswer(event.target.value)}
                    placeholder="Start typing…"
                    ref={inputRef}
                    value={textAnswer}
                    disabled={isFeedbackLocked}
                  />
                  <Button
                    className="w-full"
                    disabled={!textAnswer.trim() || isFeedbackLocked}
                    type="submit"
                  >
                    Lock answer
                  </Button>
                </form>
              )}

              <div className="rounded-[24px] border border-border bg-white/75 p-4">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
                      Current best
                    </p>
                    <p className="mt-2 font-serif text-3xl font-semibold">
                      {stats.highScore?.score ?? '—'}
                    </p>
                  </div>
                  <p className="max-w-[11rem] text-right text-sm text-muted-foreground">
                    {Math.max((stats.highScore?.score ?? 0) - score + 1, 0)} points to a
                    new record
                  </p>
                </div>
              </div>
            </div>
          </div>

          {resolutionMessage ? (
            <div
              data-testid="resolution-message"
              className={`rounded-[22px] px-4 py-3 text-sm font-semibold ${
                resolution === 'correct'
                  ? 'bg-success/10 text-success'
                  : 'bg-accent/10 text-accent'
              }`}
            >
              {resolutionMessage}
            </div>
          ) : null}
          {difficulty.answerMode === 'free-text' &&
          (resolution === 'wrong' || resolution === 'timeout') ? (
            <div
              className="rounded-[22px] border border-success/25 bg-success/10 px-4 py-3 text-sm font-semibold text-success"
              data-testid="revealed-correct-answer"
            >
              Correct answer: {currentQuestion.subject.name}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </>
  )
}
