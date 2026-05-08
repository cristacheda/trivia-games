import { outlineCountryQuestionBank } from '@/features/outline-quiz/data/countries'
import { outlineStateQuestionBank } from '@/features/outline-quiz/data/states'
import type {
  OutlineQuestionSource,
  OutlineSubjectKind,
} from '@/features/outline-quiz/types'

export const outlineQuestionBank: OutlineQuestionSource[] = [
  ...outlineCountryQuestionBank,
  ...outlineStateQuestionBank,
]

export const outlineQuestionBankByKind: Record<
  OutlineSubjectKind,
  OutlineQuestionSource[]
> = {
  country: outlineCountryQuestionBank,
  state: outlineStateQuestionBank,
}
