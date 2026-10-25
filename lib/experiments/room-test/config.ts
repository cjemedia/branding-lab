// Experiment 001: The Room Test
// All student-facing copy below is Ciara J.'s wording from the approved spec.

export const ROOM_TEST_SLUG = 'the-room-test'

export const INSPIRATION_TAGS = [
  'Their personality',
  'Their visuals',
  'Their storytelling',
  'Their customer experience',
  'Their consistency',
  'Their community',
  'Their creativity',
  'Their products or services',
] as const

export const PERSONALITIES = [
  {
    id: 'A',
    name: 'The One Everybody Notices',
    description: "Confident. Expressive. Doesn't need permission to take up space.",
  },
  {
    id: 'B',
    name: 'The One Everybody Feels Comfortable Around',
    description: 'Warm. Welcoming. Makes people feel like they belong.',
  },
  {
    id: 'C',
    name: 'The One Everybody Goes To For Advice',
    description: 'Knowledgeable. Reliable. Always bringing something valuable to the conversation.',
  },
  {
    id: 'D',
    name: "The One Who Doesn't Have To Say Much",
    description: 'Intentional. Refined. Quiet confidence speaks for itself.',
  },
  {
    id: 'E',
    name: 'The One Who Brings The Energy',
    description: 'Creative. Fun. Makes even ordinary things feel exciting.',
  },
] as const

export const STAGES = [
  { id: 'already', label: "That's already us." },
  { id: 'getting_there', label: "We're getting there." },
  { id: 'aspiration', label: "That's who I want us to become." },
] as const

export const COMMUNICATION_STYLES = [
  {
    id: 'A',
    name: 'The Straight Shooter',
    sample: "It's here. You've been asking, and we delivered. Let's get into it.",
  },
  {
    id: 'B',
    name: 'The Warm Friend',
    sample: "We've been working on something special, and we couldn't wait to share it with you.",
  },
  {
    id: 'C',
    name: 'The Expert',
    sample: 'Introducing a new solution designed to make your experience simpler and more effective.',
  },
  {
    id: 'D',
    name: 'The Elevated One',
    sample: 'Something thoughtfully created. Something worth the wait. Introducing our newest offering.',
  },
  {
    id: 'E',
    name: 'The Playful One',
    sample: "Okay, so we've been keeping a little secret... and it's GOOD.",
  },
] as const

export const FEELINGS = [
  'I feel like they understand me.',
  "They really know what they're doing.",
  'I want to be part of this.',
  'That was such a good experience.',
  'I trust them with my money.',
  "I haven't seen anything quite like that.",
  'I feel inspired to take action.',
] as const

export const TEN_SECONDS = [
  'What I sell or offer',
  'Who I help',
  "Why I'm different",
  'What my brand stands for',
  'How to take the next step',
] as const

export const CHALLENGES = [
  "I don't know what makes me different.",
  "My visuals don't feel like me.",
  'I struggle to explain what I do.',
  'My content feels all over the place.',
  "I know my vision, but I can't bring it together.",
  "I'm still figuring out my audience.",
] as const

export const SLIDERS = [
  {
    id: 'playful_serious',
    left: 'Playful',
    right: 'Serious',
    leftHint: 'Lighthearted, uses humor, keeps things fun',
    rightHint: 'Focused, measured, keeps things businesslike',
  },
  {
    id: 'relaxed_structured',
    left: 'Relaxed',
    right: 'Structured',
    leftHint: 'Easygoing, flexible, goes with the flow',
    rightHint: 'Organized, consistent, follows a clear system',
  },
  {
    id: 'quiet_expressive',
    left: 'Quiet',
    right: 'Expressive',
    leftHint: 'Understated, lets the work speak',
    rightHint: 'Bold, vocal, hard to miss',
  },
  {
    id: 'traditional_experimental',
    left: 'Traditional',
    right: 'Experimental',
    leftHint: 'Classic, familiar, timeless',
    rightHint: 'New ideas, unexpected, tries things first',
  },
  {
    id: 'casual_formal',
    left: 'Casual',
    right: 'Formal',
    leftHint: 'Conversational, laid-back, everyday language',
    rightHint: 'Polished, professional, buttoned-up',
  },
] as const

export const COPY = {
  intro: {
    headline: 'If Your Brand Walked Into a Room...',
    subheadline: 'Would anybody remember meeting it?',
    body: [
      'Think about it. Some brands walk into the room and everybody notices. Others make you feel right at home. Some barely say a word, but somehow you remember them.',
      "Your brand has a personality, whether you've figured it out or not.",
      "So before we start picking colors and making logos, let's figure out who we're actually introducing to the world.",
    ],
    button: "Let's Find Out.",
    time: '8 to 12 minutes',
  },
  brands: {
    headline: "Okay, let's talk about the brands that GET IT.",
    subheadline: "You know those brands that don't even have to try too hard? You recognize them immediately.",
    questions: {
      name: "What's the brand?",
      noticed: 'What made you notice them in the first place?',
      interested: 'What keeps you interested?',
      miss: 'If this brand disappeared tomorrow, what would you actually miss?',
    },
    reflection: "Interesting. You clearly know what catches your attention. Now let's figure out what you want people to notice about YOU.",
  },
  room: {
    headline: 'Your brand just walked into a room.',
    subheadline: "Nobody knows who you are yet. What's the first impression?",
    stageQuestion: "Does this describe who your brand is TODAY or who you're working toward becoming?",
  },
  groupChat: {
    headline: 'Your brand just got added to the group chat.',
    subheadline: "Now let's see how it talks.",
    scenario: 'The brand is announcing a new product or service.',
    soundsLike: 'Which one sounds most like something your brand would actually say?',
    fake: 'Which one would feel completely fake coming from your brand?',
  },
  impression: {
    headline: "Let's talk about the feeling you leave behind.",
    subheadline: "Because people might forget your exact words, but they'll remember how your brand made them feel.",
    question: 'When someone leaves your website, page, event, or business, what do you want them thinking?',
    never: "What's ONE thing you never want somebody saying about your brand?",
  },
  reality: {
    headline: 'Okay, but can your brand back it up?',
    subheadline: "A beautiful brand means nothing if the experience doesn't match.",
    q1: 'Someone discovers your brand for the first time. What do you want them to understand within 10 seconds?',
    q2: "What's currently the hardest part of showing up as your brand?",
    q3: 'Finish this sentence: I want people to choose my brand because...',
  },
  mix: {
    headline: "Plot twist. Your brand doesn't have to fit into one box.",
    subheadline:
      'You can be professional and funny. Luxurious and approachable. Bold and thoughtful. The magic is in how you bring it together.',
  },
  reveal: {
    headline: "Okay, NOW we're getting somewhere.",
    subheadline: "Meet the brand you're building.",
    closing:
      "Your brand doesn't need to be everybody's favorite. It needs to be recognizable, intentional, and true to what you're building.",
  },
  save: {
    headline: "Don't lose the vision.",
  },
} as const
