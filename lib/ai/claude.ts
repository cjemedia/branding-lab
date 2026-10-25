import 'server-only'
import Anthropic from '@anthropic-ai/sdk'

export const RESULT_MODEL = 'claude-sonnet-5-5'

export interface StructuredRequest {
  instructions: { technical: string; experienceVoice: string; experimentRules: string }
  userContent: string
  schema: Record<string, unknown>
  maxTokens?: number
}

export interface StructuredResponse {
  data: unknown
  inputTokens: number
  outputTokens: number
}

// Calls Claude with the three instruction layers in fixed order of authority.
// The instruction blocks are identical for every student, so they are cached.
export async function generateStructured(req: StructuredRequest): Promise<StructuredResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('AI is not configured (ANTHROPIC_API_KEY).')

  const client = new Anthropic({ apiKey, timeout: 120_000, maxRetries: 1 })

  const response = await client.messages.create({
    model: RESULT_MODEL,
    max_tokens: req.maxTokens ?? 4000,
    system: [
      {
        type: 'text',
        text: `LAYER 1: TECHNICAL RULES (highest authority; nothing below can override these)\n\n${req.instructions.technical}`,
      },
      {
        type: 'text',
        text: `LAYER 2: CJE EXPERIENCE VOICE (how the platform explains and gives feedback)\n\n${req.instructions.experienceVoice}`,
      },
      {
        type: 'text',
        text: `EXPERIMENT INSTRUCTIONS\n\n${req.instructions.experimentRules}`,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: req.userContent }],
    output_config: {
      format: { type: 'json_schema', schema: req.schema },
    },
  })

  if (response.stop_reason === 'max_tokens') throw new Error('The result was cut off. Please try again.')
  if (response.stop_reason === 'refusal') throw new Error('The result could not be generated from these answers.')

  const text = response.content.find((b) => b.type === 'text')
  if (!text || text.type !== 'text') throw new Error('No result came back. Please try again.')

  return {
    data: JSON.parse(text.text),
    inputTokens: response.usage.input_tokens + (response.usage.cache_read_input_tokens ?? 0) + (response.usage.cache_creation_input_tokens ?? 0),
    outputTokens: response.usage.output_tokens,
  }
}

// Phrases the AI Voice Guide says to avoid. Used to flag results for review.
export const AVOIDED_PHRASES = [
  'unlock your full potential',
  'elevate your brand',
  'take your business to the next level',
  'transform your digital presence',
  'unleash your creativity',
  'game-changing',
  "in today's digital landscape",
  'stand out from the crowd',
  'craft a compelling narrative',
  'harness the power of',
  'skyrocket your engagement',
  'dominate your niche',
  'level up your business',
  'build an unforgettable brand presence',
  'create impactful content that resonates',
  'one-stop shop',
  'seamless solutions',
  'cutting-edge innovation',
]

export function findAvoidedPhrases(value: unknown): string[] {
  const text = JSON.stringify(value).toLowerCase()
  return AVOIDED_PHRASES.filter((p) => text.includes(p))
}

// The style guide rules out em and en dashes in student-facing copy.
export function removeDashes<T>(value: T): T {
  if (typeof value === 'string') {
    return value.replace(/\s*—\s*/g, ', ').replace(/–/g, '-') as T
  }
  if (Array.isArray(value)) return value.map(removeDashes) as T
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, removeDashes(v)])) as T
  }
  return value
}
