import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import { RotateCcw, Trophy, Volume2, VolumeX } from 'lucide-react'
import { useAppServices } from '@/app/app-providers'
import { ConfettiLayer } from '@/components/confetti-layer'
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
import {
  getGuessTheCapitalDifficultyRule,
  guessTheCapitalDifficultyRules,
  GUESS_THE_CAPITAL_COUNTRIES_PER_ROUND,
  GUESS_THE_CAPITAL_GAME_ID,
  GUESS_THE_CAPITAL_STATES_PER_ROUND,
} from '@/features/guess-the-capital/constants'
import { isAcceptableCapitalAnswer } from '@/features/guess-the-capital/lib/match'
import { buildGuessTheCapitalRound } from '@/features/guess-the-capital/lib/round'
import type { GuessTheCapitalQuestion } from '@/features/guess-the-capital/types'
import { getDebugSettings } from '@/lib/debug'
import { getAnswerAdvanceDelayMs } from '@/lib/gameplay'
import { playSoundCue, primeSound } from '@/lib/sound'
import {
  getAppPreferences,
  getGameStats,
  getPlayerId,
  recordRoundResult,
  reserveGuessTheCapitalSubjects,
  setLastDifficulty,
  setSoundEnabled,
  useGameStats,
  useSoundEnabled,
} from '@/lib/storage'
import { cn } from '@/lib/utils'
import type { DifficultyRule, RoundResult } from '@/types/game'

type Phase = 'setup' | 'question' | 'results'
type Resolution = 'idle' | 'correct' | 'wrong' | 'timeout'

interface GuessTheCapitalGameProps {
  onPhaseChange?: (phase: Phase) => void
}

function scoreAnswer(isCorrect: boolean, difficulty: DifficultyRule) {
  return isCorrect ? difficulty.pointsPerCorrect : 0
}

function getResolutionMessage(
  resolution: Resolution,
  currentQuestion: GuessTheCapitalQuestion,
  difficulty: DifficultyRule,
) {
  if (resolution === 'correct') {
    return `Correct. +${difficulty.pointsPerCorrect} points.`
  }

  if (resolution === 'wrong') {
    return `Not this time. The correct answer was ${currentQuestion.subject.capital}.`
  }

  if (resolution === 'timeout') {
    return `Time ran out. The correct answer was ${currentQuestion.subject.capital}.`
  }

  return null
}

export function GuessTheCapitalGame({
  onPhaseChange,
}: GuessTheCapitalGameProps) {
  const stats = useGameStats(GUESS_THE_CAPITAL_GAME_ID)
  const soundEnabled = useSoundEnabled()
  const initialDifficulty =
    getGameStats(GUESS_THE_CAPITAL_GAME_ID).lastDifficulty ?? 'level-1'
  const [selectedDifficultyId, setSelectedDifficultyId] =
    useState(initialDifficulty)
  const [phase, setPhase] = useState<Phase>('setup')
  const [questions, setQuestions] = useState<GuessTheCapitalQuestion[]>([])
  const [questionIndex, setQuestionIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [remainingMs, setRemainingMs] = useState(0)
  const [resolution, setResolution] = useState<Resolution>('idle')
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [textAnswer, setTextAnswer] = useState('')
  const [result, setResult] = useState<RoundResult | null>(null)
  const [correctBurstCounter, setCorrectBurstCounter] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const advanceTimeoutRef = useRef<number | null>(null)
  const roundStartedAtRef = useRef<number | null>(null)
  const timeoutCountRef = useRef(0)
  const { analytics, scoreSync } = useAppServices()
  const difficulty = getGuessTheCapitalDifficultyRule(selectedDifficultyId)
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
      const roundDurationSeconds = roundStartedAtRef.current
        ? Math.max(1, Math.round((Date.now() - roundStartedAtRef.current) / 1000))
        : 0
      const stored = recordRoundResult({
        gameId: GUESS_THE_CAPITAL_GAME_ID,
        difficultyId: selectedDifficultyId,
        totalScore: nextScore,
        correctAnswers: nextCorrectAnswers,
        totalQuestions: questions.length,
        completedAt: new Date().toISOString(),
      })

      analytics.trackEvent('round_completed', {
        accuracy: Number((nextCorrectAnswers / questions.length).toFixed(4)),
        answer_mode: difficulty.answerMode,
        beat_high_score: stored.beatHighScore,
        correct_answers: stored.correctAnswers,
        difficulty_id: selectedDifficultyId,
        game_id: GUESS_THE_CAPITAL_GAME_ID,
        round_duration_seconds: roundDurationSeconds,
        score: stored.totalScore,
        timeouts_count: timeoutCountRef.current,
        total_questions: stored.totalQuestions,
      })

      if (stored.beatHighScore) {
        analytics.trackEvent('high_score_beaten', {
          difficulty_id: selectedDifficultyId,
          game_id: GUESS_THE_CAPITAL_GAME_ID,
          previous_best_score: stored.previousBestScore,
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
      setSelectedOption(null)
      setTextAnswer('')
      roundStartedAtRef.current = null
      timeoutCountRef.current = 0
    },
    [analytics, difficulty.answerMode, questions.length, scoreSync, selectedDifficultyId],
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
      setSelectedOption(null)
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
      setSelectedOption(
        answerLabel && difficulty.answerMode === 'multiple-choice'
          ? answerLabel
          : null,
      )

      if (isCorrect) {
        setCorrectBurstCounter((current) => current + 1)
      }

      if (getAppPreferences().soundEnabled) {
        void playSoundCue(isCorrect ? 'correct' : 'wrong')
      }

      analytics.trackEvent('question_answered', {
        answer_mode: difficulty.answerMode,
        difficulty_id: selectedDifficultyId,
        game_id: GUESS_THE_CAPITAL_GAME_ID,
        is_correct: isCorrect,
        question_index: questionIndex + 1,
        resolution: nextResolution,
      })

      advanceTimeoutRef.current = window.setTimeout(() => {
        goToNextQuestion(nextScore, nextCorrectAnswers)
      }, getAnswerAdvanceDelayMs(isCorrect))
    },
    [
      analytics,
      correctAnswers,
      currentQuestion,
      difficulty,
      goToNextQuestion,
      questionIndex,
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
        timeoutCountRef.current += 1
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

  useEffect(() => {
    onPhaseChange?.(phase)
  }, [onPhaseChange, phase])

  const startRound = () => {
    const rule = getGuessTheCapitalDifficultyRule(selectedDifficultyId)

    if (getAppPreferences().soundEnabled) {
      void primeSound()
    }

    setLastDifficulty(GUESS_THE_CAPITAL_GAME_ID, selectedDifficultyId)
    const reserved = reserveGuessTheCapitalSubjects(
      GUESS_THE_CAPITAL_COUNTRIES_PER_ROUND,
      GUESS_THE_CAPITAL_STATES_PER_ROUND,
      selectedDifficultyId,
    )

    setQuestions(
      buildGuessTheCapitalRound(rule, [...reserved.countries, ...reserved.states]),
    )
    setQuestionIndex(0)
    setScore(0)
    setCorrectAnswers(0)
    setRemainingMs(
      rule.timeLimitSeconds === null ? 0 : rule.timeLimitSeconds * 1000 * timerScale,
    )
    setResolution('idle')
    setSelectedOption(null)
    setTextAnswer('')
    setResult(null)
    setPhase('question')
    roundStartedAtRef.current = Date.now()
    timeoutCountRef.current = 0

    analytics.trackEvent('round_started', {
      answer_mode: rule.answerMode,
      difficulty_id: selectedDifficultyId,
      game_id: GUESS_THE_CAPITAL_GAME_ID,
      question_count:
        GUESS_THE_CAPITAL_COUNTRIES_PER_ROUND + GUESS_THE_CAPITAL_STATES_PER_ROUND,
      time_limit_seconds: rule.timeLimitSeconds,
      timed_round: rule.timeLimitSeconds !== null,
    })
  }

  const submitTextAnswer = (event: FormEvent) => {
    event.preventDefault()

    if (!currentQuestion) {
      return
    }

    handleAnswer(
      isAcceptableCapitalAnswer(textAnswer, currentQuestion.subject),
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
              <Badge variant="outline">20 capitals per round</Badge>
              <Badge variant="outline">18 countries + 2 states</Badge>
              <Badge variant="outline">Anonymous progress saved locally</Badge>
            </div>
            <CardTitle>Pick a difficulty and chase capitals</CardTitle>
            <CardDescription>
              Later levels lean harder into smaller countries, island nations, and
              places European players usually see less often.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-3">
              {guessTheCapitalDifficultyRules.map((rule) => {
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
                    onClick={() => {
                      setSelectedDifficultyId(rule.id)
                      analytics.trackEvent('difficulty_selected', {
                        difficulty_id: rule.id,
                        game_id: GUESS_THE_CAPITAL_GAME_ID,
                      })
                    }}
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
              Rounds continue through as many unseen countries and states as possible
              before the deck reshuffles.
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
              capitals on {getGuessTheCapitalDifficultyRule(result.difficultyId).label}.
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
                    {getGuessTheCapitalDifficultyRule(result.difficultyId).label}
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
  const subjectKindLabel =
    currentQuestion.subject.kind === 'country' ? 'Country' : 'US state'

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
              <Badge variant="outline">{subjectKindLabel}</Badge>
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
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:items-stretch">
            <div className="space-y-4">
              <div className="rounded-[28px] bg-[linear-gradient(180deg,rgba(255,255,255,0.86)_0%,rgba(235,246,237,0.95)_100%)] p-5 shadow-inner sm:p-6">
                <div className="rounded-[24px] border border-white/70 bg-white/85 p-5 shadow-[0_30px_60px_-35px_rgba(12,49,33,0.25)]">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {subjectKindLabel}
                  </p>
                  <h2
                    className="mt-3 font-serif text-3xl font-semibold tracking-tight sm:text-4xl"
                    data-testid="capital-subject-name"
                  >
                    {currentQuestion.subject.name}
                  </h2>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {currentQuestion.subject.kind === 'country'
                      ? `Region: ${currentQuestion.subject.region}`
                      : 'Match the state to its capital city.'}
                  </p>
                </div>
              </div>
              <div className="rounded-[24px] bg-secondary/75 p-4 text-sm text-muted-foreground">
                {hasTimeLimit
                  ? 'Move fast. Wrong answers and timeouts send you straight to the next place.'
                  : 'Take your time. Each answer reveals the next place immediately.'}
              </div>
            </div>

            <div className="flex flex-col justify-between gap-4">
              {difficulty.answerMode === 'multiple-choice' ? (
                <div className="grid gap-3">
                  {currentQuestion.options.map((option) => {
                    const isCorrect = option === currentQuestion.subject.capital
                    const isSelectedWrong =
                      selectedOption === option && resolution === 'wrong'
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
                        data-correct={revealAnswers && isCorrect ? 'true' : undefined}
                        data-feedback={
                          isSelectedWrong
                            ? 'wrong'
                            : isRevealedCorrect
                              ? 'correct'
                              : 'idle'
                        }
                        data-testid={`answer-${option}`}
                        key={option}
                        onClick={() => handleAnswer(isCorrect, option)}
                        disabled={isFeedbackLocked}
                        type="button"
                        variant="outline"
                      >
                        <span className="text-base">{option}</span>
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
                    htmlFor="capital-answer"
                  >
                    Type the capital city
                  </label>
                  <Input
                    autoCapitalize="words"
                    autoComplete="off"
                    autoCorrect="off"
                    data-answer={
                      revealAnswers ? currentQuestion.subject.capital : undefined
                    }
                    id="capital-answer"
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
              className={`rounded-[22px] px-4 py-3 text-sm font-semibold ${
                resolution === 'correct'
                  ? 'bg-success/10 text-success'
                  : 'bg-accent/10 text-accent'
              }`}
              data-testid="resolution-message"
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
              Correct answer: {currentQuestion.subject.capital}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </>
  )
}
