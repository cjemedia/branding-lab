import type { ZodTypeAny } from 'zod'
import { answersSchema as roomTestAnswers, resultSchema as roomTestResult } from './room-test/schema'

// Server-side validation for each experiment's saved answers and results
export const experimentSchemas: Record<string, { answers: ZodTypeAny; result: ZodTypeAny }> = {
  'the-room-test': { answers: roomTestAnswers, result: roomTestResult },
}
