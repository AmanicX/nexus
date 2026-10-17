export type ThemeId = 'chatbot' | 'anime' | 'world'
export type Role = 'user' | 'assistant' | 'system'

export type CanonType = 'canon' | 'custom'

export interface CharacterMeta {
  id: string
  key: string
  value: string
}

export interface Character {
  id: string
  theme: ThemeId
  name: string
  avatar: string // emoji OR data-url OR url
  avatarColor: string
  tagline: string
  description: string // core persona / character prompt
  gender: string
  age: string
  tags: string[]
  greeting: string
  canon: CanonType
  source: string // e.g. "Naruto", "High School DxD"
  overrides: string // user modifications layered on top of canon personality
  worldId?: string // only for world-theme NPCs
  metadata: CharacterMeta[]
  createdAt: number
}

export interface World {
  id: string
  name: string
  genre: string
  description: string
  rules: string
  playerName: string
  playerRole: string
  playerAppearance: string
  avatar: string
  avatarColor: string
  locations: string
  factions: string
  lore: string
  color: string
  createdAt: number
}

export type CommandType =
  | 'thought'
  | 'action'
  | 'npc-thought'
  | 'npc-action'
  | 'god'
  | 'world'

export interface ParsedCommand {
  type: CommandType
  text: string
  name?: string
  raw: string
}

export interface ParsedInput {
  speech: string
  commands: ParsedCommand[]
}

export interface Message {
  id: string
  role: Role
  content: string
  raw?: string
  commands?: ParsedCommand[]
  timestamp: number
  error?: boolean
}

export interface Reputation {
  [npc: string]: number // -100 .. 100
}

export interface WorldState {
  reputation: Reputation
  events: string[]
  notes: string
}

export interface Conversation {
  id: string
  theme: ThemeId
  characterId: string
  worldId?: string
  title: string
  messages: Message[]
  memory: string
  worldState?: WorldState
  createdAt: number
  updatedAt: number
  pinned?: boolean
}

export interface Settings {
  apiKey: string
  baseUrl: string
  model: string
  cachedModels: string[]
  temperature: number
  maxTokens: number
  topP: number
  globalSystemPrompt: string
  userPersona: string
  theme: ThemeId
  streaming: boolean
  memoryEnabled: boolean
  showThoughts: boolean
  bubbleStyle: 'bubbles' | 'document'
  onboarded: boolean
}

export interface GroqModel {
  id: string
  label: string
  note: string
}
