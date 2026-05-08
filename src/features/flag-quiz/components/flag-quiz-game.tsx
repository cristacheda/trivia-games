import {
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import { RotateCcw, Trophy } from 'lucide-react'
import { useAppServices } from '@/app/app-providers'
import { CountryFlag } from '@/components/country-flag'
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
import { difficultyRules, FLAG_QUIZ_GAME_ID, getDifficultyRule } from '@/features/flag-quiz/constants'
import { isAcceptableCountryAnswer } from '@/features/flag-quiz/lib/match'
import { generateFlagQuizRound } from '@/features/flag-quiz/lib/round'
import { scoreAnswer } from '@/features/flag-quiz/lib/scoring'
import type { FlagQuizQuestion } from '@/features/flag-quiz/types'
import { getDebugSettings } from '@/lib/debug'
import {
  getGameStats,
  getPlayerId,
  recordRoundResult,
  setLastDifficulty,
  useGameStats,
} from '@/lib/storage'
import type { DifficultyRule, RoundResult } from '@/types/game'

type Phase = 'setup' | 'question' | 'results'
type Resolution = 'idle' | 'correct' | 'wrong' | 'timeout'

function getResolutionMessage(
  resolution: Resolution,
  currentQuestion: FlagQuizQuestion,
  difficulty: DifficultyRule,
) {
  if (resolution === 'correct') {
    return `Correct. +${difficulty.pointsPerCorrect} points.`
  }

  if (resolution === 'wrong') {
    return `Not this time. The correct answer was ${currentQuestion.country.name}.`
  }

  if (resolution === 'timeout') {
    return `Time ran out. The correct answer was ${currentQuestion.country.name}.`
  }

  return null
}

export function FlagQuizGame() {
  const stats = useGameStats(FLAG_QUIZ_GAME_ID)
  const initialDifficulty =
    getGameStats(FLAG_QUIZ_GAME_ID).lastDifficulty ?? 'level-1'
  const [selectedDifficultyId, setSelectedDifficultyId] =
    useState(initialDifficulty)
  const [phase, setPhase] = useState<Phase>('setup')
  const [questions, setQuestions] = useState<FlagQuizQuestion[]>([])
  const [questionIndex, setQuestionIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [remainingMs, setRemainingMs] = useState(0)
  const [resolution, setResolution] = useState<Resolution>('idle')
  const [textAnswer, setTextAnswer] = useState('')
  const [result, setResult] = useState<RoundResult | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const advanceTimeoutRef = useRef<number | null>(null)
  const { analytics, scoreSync } = useAppServices()
  const difficulty = useMemo(
    () => getDifficultyRule(selectedDifficultyId),
    [selectedDifficultyId],
  )
  const currentQuestion = questions[questionIndex]
  const progressValue = questions.length
    ? ((questionIndex + 1) / questions.length) * 100
    : 0
  const timerScale = getDebugSettings().timerScale
  const revealAnswers = getDebugSettings().revealAnswers
  const hasTimeLimit = difficulty.timeLimitSeconds !== null

  const finishRound = useCallback(
    async (nextScore: number, nextCorrectAnswers: number) => {
      const stored = recordRoundResult({
        gameId: FLAG_QUIZ_GAME_ID,
        difficultyId: selectedDifficultyId,
        totalScore: nextScore,
        correctAnswers: nextCorrectAnswers,
        totalQuestions: questions.length,
        completedAt: new Date().toISOString(),
      })

      analytics.trackEvent('round_completed', {
        gameId: FLAG_QUIZ_GAME_ID,
        score: stored.totalScore,
        correctAnswers: stored.correctAnswers,
        beatHighScore: stored.beatHighScore,
      })

      if (stored.beatHighScore) {
        analytics.trackEvent('high_score_beaten', {
          gameId: FLAG_QUIZ_GAME_ID,
          score: stored.totalScore,
        })
      }

      await scoreSync.syncRoundResult(stored)
      setResult(stored)
      setPhase('results')
      setResolution('idle')
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

      analytics.trackEvent('question_answered', {
        gameId: FLAG_QUIZ_GAME_ID,
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
    const rule = getDifficultyRule(selectedDifficultyId)
    setLastDifficulty(FLAG_QUIZ_GAME_ID, selectedDifficultyId)
    setQuestions(generateFlagQuizRound(rule))
    setQuestionIndex(0)
    setScore(0)
    setCorrectAnswers(0)
    setRemainingMs(
      rule.timeLimitSeconds === null ? 0 : rule.timeLimitSeconds * 1000 * timerScale,
    )
    setResolution('idle')
    setTextAnswer('')
    setResult(null)
    setPhase('question')

    analytics.trackEvent('game_started', {
      gameId: FLAG_QUIZ_GAME_ID,
      difficultyId: selectedDifficultyId,
      playerId: getPlayerId(),
    })
  }

  const submitTextAnswer = (event: FormEvent) => {
    event.preventDefault()
    if (!currentQuestion) {
      return
    }

    handleAnswer(
      isAcceptableCountryAnswer(textAnswer, currentQuestion.country),
      textAnswer,
    )
  }

  if (phase === 'setup') {
    return (
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="success">Playable today</Badge>
            <Badge variant="outline">10 flags per round</Badge>
            <Badge variant="outline">Local high score + future sync</Badge>
          </div>
          <CardTitle>Name the Country Flag</CardTitle>
          <CardDescription>
            Each round favors countries outside Europe, with extra weight for smaller and less familiar flags.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-3">
            {difficultyRules.map((rule) => {
              const isSelected = rule.id === selectedDifficultyId

              return (
                <button
                  className={`rounded-[26px] border p-5 text-left transition ${
                    isSelected
                      ? 'border-primary bg-primary/8 shadow-lg shadow-primary/5'
                      : 'border-border bg-white/55 hover:border-primary/30 hover:bg-white'
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

          <div className="grid gap-4 rounded-[26px] bg-secondary/65 p-5 md:grid-cols-3">
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
                Local player id
              </p>
              <p className="mt-2 break-all text-sm text-muted-foreground">
                {getPlayerId()}
              </p>
            </div>
          </div>

          <Button
            className="w-full sm:w-auto"
            data-testid="start-round"
            onClick={startRound}
            size="lg"
          >
            Start round
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (phase === 'results' && result) {
    return (
      <Card>
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
            flags on {getDifficultyRule(result.difficultyId).label}.
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
                  {getDifficultyRule(result.difficultyId).label}
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
    <Card>
      <CardHeader className="gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Badge data-testid="question-progress" variant="outline">
              Question {questionIndex + 1} / {questions.length}
            </Badge>
            <Badge variant="outline">{difficulty.label}</Badge>
          </div>
          <div className="text-right">
            <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
              Score
            </p>
            <p className="font-serif text-3xl font-semibold" data-testid="live-score">
              {score}
            </p>
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

      <CardContent className="space-y-6" data-testid="question-card">
        <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
          <div className="space-y-4">
            <div className="overflow-hidden rounded-[28px] bg-white/70 p-4 shadow-inner sm:p-6">
              <CountryFlag
                className="mx-auto max-w-xl shadow-[0_30px_60px_-35px_rgba(24,37,48,0.55)]"
                countryCode={currentQuestion.country.code}
                label={`${currentQuestion.country.name} flag`}
              />
            </div>
            <div className="rounded-[24px] bg-secondary/55 p-4 text-sm text-muted-foreground">
              {hasTimeLimit
                ? 'Select the matching country as fast as you can. The round will continue immediately after each answer.'
                : 'Take your time and use each flag as a learning rep. The round will continue immediately after each answer.'}
            </div>
          </div>

          <div className="space-y-4">
            {difficulty.answerMode === 'multiple-choice' ? (
              <div className="grid gap-3">
                {currentQuestion.options.map((option) => {
                  const isCorrect = option.code === currentQuestion.country.code

                  return (
                    <Button
                      className="h-auto justify-start rounded-[22px] px-5 py-4 text-left"
                      data-correct={
                        revealAnswers && isCorrect ? 'true' : undefined
                      }
                      key={option.code}
                      onClick={() => handleAnswer(isCorrect, option.name)}
                      type="button"
                      variant="outline"
                    >
                      <span className="text-base">{option.name}</span>
                    </Button>
                  )
                })}
              </div>
            ) : (
              <form className="space-y-3" onSubmit={submitTextAnswer}>
                <label
                  className="block text-sm font-semibold text-muted-foreground"
                  htmlFor="country-answer"
                >
                  Type the country name
                </label>
                <Input
                  autoCapitalize="words"
                  autoComplete="off"
                  autoCorrect="off"
                  data-answer={
                    revealAnswers ? currentQuestion.country.name : undefined
                  }
                  id="country-answer"
                  onChange={(event) => setTextAnswer(event.target.value)}
                  placeholder="Start typing…"
                  ref={inputRef}
                  value={textAnswer}
                />
                <Button className="w-full" disabled={!textAnswer.trim()} type="submit">
                  Lock answer
                </Button>
              </form>
            )}

            <div className="rounded-[24px] border border-border bg-white/70 p-4">
              <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
                Current best
              </p>
              <p className="mt-2 font-serif text-3xl font-semibold">
                {stats.highScore?.score ?? '—'}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                You need{' '}
                {Math.max((stats.highScore?.score ?? 0) - score + 1, 0)} more
                points to set a new overall high score.
              </p>
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
          >
            {resolutionMessage}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
