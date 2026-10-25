import { z } from 'zod'

const shortText = z.string().max(600)
const id = z.enum(['A', 'B', 'C', 'D', 'E'])

export const admiredBrandSchema = z.object({
  name: z.string().max(120).default(''),
  noticed: shortText.default(''),
  interested: shortText.default(''),
  miss: shortText.default(''),
  tags: z.array(z.string().max(60)).max(8).default([]),
})

// Saved as the student goes. Everything optional so autosave never fails.
export const answersSchema = z.object({
  brands: z.array(admiredBrandSchema).max(3).default([]),
  primaryPersonality: id.nullable().default(null),
  secondaryPersonality: id.nullable().default(null),
  stage: z.enum(['already', 'getting_there', 'aspiration']).nullable().default(null),
  soundsLike: z.array(id).max(2).default([]),
  wouldFeelFake: id.nullable().default(null),
  feelings: z.array(z.string().max(80)).max(3).default([]),
  neverSay: shortText.default(''),
  tenSeconds: z.array(z.string().max(60)).max(2).default([]),
  challenge: z.string().max(80).nullable().default(null),
  chooseBecause: shortText.default(''),
  sliders: z.record(z.string(), z.number().int().min(1).max(5)).default({}),
})

export type RoomTestAnswers = z.infer<typeof answersSchema>

export const emptyAnswers: RoomTestAnswers = answersSchema.parse({})

// What must be filled in before results can be generated
export function missingForGeneration(a: RoomTestAnswers): string[] {
  const missing: string[] = []
  const brands = a.brands.filter((b) => b.name.trim())
  if (brands.length < 3) missing.push('three admired brands')
  if (a.brands.slice(0, 3).some((b) => b.name.trim() && (!b.noticed.trim() || !b.interested.trim() || !b.miss.trim()))) {
    missing.push('all three questions for each brand')
  }
  if (!a.primaryPersonality) missing.push('a primary personality')
  if (!a.stage) missing.push('whether that describes your brand today')
  if (a.soundsLike.length === 0) missing.push('how your brand sounds')
  if (!a.wouldFeelFake) missing.push('which style would feel fake')
  if (a.wouldFeelFake && a.soundsLike.includes(a.wouldFeelFake)) missing.push('a different "would feel fake" choice')
  if (a.feelings.length === 0) missing.push('the feeling you leave behind')
  if (!a.neverSay.trim()) missing.push('what you never want said about your brand')
  if (a.tenSeconds.length === 0) missing.push('what people should understand in 10 seconds')
  if (!a.challenge) missing.push('your hardest part of showing up')
  if (!a.chooseBecause.trim()) missing.push('why people should choose your brand')
  if (Object.keys(a.sliders).length < 5) missing.push('all five personality sliders')
  return missing
}

// The Brand Identity Snapshot. Primary and secondary personality come straight
// from the student's choices; the AI writes everything else.
export const resultSchema = z.object({
  brand_sentence: z.string().min(1).max(500),
  personality_mix: z.object({
    traits: z.array(z.string().min(1).max(80)).min(3).max(5),
    stage_note: z.string().min(1).max(400),
    first_impression: z.string().min(1).max(400),
    customer_experience: z.string().min(1).max(400),
  }),
  how_it_speaks: z.object({
    primary_style: z.string().min(1).max(200),
    supporting_tone: z.string().min(1).max(300),
    example_phrases: z.array(z.string().min(1).max(200)).length(3),
    habits_to_avoid: z.array(z.string().min(1).max(200)).length(3),
  }),
  memorable: z.object({
    common_qualities: z.array(z.string().min(1).max(120)).min(1).max(5),
    explanation: z.string().min(1).max(900),
  }),
  reality_check: z
    .array(
      z.object({
        area: z.string().min(1).max(120),
        why: z.string().min(1).max(400),
        action: z.string().min(1).max(400),
      })
    )
    .min(1)
    .max(3),
  creative_direction: z.object({
    visual_mood: z.string().min(1).max(400),
    imagery_style: z.string().min(1).max(400),
    typography_direction: z.string().min(1).max(400),
    color_characteristics: z.string().min(1).max(400),
    brand_experience: z.string().min(1).max(400),
  }),
  next_moves: z.array(z.string().min(1).max(300)).length(3),
})

export type RoomTestResult = z.infer<typeof resultSchema>

// JSON Schema handed to Claude as the required output shape
export const resultJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['brand_sentence', 'personality_mix', 'how_it_speaks', 'memorable', 'reality_check', 'creative_direction', 'next_moves'],
  properties: {
    brand_sentence: {
      type: 'string',
      description: 'Section 1. One or two memorable sentences describing the brand the student is building. Deliverable text in the student brand voice.',
    },
    personality_mix: {
      type: 'object',
      additionalProperties: false,
      required: ['traits', 'stage_note', 'first_impression', 'customer_experience'],
      properties: {
        traits: { type: 'array', minItems: 1, items: { type: 'string' }, description: 'Three to five defining traits, a few words each.' },
        stage_note: { type: 'string', description: 'One or two sentences reflecting whether this personality is who the brand is today, is getting there, or is an aspiration.' },
        first_impression: { type: 'string', description: 'The desired first impression, grounded in their Room Test and feelings answers.' },
        customer_experience: { type: 'string', description: 'The desired customer experience, grounded in their feelings and reality check answers.' },
      },
    },
    how_it_speaks: {
      type: 'object',
      additionalProperties: false,
      required: ['primary_style', 'supporting_tone', 'example_phrases', 'habits_to_avoid'],
      properties: {
        primary_style: { type: 'string', description: 'Primary communication style and why it fits.' },
        supporting_tone: { type: 'string', description: 'Supporting tone and how it balances the primary style.' },
        example_phrases: { type: 'array', minItems: 1, items: { type: 'string' }, description: 'Three short example phrases in the student brand voice. Generic enough not to invent products or claims.' },
        habits_to_avoid: { type: 'array', minItems: 1, items: { type: 'string' }, description: 'Three communication habits to avoid, informed by the style they said would feel fake.' },
      },
    },
    memorable: {
      type: 'object',
      additionalProperties: false,
      required: ['common_qualities', 'explanation'],
      properties: {
        common_qualities: { type: 'array', minItems: 1, items: { type: 'string' }, description: 'Qualities the three admired brands share, based only on what the student wrote.' },
        explanation: { type: 'string', description: 'How those qualities could inform their own brand without imitating the admired brands.' },
      },
    },
    reality_check: {
      type: 'array',
      description: 'Up to three gaps between the intended brand and the stated challenges.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['area', 'why', 'action'],
        properties: {
          area: { type: 'string', description: 'Short name of the area needing attention.' },
          why: { type: 'string', description: 'Why it matters, tied to their answers.' },
          action: { type: 'string', description: 'One specific action.' },
        },
      },
    },
    creative_direction: {
      type: 'object',
      additionalProperties: false,
      required: ['visual_mood', 'imagery_style', 'typography_direction', 'color_characteristics', 'brand_experience'],
      properties: {
        visual_mood: { type: 'string' },
        imagery_style: { type: 'string' },
        typography_direction: { type: 'string', description: 'General direction only. Do not name specific fonts.' },
        color_characteristics: { type: 'string', description: 'Characteristics only. Do not give hex codes or a final palette.' },
        brand_experience: { type: 'string' },
      },
    },
    next_moves: { type: 'array', minItems: 1, items: { type: 'string' }, description: 'Three specific next steps based on their answers.' },
  },
} as const
