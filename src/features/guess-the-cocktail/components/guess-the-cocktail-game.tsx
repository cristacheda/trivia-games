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
import { GameScoreSummary } from '@/components/game-score-panels'
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
  getGuessTheCocktailDifficultyRule,
  guessTheCocktailDifficultyRules,
  GUESS_THE_COCKTAIL_GAME_ID,
  GUESS_THE_COCKTAIL_QUESTIONS_PER_ROUND,
} from '@/features/guess-the-cocktail/constants'
import { isAcceptableCocktailAnswer } from '@/features/guess-the-cocktail/lib/match'
import { buildGuessTheCocktailRound } from '@/features/guess-the-cocktail/lib/round'
import type { GuessTheCocktailQuestion } from '@/features/guess-the-cocktail/types'
import { getDebugSettings } from '@/lib/debug'
import { getAnswerAdvanceDelayMs, getNextTimeWarningSecond } from '@/lib/gameplay'
import { useSiteHighScore } from '@/hooks/use-site-high-score'
import { playSoundCue, primeSound } from '@/lib/sound'
import { reserveGuessTheCocktailCocktails } from '@/lib/storage-decks'
import {
  getAppPreferences,
  getGameStats,
  getPlayerId,
  recordRoundResult,
  setLastDifficulty,
  setSoundEnabled,
  useGameStats,
  useSoundEnabled,
} from '@/lib/storage'
import { cn } from '@/lib/utils'
import type { DifficultyRule, RoundResult } from '@/types/game'

type Phase = 'setup' | 'question' | 'results'
type Resolution = 'idle' | 'correct' | 'wrong' | 'timeout'

interface GuessTheCocktailGameProps {
  onPhaseChange?: (phase: Phase) => void
}

function scoreAnswer(isCorrect: boolean, difficulty: DifficultyRule) {
  return isCorrect ? difficulty.pointsPerCorrect : 0
}

function getResolutionMessage(
  resolution: Resolution,
  currentQuestion: GuessTheCocktailQuestion,
  difficulty: DifficultyRule,
) {
  if (resolution === 'correct') {
    return `Correct. +${difficulty.pointsPerCorrect} points.`
  }
  if (resolution === 'wrong') {
    return `Not this time. That was ${currentQuestion.cocktail.name}.`
  }
  if (resolution === 'timeout') {
    return `Time ran out. That was ${currentQuestion.cocktail.name}.`
  }
  return null
}

export function GuessTheCocktailGame({ onPhaseChange }: GuessTheCocktailGameProps) {
  const stats = useGameStats(GUESS_THE_COCKTAIL_GAME_ID)
  const siteHighScore = useSiteHighScore(GUESS_THE_COCKTAIL_GAME_ID)
  const soundEnabled = useSoundEnabled()
  const initialDifficulty =
    getGameStats(GUESS_THE_COCKTAIL_GAME_ID).lastDifficulty ?? 'level-1'
  const [selectedDifficultyId, setSelectedDifficultyId] = useState(initialDifficulty)
  const [phase, setPhase] = useState<Phase>('setup')
  const [questions, setQuestions] = useState<GuessTheCocktailQuestion[]>([])
  const [questionIndex, setQuestionIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [remainingMs, setRemainingMs] = useState(0)
  const [resolution, setResolution] = useState<Resolution>('idle')
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [textAnswer, setTextAnswer] = useState('')
  const [result, setResult] = useState<RoundResult | null>(null)
  const [correctBurstCounter, setCorrectBurstCounter] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const advanceTimeoutRef = useRef<number | null>(null)
  const roundStartedAtRef = useRef<number | null>(null)
  const timeoutCountRef = useRef(0)
  const lastWarningSecondRef = useRef<number | null>(null)
  const { analytics, scoreSync } = useAppServices()
  const difficulty = getGuessTheCocktailDifficultyRule(selectedDifficultyId)
  const currentQuestion = questions[questionIndex]
  const progressValue = questions.length
    ? ((questionIndex + 1) / questions.length) * 100
    : 0
  const timerScale = getDebugSettings().timerScale
  const revealAnswers = getDebugSettings().revealAnswers
  const hasTimeLimit = difficulty.timeLimitSeconds !== null
  const isFeedbackLocked = resolution !== 'idle'
  const showIngredients = difficulty.id === 'level-1'
  const highScoreCelebrationMs =
    phase === 'results' && result?.beatHighScore ? 10000 : 0

  const finishRound = useCallback(
    async (nextScore: number, nextCorrectAnswers: number) => {
      const roundDurationSeconds = roundStartedAtRef.current
        ? Math.max(1, Math.round((Date.now() - roundStartedAtRef.current) / 1000))
        : 0
      const stored = recordRoundResult({
        gameId: GUESS_THE_COCKTAIL_GAME_ID,
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
        game_id: GUESS_THE_COCKTAIL_GAME_ID,
        round_duration_seconds: roundDurationSeconds,
        score: stored.totalScore,
        timeouts_count: timeoutCountRef.current,
        total_questions: stored.totalQuestions,
      })

      if (stored.beatHighScore) {
        analytics.trackEvent('high_score_beaten', {
          difficulty_id: selectedDifficultyId,
          game_id: GUESS_THE_COCKTAIL_GAME_ID,
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
      setSelectedOptionId(null)
      setTextAnswer('')
      roundStartedAtRef.current = null
      timeoutCountRef.current = 0
      lastWarningSecondRef.current = null
    },
    [
      analytics,
      difficulty.answerMode,
      questions.length,
      scoreSync,
      selectedDifficultyId,
    ],
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
      setSelectedOptionId(null)
      setTextAnswer('')
      lastWarningSecondRef.current = null
    },
    [difficulty.timeLimitSeconds, finishRound, questionIndex, questions.length, timerScale],
  )

  const handleAnswer = useCallback(
    (
      isCorrect: boolean,
      answerOptionId?: string,
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
      setSelectedOptionId(
        answerOptionId && difficulty.answerMode === 'multiple-choice' ? answerOptionId : null,
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
        game_id: GUESS_THE_COCKTAIL_GAME_ID,
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
    if (phase === 'question' && difficulty.answerMode === 'free-text' && currentQuestion) {
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
      const warningSecond = getNextTimeWarningSecond({
        hasTimeLimit: difficulty.timeLimitSeconds !== null,
        soundEnabled,
        resolution,
        remainingMs: nextRemaining,
        lastWarningSecond: lastWarningSecondRef.current,
      })

      if (warningSecond !== null) {
        lastWarningSecondRef.current = warningSecond
        void playSoundCue('time-warning')
      }

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
    soundEnabled,
    timerScale,
  ])

  useEffect(
    () => () => {
      if (advanceTimeoutRef.current) {
        window.clearTimeout(advanceTimeoutRef.current)
      }
    },
    [],
  )

  useEffect(() => {
    onPhaseChange?.(phase)
  }, [onPhaseChange, phase])

  const startRound = () => {
    const rule = getGuessTheCocktailDifficultyRule(selectedDifficultyId)

    if (getAppPreferences().soundEnabled) {
      void primeSound()
    }

    setLastDifficulty(GUESS_THE_COCKTAIL_GAME_ID, selectedDifficultyId)
    const reservedCocktails = reserveGuessTheCocktailCocktails(selectedDifficultyId)

    setQuestions(buildGuessTheCocktailRound(rule, reservedCocktails))
    setQuestionIndex(0)
    setScore(0)
    setCorrectAnswers(0)
    setRemainingMs(
      rule.timeLimitSeconds === null ? 0 : rule.timeLimitSeconds * 1000 * timerScale,
    )
    setResolution('idle')
    setSelectedOptionId(null)
    setTextAnswer('')
    setResult(null)
    setPhase('question')
    roundStartedAtRef.current = Date.now()
    timeoutCountRef.current = 0
    lastWarningSecondRef.current = null

    analytics.trackEvent('round_started', {
      answer_mode: rule.answerMode,
      difficulty_id: selectedDifficultyId,
      game_id: GUESS_THE_COCKTAIL_GAME_ID,
      question_count: GUESS_THE_COCKTAIL_QUESTIONS_PER_ROUND,
      time_limit_seconds: rule.timeLimitSeconds,
      timed_round: rule.timeLimitSeconds !== null,
    })
  }

  const submitTextAnswer = (event: FormEvent) => {
    event.preventDefault()

    if (!currentQuestion) {
      return
    }

    handleAnswer(isAcceptableCocktailAnswer(textAnswer, currentQuestion.cocktail), textAnswer)
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

  if (phase === 'setup') {
    return (
      <Card className="border-primary/10">
        <CardHeader>
          <CardTitle>Guess the cocktail from the photo</CardTitle>
          <CardDescription>
            Classic and global cocktails, with harder levels reaching for more obscure drinks.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-3">
            {guessTheCocktailDifficultyRules.map((rule) => (
              <button
                className={cn(
                  'rounded-[26px] border p-5 text-left transition',
                  rule.id === selectedDifficultyId
                    ? 'border-primary/40 bg-primary/10 shadow-lg shadow-primary/10'
                    : 'border-border bg-white/60 hover:border-primary/30 hover:bg-white',
                )}
                data-testid={`difficulty-${rule.id}`}
                key={rule.id}
                onClick={() => setSelectedDifficultyId(rule.id)}
                type="button"
              >
                <p className="font-serif text-xl font-semibold">{rule.label}</p>
                <p className="mt-2 text-sm text-muted-foreground">{rule.prompt}</p>
              </button>
            ))}
          </div>
          <GameScoreSummary
            localHighScore={stats.highScore?.score ?? null}
            playerId={getPlayerId()}
            recentResultScore={stats.recentResult?.totalScore ?? null}
            siteHighScore={siteHighScore}
          />
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
              {soundEnabled ? 'Sound on' : 'Sound off'}
            </Button>
          </div>
        </CardContent>
      </Card>
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
            <Badge variant="success">
              <Trophy className="h-3.5 w-3.5" />Round complete
            </Badge>
            <CardTitle data-testid="result-score">{result.totalScore} points</CardTitle>
            <CardDescription>
              {result.correctAnswers} correct answers across {result.totalQuestions}{' '}
              cocktails on {getGuessTheCocktailDifficultyRule(result.difficultyId).label}.
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
                    {getGuessTheCocktailDifficultyRule(result.difficultyId).label}
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
  const resolutionMessage = getResolutionMessage(resolution, currentQuestion, difficulty)

  return (
    <Card className="border-primary/10">
      <CardHeader className="gap-4 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Badge data-testid="question-progress" variant="outline">
              Question {questionIndex + 1} / {questions.length}
            </Badge>
            <Badge variant="outline">{difficulty.label}</Badge>
          </div>
        </div>
        <Progress value={progressValue} />
        {hasTimeLimit ? (
          <div>
            <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              <span>Time left</span>
              <span data-testid="timer">{Math.ceil(remainingMs / 1000)}s</span>
            </div>
            <Progress className="h-2" value={timerPercent} />
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="overflow-hidden rounded-[24px] border border-white/65 bg-white/75">
          <div className="relative aspect-square w-full overflow-hidden bg-secondary/40 sm:aspect-video">
            <img
              alt="Cocktail to identify"
              className={cn(
                'h-full w-full object-cover transition-opacity duration-300',
                resolution !== 'idle' ? 'opacity-70' : 'opacity-100',
              )}
              src={currentQuestion.cocktail.imageLocalPath}
            />
            {resolution !== 'idle' ? (
              <div className="absolute inset-0 flex items-end p-4">
                <p
                  className={cn(
                    'rounded-xl px-3 py-2 text-base font-semibold backdrop-blur-sm',
                    resolution === 'correct'
                      ? 'bg-emerald-900/80 text-emerald-50'
                      : 'bg-rose-900/80 text-rose-50',
                  )}
                >
                  {currentQuestion.cocktail.name}
                </p>
              </div>
            ) : null}
          </div>
          {showIngredients && resolution === 'idle' ? (
            <div className="border-t border-white/65 px-4 py-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Ingredients
              </p>
              <div className="flex flex-wrap gap-1.5">
                {currentQuestion.cocktail.ingredients.map((ingredient) => (
                  <Badge key={ingredient} variant="outline">
                    {ingredient}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {difficulty.answerMode === 'multiple-choice' ? (
          <div className="grid gap-3">
            {currentQuestion.options.map((option) => {
              const isSelected = selectedOptionId === option.id
              const isCorrect = option.id === currentQuestion.cocktail.id
              const showCorrect = resolution !== 'idle' && isCorrect
              const showWrong = resolution !== 'idle' && isSelected && !isCorrect

              return (
                <Button
                  className={cn(
                    'h-auto justify-start rounded-2xl px-4 py-4 text-left text-base',
                    showCorrect &&
                      'border-emerald-500/55 bg-emerald-50 text-emerald-900 hover:bg-emerald-100',
                    showWrong &&
                      'border-rose-500/60 bg-rose-50 text-rose-900 hover:bg-rose-100',
                  )}
                  data-testid={`answer-${option.id}`}
                  disabled={isFeedbackLocked}
                  key={option.id}
                  onClick={() =>
                    handleAnswer(option.id === currentQuestion.cocktail.id, option.id)
                  }
                  variant="outline"
                >
                  {option.name}
                </Button>
              )
            })}
          </div>
        ) : (
          <form className="space-y-3" onSubmit={submitTextAnswer}>
            <Input
              autoCapitalize="words"
              autoCorrect="off"
              data-testid="cocktail-input"
              disabled={isFeedbackLocked}
              onChange={(event) => setTextAnswer(event.target.value)}
              placeholder="Type the cocktail name"
              ref={inputRef}
              value={textAnswer}
            />
            <Button
              data-testid="submit-text-answer"
              disabled={isFeedbackLocked || !textAnswer.trim()}
              type="submit"
            >
              Submit answer
            </Button>
            {revealAnswers ? (
              <p className="text-xs text-muted-foreground">
                Debug answer: {currentQuestion.cocktail.name}
              </p>
            ) : null}
          </form>
        )}

        {resolutionMessage ? (
          <p
            className={cn(
              'rounded-2xl border px-4 py-3 text-sm font-medium',
              resolution === 'correct'
                ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                : 'border-rose-300 bg-rose-50 text-rose-900',
            )}
          >
            {resolutionMessage}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
