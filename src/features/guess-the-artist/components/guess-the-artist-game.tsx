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
  getGuessTheArtistDifficultyRule,
  guessTheArtistDifficultyRules,
  GUESS_THE_ARTIST_GAME_ID,
  GUESS_THE_ARTIST_QUESTIONS_PER_ROUND,
} from '@/features/guess-the-artist/constants'
import { isAcceptableArtistAnswer } from '@/features/guess-the-artist/lib/match'
import {
  fetchSongPreviewMetadata,
  type SongPreviewMetadata,
} from '@/features/guess-the-artist/lib/preview'
import { buildGuessTheArtistRound } from '@/features/guess-the-artist/lib/round'
import type { GuessTheArtistQuestion } from '@/features/guess-the-artist/types'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { getDebugSettings } from '@/lib/debug'
import { getAnswerAdvanceDelayMs, getNextTimeWarningSecond } from '@/lib/gameplay'
import { playSoundCue, primeSound } from '@/lib/sound'
import { reserveGuessTheArtistSongs } from '@/lib/storage-decks'
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

interface GuessTheArtistGameProps {
  onPhaseChange?: (phase: Phase) => void
}

function scoreAnswer(isCorrect: boolean, difficulty: DifficultyRule) {
  return isCorrect ? difficulty.pointsPerCorrect : 0
}

function getResolutionMessage(
  resolution: Resolution,
  currentQuestion: GuessTheArtistQuestion,
  difficulty: DifficultyRule,
) {
  if (resolution === 'correct') {
    return `Correct. +${difficulty.pointsPerCorrect} points.`
  }
  if (resolution === 'wrong') {
    return `Not this time. The correct artist was ${currentQuestion.subject.artistName}.`
  }
  if (resolution === 'timeout') {
    return `Time ran out. The correct artist was ${currentQuestion.subject.artistName}.`
  }
  return null
}

export function GuessTheArtistGame({ onPhaseChange }: GuessTheArtistGameProps) {
  const stats = useGameStats(GUESS_THE_ARTIST_GAME_ID)
  const soundEnabled = useSoundEnabled()
  const isOnline = useOnlineStatus()
  const initialDifficulty =
    getGameStats(GUESS_THE_ARTIST_GAME_ID).lastDifficulty ?? 'level-1'
  const [selectedDifficultyId, setSelectedDifficultyId] =
    useState(initialDifficulty)
  const [phase, setPhase] = useState<Phase>('setup')
  const [questions, setQuestions] = useState<GuessTheArtistQuestion[]>([])
  const [questionIndex, setQuestionIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [remainingMs, setRemainingMs] = useState(0)
  const [resolution, setResolution] = useState<Resolution>('idle')
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [textAnswer, setTextAnswer] = useState('')
  const [result, setResult] = useState<RoundResult | null>(null)
  const [previewMetadata, setPreviewMetadata] =
    useState<SongPreviewMetadata | null>(null)
  const [previewLookupStatus, setPreviewLookupStatus] = useState<
    'idle' | 'loading' | 'ready' | 'unavailable'
  >('idle')
  const [correctBurstCounter, setCorrectBurstCounter] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const mediaSourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)
  const previewSessionRef = useRef(0)
  const advanceTimeoutRef = useRef<number | null>(null)
  const roundStartedAtRef = useRef<number | null>(null)
  const timeoutCountRef = useRef(0)
  const lastWarningSecondRef = useRef<number | null>(null)
  const { analytics, scoreSync } = useAppServices()
  const difficulty = getGuessTheArtistDifficultyRule(selectedDifficultyId)
  const currentQuestion = questions[questionIndex]
  const progressValue = questions.length
    ? ((questionIndex + 1) / questions.length) * 100
    : 0
  const timerScale = getDebugSettings().timerScale
  const revealAnswers = getDebugSettings().revealAnswers
  const hasTimeLimit = difficulty.timeLimitSeconds !== null
  const isFeedbackLocked = resolution !== 'idle'
  const shouldShowArtwork = difficulty.id === 'level-1'
  const highScoreCelebrationMs =
    phase === 'results' && result?.beatHighScore ? 10000 : 0

  const stopPreviewPlayback = useCallback((fadeOutSeconds = 0.35) => {
    const audio = previewAudioRef.current
    const gainNode = gainNodeRef.current
    const audioContext = audioContextRef.current

    if (!audio || !gainNode || !audioContext) {
      return
    }

    const now = audioContext.currentTime
    gainNode.gain.cancelScheduledValues(now)
    gainNode.gain.setValueAtTime(gainNode.gain.value, now)
    gainNode.gain.linearRampToValueAtTime(0, now + fadeOutSeconds)

    window.setTimeout(() => {
      audio.pause()
      audio.currentTime = 0
      previewAudioRef.current = null
      mediaSourceRef.current = null
      gainNodeRef.current = null
    }, fadeOutSeconds * 1000 + 60)
  }, [])

  const startPreviewPlayback = useCallback(
    async (previewUrl: string) => {
      if (typeof window === 'undefined' || !('AudioContext' in window)) {
        return
      }

      stopPreviewPlayback(0.2)

      const audio = new Audio(previewUrl)
      audio.crossOrigin = 'anonymous'
      audio.loop = false
      audio.preload = 'auto'

      if (!audioContextRef.current) {
        audioContextRef.current = new window.AudioContext()
      }

      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume()
      }

      const gainNode = audioContextRef.current.createGain()
      gainNode.gain.value = 0
      const mediaSource = audioContextRef.current.createMediaElementSource(audio)
      mediaSource.connect(gainNode)
      gainNode.connect(audioContextRef.current.destination)

      previewAudioRef.current = audio
      mediaSourceRef.current = mediaSource
      gainNodeRef.current = gainNode

      audio.onended = () => {
        stopPreviewPlayback(0.25)
      }

      await audio.play()
      const now = audioContextRef.current.currentTime
      gainNode.gain.setValueAtTime(0, now)
      gainNode.gain.linearRampToValueAtTime(0.22, now + 0.55)
    },
    [stopPreviewPlayback],
  )

  const finishRound = useCallback(
    async (nextScore: number, nextCorrectAnswers: number) => {
      const roundDurationSeconds = roundStartedAtRef.current
        ? Math.max(1, Math.round((Date.now() - roundStartedAtRef.current) / 1000))
        : 0
      const stored = recordRoundResult({
        gameId: GUESS_THE_ARTIST_GAME_ID,
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
        game_id: GUESS_THE_ARTIST_GAME_ID,
        round_duration_seconds: roundDurationSeconds,
        score: stored.totalScore,
        timeouts_count: timeoutCountRef.current,
        total_questions: stored.totalQuestions,
      })

      if (stored.beatHighScore) {
        analytics.trackEvent('high_score_beaten', {
          difficulty_id: selectedDifficultyId,
          game_id: GUESS_THE_ARTIST_GAME_ID,
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
      setPreviewMetadata(null)
      setPreviewLookupStatus('idle')
      stopPreviewPlayback()
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
      stopPreviewPlayback,
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
      setSelectedOption(null)
      setTextAnswer('')
      lastWarningSecondRef.current = null
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

      previewSessionRef.current += 1
      stopPreviewPlayback(0.2)

      const points = scoreAnswer(isCorrect, difficulty)
      const nextScore = score + points
      const nextCorrectAnswers = correctAnswers + (isCorrect ? 1 : 0)

      setScore(nextScore)
      setCorrectAnswers(nextCorrectAnswers)
      setResolution(nextResolution)
      setSelectedOption(
        answerLabel && difficulty.answerMode === 'multiple-choice' ? answerLabel : null,
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
        game_id: GUESS_THE_ARTIST_GAME_ID,
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
      stopPreviewPlayback,
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

  useEffect(() => {
    if (phase !== 'question' || !currentQuestion || !isOnline) {
      stopPreviewPlayback()
      return
    }

    if (import.meta.env.MODE === 'test') {
      return
    }

    const controller = new AbortController()
    previewSessionRef.current += 1
    const requestSession = previewSessionRef.current
    queueMicrotask(() => {
      setPreviewLookupStatus('loading')
      setPreviewMetadata(null)
    })
    stopPreviewPlayback(0.25)

    void fetchSongPreviewMetadata({
      songTitle: currentQuestion.subject.songTitle,
      artistName: currentQuestion.subject.artistName,
      signal: controller.signal,
    })
      .then((metadata) => {
        if (controller.signal.aborted || requestSession !== previewSessionRef.current) {
          return
        }

        setPreviewMetadata(metadata)
        if (metadata.previewUrl) {
          setPreviewLookupStatus('ready')
          void startPreviewPlayback(metadata.previewUrl).catch(() => {
            if (requestSession === previewSessionRef.current) {
              setPreviewLookupStatus('unavailable')
            }
          })
        } else {
          setPreviewLookupStatus('unavailable')
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setPreviewLookupStatus('unavailable')
        }
      })

    return () => {
      controller.abort()
    }
  }, [currentQuestion, isOnline, phase, startPreviewPlayback, stopPreviewPlayback])

  useEffect(
    () => () => {
      if (advanceTimeoutRef.current) {
        window.clearTimeout(advanceTimeoutRef.current)
      }
      stopPreviewPlayback(0.1)
      if (audioContextRef.current) {
        void audioContextRef.current.close()
        audioContextRef.current = null
      }
    },
    [stopPreviewPlayback],
  )

  useEffect(() => {
    onPhaseChange?.(phase)
  }, [onPhaseChange, phase])

  const startRound = () => {
    const rule = getGuessTheArtistDifficultyRule(selectedDifficultyId)

    if (getAppPreferences().soundEnabled) {
      void primeSound()
    }

    setLastDifficulty(GUESS_THE_ARTIST_GAME_ID, selectedDifficultyId)
    const reservedSongs = reserveGuessTheArtistSongs(
      GUESS_THE_ARTIST_QUESTIONS_PER_ROUND,
      selectedDifficultyId,
    )

    setQuestions(buildGuessTheArtistRound(rule, reservedSongs))
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
    setPreviewMetadata(null)
    setPreviewLookupStatus('idle')
    setPhase('question')
    roundStartedAtRef.current = Date.now()
    timeoutCountRef.current = 0
    lastWarningSecondRef.current = null

    analytics.trackEvent('round_started', {
      answer_mode: rule.answerMode,
      difficulty_id: selectedDifficultyId,
      game_id: GUESS_THE_ARTIST_GAME_ID,
      question_count: GUESS_THE_ARTIST_QUESTIONS_PER_ROUND,
      time_limit_seconds: rule.timeLimitSeconds,
      timed_round: rule.timeLimitSeconds !== null,
    })
  }

  const submitTextAnswer = (event: FormEvent) => {
    event.preventDefault()

    if (!currentQuestion) {
      return
    }

    handleAnswer(isAcceptableArtistAnswer(textAnswer, currentQuestion.subject), textAnswer)
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
          <CardTitle>Guess the artist by song title</CardTitle>
          <CardDescription>
            Balanced mainstream and global tracks, with harder levels surfacing less
            obvious artists.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-3">
            {guessTheArtistDifficultyRules.map((rule) => (
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
              songs on {getGuessTheArtistDifficultyRule(result.difficultyId).label}.
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
                    {getGuessTheArtistDifficultyRule(result.difficultyId).label}
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
        <div
          className={cn(
            'grid gap-4 rounded-[24px] border border-white/65 bg-white/75 p-5',
            shouldShowArtwork && 'sm:grid-cols-[112px_1fr]',
          )}
        >
          {shouldShowArtwork ? (
            <div className="h-28 w-28 overflow-hidden border border-white/70 bg-secondary/70">
              {previewMetadata?.artworkUrl ? (
                <img
                  alt={`${currentQuestion.subject.songTitle} cover`}
                  className="h-full w-full object-cover"
                  src={previewMetadata.artworkUrl}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  No cover
                </div>
              )}
            </div>
          ) : null}
          <div>
            <p className="text-sm uppercase tracking-[0.16em] text-muted-foreground">
              Song title
            </p>
            <p className="mt-3 font-serif text-3xl font-semibold">
              {currentQuestion.subject.songTitle}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">{isOnline ? 'Online' : 'Offline'}</Badge>
              {previewLookupStatus === 'loading' ? (
                <Badge variant="outline">Loading preview…</Badge>
              ) : null}
              {previewLookupStatus === 'ready' ? (
                <Badge variant="success">Playing snippet</Badge>
              ) : null}
              {previewLookupStatus === 'unavailable' ? (
                <Badge variant="outline">No preview available</Badge>
              ) : null}
            </div>
          </div>
        </div>

        {difficulty.answerMode === 'multiple-choice' ? (
          <div className="grid gap-3">
            {currentQuestion.options.map((option) => {
              const isSelected = selectedOption === option
              const isCorrect = option === currentQuestion.subject.artistName
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
                  data-testid={`answer-${option}`}
                  disabled={isFeedbackLocked}
                  key={option}
                  onClick={() =>
                    handleAnswer(option === currentQuestion.subject.artistName, option)
                  }
                  variant="outline"
                >
                  {option}
                </Button>
              )
            })}
          </div>
        ) : (
          <form className="space-y-3" onSubmit={submitTextAnswer}>
            <Input
              autoCapitalize="words"
              autoCorrect="off"
              data-testid="artist-input"
              disabled={isFeedbackLocked}
              onChange={(event) => setTextAnswer(event.target.value)}
              placeholder="Type the artist"
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
                Debug answer: {currentQuestion.subject.artistName}
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
