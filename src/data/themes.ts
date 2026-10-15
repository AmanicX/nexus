import type { ThemeId } from '@/types'

export interface ThemeMeta {
  id: ThemeId
  name: string
  tagline: string
  icon: string
  blurb: string
  features: string[]
}

export const THEMES: Record<ThemeId, ThemeMeta> = {
  chatbot: {
    id: 'chatbot',
    name: 'Chatbot',
    tagline: 'Any character, any world',
    icon: '✦',
    blurb:
      'The open sandbox. Invent characters from scratch, give them any personality, and talk freely.',
    features: [
      'Free-form character builder',
      'Custom personality, gender, age & tags',
      'No canon — 100% your invention',
    ],
  },
  anime: {
    id: 'anime',
    name: 'Anime',
    tagline: 'Canon cast, your edits',
    icon: '❀',
    blurb:
      'Talk to canon characters from Naruto, High School DxD and more — then reshape them without erasing who they are.',
    features: [
      'Preset canon personalities & voices',
      'Non-destructive edits (keep canon, tweak traits)',
      'Swap gender or rewrite a single trait',
    ],
  },
  world: {
    id: 'world',
    name: 'World',
    tagline: 'Fanfiction, lived',
    icon: '❖',
    blurb:
      'Build a whole world, cast yourself into it, and play against anyone inside. Reputation and history evolve from your actions.',
    features: [
      'Full world bible: lore, factions, locations',
      'You play a character with a role & appearance',
      'Living reputation — who loves or hates you',
    ],
  },
}

export const THEME_ORDER: ThemeId[] = ['chatbot', 'anime', 'world']
