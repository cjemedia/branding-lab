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
  business: shortText.default(''),
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
  if (!a.business.trim()) missing.push('what your business does')
  if (a.tenSeconds.length === 0) missing.push('what people should understand in 10 seconds')
  if (!a.challenge) missing.push('your hardest part of showing up')
  if (!a.chooseBecause.trim()) missing.push('why people should choose your brand')
  if (Object.keys(a.sliders).length < 5) missing.push('all five personality sliders')
  return missing
}

// The Brand Identity Snapshot. Primary and secondary personality come straight
// from the student's choices; the AI writes everything else.
//
// Length limits here are generous on purpose. Structured outputs cannot enforce
// string lengths or exact list counts, so strict limits made the server throw
// out good results and silently generate again (slow, then an error screen).
// Length is guided in the AI instructions instead, and lists are trimmed in the
// generate route.
const text = z.string().min(1).max(2500)
// Added in instructions version 2. Optional so results saved before then still load.
const laterText = z.string().max(2500).default('')
const listItem = z.string().min(1).max(300)

export const resultSchema = z.object({
  brand_sentence: text,
  discovery: laterText,
  personality_mix: z.object({
    traits: z.array(listItem).min(1).max(5),
    stage_note: text,
    first_impression: text,
    customer_experience: text,
    try_this: laterText,
  }),
  how_it_speaks: z.object({
    primary_style: text,
    supporting_tone: text,
    example_phrases: z.array(listItem).min(1).max(3),
    habits_to_avoid: z.array(listItem).min(1).max(3),
    try_this: laterText,
  }),
  memorable: z.object({
    common_qualities: z.array(listItem).min(1).max(5),
    explanation: text,
    try_this: laterText,
  }),
  reality_check: z
    .array(
      z.object({
        area: z.string().min(1).max(200),
        why: text,
        action: text,
      })
    )
    .min(1)
    .max(3),
  creative_direction: z.object({
    visual_mood: text,
    imagery_style: text,
    typography_direction: text,
    color_characteristics: text,
    brand_experience: text,
    try_this: laterText,
  }),
  next_moves: z.array(z.string().min(1).max(600)).min(1).max(3),
})

export type RoomTestResult = z.infer<typeof resultSchema>

const TRY_THIS =
  'One specific creative idea that brings this section to life for their business: what to try, a realistic example of how to execute it for their business and audience, and a short clause on why it fits. One clear task, doable without a big time commitment. Three to four sentences.'

// JSON Schema handed to Claude as the required output shape
export const resultJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['brand_sentence', 'discovery', 'personality_mix', 'how_it_speaks', 'memorable', 'reality_check', 'creative_direction', 'next_moves'],
  properties: {
    brand_sentence: {
      type: 'string',
      description: 'Section 1. One or two memorable sentences describing the brand the student is building. Deliverable text in the student brand voice.',
    },
    discovery: {
      type: 'string',
      description: 'One meaningful insight the student probably has not considered, drawn from a connection across their answers. Two to three sentences.',
    },
    personality_mix: {
      type: 'object',
      additionalProperties: false,
      required: ['traits', 'stage_note', 'first_impression', 'customer_experience', 'try_this'],
      properties: {
        traits: { type: 'array', minItems: 1, items: { type: 'string' }, description: 'Three to five defining traits, a few words each.' },
        stage_note: { type: 'string', description: 'One or two sentences reflecting whether this personality is who the brand is today, is getting there, or is an aspiration.' },
        first_impression: { type: 'string', description: 'What their choices together suggest about the first impression they want to make, and why that combination works. Two to three sentences.' },
        customer_experience: { type: 'string', description: 'How a customer might actually experience this personality, connected to their feelings and reality check answers. Two to three sentences.' },
        try_this: { type: 'string', description: TRY_THIS },
      },
    },
    how_it_speaks: {
      type: 'object',
      additionalProperties: false,
      required: ['primary_style', 'supporting_tone', 'example_phrases', 'habits_to_avoid', 'try_this'],
      properties: {
        primary_style: { type: 'string', description: 'Primary communication style, why it fits, and what it signals to their audience. Two to three sentences.' },
        supporting_tone: { type: 'string', description: 'Supporting tone and how it balances the primary style. Two sentences.' },
        example_phrases: { type: 'array', minItems: 1, items: { type: 'string' }, description: 'Exactly three short example phrases in the student brand voice. Do not invent products, offers, or claims.' },
        habits_to_avoid: { type: 'array', minItems: 1, items: { type: 'string' }, description: 'Exactly three communication habits to avoid, informed by the style they said would feel fake.' },
        try_this: { type: 'string', description: TRY_THIS },
      },
    },
    memorable: {
      type: 'object',
      additionalProperties: false,
      required: ['common_qualities', 'explanation', 'try_this'],
      properties: {
        common_qualities: { type: 'array', minItems: 1, items: { type: 'string' }, description: 'Three to five qualities the three admired brands share, based only on what the student wrote.' },
        explanation: { type: 'string', description: 'What that pattern reveals about what the student values, and how it could inform their own brand without imitating the admired brands. Three to four sentences.' },
        try_this: { type: 'string', description: TRY_THIS },
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
          area: { type: 'string', description: 'A short, memorable name for the opportunity, two to five words.' },
          why: { type: 'string', description: 'Why it matters, tied to their answers. Two sentences.' },
          action: { type: 'string', description: 'One quick, specific task they can do this week. One or two sentences.' },
        },
      },
    },
    creative_direction: {
      type: 'object',
      additionalProperties: false,
      required: ['visual_mood', 'imagery_style', 'typography_direction', 'color_characteristics', 'brand_experience', 'try_this'],
      properties: {
        visual_mood: { type: 'string', description: 'One to two sentences.' },
        imagery_style: { type: 'string', description: 'One to two sentences, specific to their business.' },
        typography_direction: { type: 'string', description: 'General direction only, one to two sentences. Do not name specific fonts.' },
        color_characteristics: { type: 'string', description: 'Characteristics only, one to two sentences. Do not give hex codes or a final palette.' },
        brand_experience: { type: 'string', description: 'One to two sentences.' },
        try_this: { type: 'string', description: TRY_THIS },
      },
    },
    next_moves: { type: 'array', minItems: 1, items: { type: 'string' }, description: 'Exactly three quick next steps, ordered by what to do first. Each is one clear task in one or two sentences.' },
  },
} as const
