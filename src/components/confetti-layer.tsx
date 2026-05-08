import { useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'

interface ConfettiLayerProps {
  burstKey?: number
  celebrationMs?: number
}

export function ConfettiLayer({
  burstKey,
  celebrationMs = 0,
}: ConfettiLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const confettiRef = useRef<ReturnType<typeof confetti.create> | null>(null)

  useEffect(() => {
    if (!canvasRef.current) {
      return
    }

    confettiRef.current = confetti.create(canvasRef.current, {
      resize: true,
      useWorker: true,
    })

    return () => {
      confettiRef.current?.reset()
      confettiRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!burstKey || !confettiRef.current) {
      return
    }

    confettiRef.current({
      angle: 90,
      spread: 72,
      startVelocity: 35,
      particleCount: 90,
      origin: { x: 0.5, y: 0.45 },
      scalar: 0.9,
    })
  }, [burstKey])

  useEffect(() => {
    if (!celebrationMs || !confettiRef.current) {
      return
    }

    const endTime = Date.now() + celebrationMs
    const interval = window.setInterval(() => {
      if (!confettiRef.current) {
        return
      }

      if (Date.now() >= endTime) {
        window.clearInterval(interval)
        return
      }

      confettiRef.current({
        particleCount: 10,
        startVelocity: 26,
        spread: 65,
        ticks: 140,
        origin: { x: Math.random(), y: Math.random() * 0.2 + 0.05 },
      })
    }, 220)

    return () => window.clearInterval(interval)
  }, [celebrationMs])

  return (
    <canvas
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-40 h-full w-full"
      data-active={celebrationMs > 0 ? 'true' : burstKey ? 'burst' : 'false'}
      data-testid="confetti-layer"
      ref={canvasRef}
    />
  )
}
