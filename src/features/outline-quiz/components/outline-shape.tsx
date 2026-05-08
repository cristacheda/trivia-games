import type { OutlineQuestionSource } from '@/features/outline-quiz/types'

interface OutlineShapeProps {
  className?: string
  subject: OutlineQuestionSource
}

export function OutlineShape({ className, subject }: OutlineShapeProps) {
  return (
    <svg
      aria-label={`${subject.name} outline`}
      className={className}
      role="img"
      viewBox={subject.outlineViewBox}
    >
      <path
        d={subject.outlinePath}
        fill="currentColor"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={0.8}
      />
    </svg>
  )
}
