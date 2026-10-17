import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Character,
  Conversation,
  Message,
  Settings,
  ThemeId,
  World,
  WorldState,
} from '@/types'
import { DEFAULT_GLOBAL_PROMPT, DEFAULT_USER_PERSONA, PREVIOUS_DEFAULT_GLOBAL_PROMPT } from '@/lib/prompt'
import { DEFAULT_BASE_URL } from '@/lib/groq'
import { uid } from '@/lib/utils'

export const MIN_AGE = 18

/** Characters are adults only: any supplied age below 18 becomes 18, empty stays empty. */
export function normalizeAge(raw: string | undefined | null): string {
  const value = (raw ?? '').trim()
  if (!value) return ''
  const digits = value.match(/\d+/)
  if (!digits) return ''
  return String(Math.max(MIN_AGE, Number(digits[0])))
}

export interface UIState {
  settingsOpen: boolean
  settingsTab: 'connection' | 'persona' | 'themes' | 'commands' | 'data'
  characterModal: null | { tab: 'create' | 'browse'; editId?: string }
  worldModal: null | { tab: 'world' | 'cast'; editId?: string }
  sidebarOpen: boolean
  memoryOpen: boolean
  rightPanel: 'none' | 'reputation' | 'memory'
}

interface State {
  settings: Settings
  characters: Character[]
  worlds: World[]
  conversations: Conversation[]
  activeConversationId: string | null
  activeWorldId: string | null
  ui: UIState

  updateSettings: (patch: Partial<Settings>) => void
  setTheme: (theme: ThemeId) => void

  createCharacter: (
    input: Partial<Character> & { name: string; theme: ThemeId },
  ) => Character
  updateCharacter: (id: string, patch: Partial<Character>) => void
  deleteCharacter: (id: string) => void
  duplicateCharacter: (id: string) => Character | undefined

  createWorld: (input: Partial<World> & { name: string }) => World
  updateWorld: (id: string, patch: Partial<World>) => void
  deleteWorld: (id: string) => void
  setActiveWorld: (id: string | null) => void

  newConversation: (characterId: string, worldId?: string) => string
  focusOrCreateConversation: (characterId: string, worldId?: string) => string
  setActiveConversation: (id: string | null) => void
  renameConversation: (id: string, title: string) => void
  deleteConversation: (id: string) => void
  clearConversation: (id: string) => void
  togglePin: (id: string) => void

  addMessage: (conversationId: string, message: Message) => void
  updateMessage: (
    conversationId: string,
    messageId: string,
    patch: Partial<Message>,
  ) => void
  removeMessage: (conversationId: string, messageId: string) => void
  setMemory: (conversationId: string, memory: string) => void
  updateWorldState: (conversationId: string, patch: Partial<WorldState>) => void

  setUI: (patch: Partial<UIState>) => void
  replaceAll: (data: {
    settings?: Partial<Settings>
    characters?: Character[]
    worlds?: World[]
    conversations?: Conversation[]
  }) => void
}

export const DEFAULT_SETTINGS: Settings = {
  apiKey: '',
  baseUrl: DEFAULT_BASE_URL,
  model: 'llama-3.3-70b-versatile',
  cachedModels: [],
  temperature: 0.85,
  maxTokens: 2048,
  topP: 1,
  globalSystemPrompt: DEFAULT_GLOBAL_PROMPT,
  userPersona: DEFAULT_USER_PERSONA,
  theme: 'chatbot',
  streaming: true,
  memoryEnabled: true,
  showThoughts: true,
  bubbleStyle: 'bubbles',
}

const defaultUI: UIState = {
  settingsOpen: false,
  settingsTab: 'connection',
  characterModal: null,
  worldModal: null,
  sidebarOpen: false,
  memoryOpen: false,
  rightPanel: 'none',
}

function emptyWorldState(npc?: string): WorldState {
  return {
    reputation: npc ? { [npc]: 0 } : {},
    events: [],
    notes: '',
  }
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,
      characters: [],
      worlds: [],
      conversations: [],
      activeConversationId: null,
      activeWorldId: null,
      ui: defaultUI,

      updateSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),

      setTheme: (theme) =>
        set((s) => {
          const firstConv = s.conversations
            .filter((c) => c.theme === theme)
            .sort((a, b) => b.updatedAt - a.updatedAt)[0]
          return {
            settings: { ...s.settings, theme },
            activeConversationId: firstConv?.id ?? null,
            ui: { ...s.ui, sidebarOpen: false, rightPanel: 'none' },
          }
        }),

      createCharacter: (input) => {
        const character: Character = {
          id: uid('char'),
          theme: input.theme,
          name: input.name,
          avatar: input.avatar ?? '',
          avatarColor: input.avatarColor ?? '#7c5cff',
          tagline: input.tagline ?? '',
          description: input.description ?? '',
          gender: input.gender ?? '',
          age: normalizeAge(input.age),
          tags: input.tags ?? [],
          greeting: input.greeting ?? '',
          canon: input.canon ?? 'custom',
          source: input.source ?? '',
          overrides: input.overrides ?? '',
          worldId: input.worldId,
          metadata: input.metadata ?? [],
          createdAt: Date.now(),
        }
        set((s) => ({ characters: [...s.characters, character] }))
        return character
      },

      updateCharacter: (id, patch) =>
        set((s) => ({
          characters: s.characters.map((c) =>
            c.id === id
              ? {
                  ...c,
                  ...patch,
                  ...(patch.age !== undefined
                    ? { age: normalizeAge(patch.age) }
                    : {}),
                }
              : c,
          ),
        })),

      deleteCharacter: (id) =>
        set((s) => ({
          characters: s.characters.filter((c) => c.id !== id),
          conversations: s.conversations.filter((c) => c.characterId !== id),
          activeConversationId:
            s.conversations.find((c) => c.id === s.activeConversationId)
              ?.characterId === id
              ? null
              : s.activeConversationId,
        })),

      duplicateCharacter: (id) => {
        const src = get().characters.find((c) => c.id === id)
        if (!src) return undefined
        const copy: Character = {
          ...src,
          id: uid('char'),
          name: `${src.name} (copy)`,
          createdAt: Date.now(),
        }
        set((s) => ({ characters: [...s.characters, copy] }))
        return copy
      },

      createWorld: (input) => {
        const world: World = {
          id: uid('world'),
          name: input.name,
          genre: input.genre ?? '',
          description: input.description ?? '',
          rules: input.rules ?? '',
          playerName: input.playerName ?? '',
          playerRole: input.playerRole ?? '',
          playerAppearance: input.playerAppearance ?? '',
          avatar: input.avatar ?? '🌍',
          avatarColor: input.avatarColor ?? '#34d399',
          locations: input.locations ?? '',
          factions: input.factions ?? '',
          lore: input.lore ?? '',
          color: input.color ?? '#34d399',
          createdAt: Date.now(),
        }
        set((s) => ({ worlds: [...s.worlds, world], activeWorldId: world.id }))
        return world
      },

      updateWorld: (id, patch) =>
        set((s) => ({
          worlds: s.worlds.map((w) => (w.id === id ? { ...w, ...patch } : w)),
        })),

      deleteWorld: (id) =>
        set((s) => ({
          worlds: s.worlds.filter((w) => w.id !== id),
          characters: s.characters.filter((c) => c.worldId !== id),
          conversations: s.conversations.filter((c) => c.worldId !== id),
          activeWorldId: s.activeWorldId === id ? null : s.activeWorldId,
          activeConversationId:
            s.conversations.find((c) => c.id === s.activeConversationId)
              ?.worldId === id
              ? null
              : s.activeConversationId,
        })),

      setActiveWorld: (id) =>
        set((s) => ({
          activeWorldId: id,
          activeConversationId:
            s.activeConversationId &&
            s.conversations.find((c) => c.id === s.activeConversationId)
              ?.worldId === id
              ? s.activeConversationId
              : null,
        })),

      newConversation: (characterId, worldId) => {
        const character = get().characters.find((c) => c.id === characterId)
        const resolvedWorldId = worldId ?? character?.worldId
        const cast = resolvedWorldId
          ? get().characters.filter((c) => c.worldId === resolvedWorldId)
          : []
        const seedReputation: Record<string, number> = {}
        for (const member of cast) seedReputation[member.name] = 0
        if (character && !(character.name in seedReputation)) {
          seedReputation[character.name] = 0
        }
        const id = uid('conv')
        const messages: Message[] = []
        if (character?.greeting?.trim()) {
          messages.push({
            id: uid('msg'),
            role: 'assistant',
            content: character.greeting.trim(),
            timestamp: Date.now(),
          })
        }
        const conversation: Conversation = {
          id,
          theme: character?.theme ?? 'chatbot',
          characterId,
          worldId: resolvedWorldId,
          title: character?.name ?? 'New chat',
          messages,
          memory: '',
          worldState:
            character && (character.theme === 'world' || resolvedWorldId)
              ? { reputation: seedReputation, events: [], notes: '' }
              : undefined,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        set((s) => ({
          conversations: [conversation, ...s.conversations],
          activeConversationId: id,
          ui: { ...s.ui, sidebarOpen: false },
        }))
        return id
      },

      focusOrCreateConversation: (characterId, worldId) => {
        const existing = get().conversations.find(
          (c) =>
            c.characterId === characterId &&
            (worldId ? c.worldId === worldId : true),
        )
        if (existing) {
          set((s) => ({
            activeConversationId: existing.id,
            ui: { ...s.ui, sidebarOpen: false },
          }))
          return existing.id
        }
        return get().newConversation(characterId, worldId)
      },

      setActiveConversation: (id) =>
        set((s) => ({
          activeConversationId: id,
          ui: { ...s.ui, sidebarOpen: false, rightPanel: 'none' },
        })),

      renameConversation: (id, title) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === id ? { ...c, title } : c,
          ),
        })),

      deleteConversation: (id) =>
        set((s) => ({
          conversations: s.conversations.filter((c) => c.id !== id),
          activeConversationId:
            s.activeConversationId === id ? null : s.activeConversationId,
        })),

      clearConversation: (id) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === id
              ? {
                  ...c,
                  messages: c.messages.filter((m) => m.role === 'assistant').slice(0, 1),
                  memory: '',
                  updatedAt: Date.now(),
                }
              : c,
          ),
        })),

      togglePin: (id) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === id ? { ...c, pinned: !c.pinned } : c,
          ),
        })),

      addMessage: (conversationId, message) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: [...c.messages, message],
                  updatedAt: Date.now(),
                  title:
                    c.messages.filter((m) => m.role === 'user').length === 0 &&
                    message.role === 'user'
                      ? message.content.slice(0, 42) || c.title
                      : c.title,
                }
              : c,
          ),
        })),

      updateMessage: (conversationId, messageId, patch) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === messageId ? { ...m, ...patch } : m,
                  ),
                  updatedAt: Date.now(),
                }
              : c,
          ),
        })),

      removeMessage: (conversationId, messageId) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: c.messages.filter((m) => m.id !== messageId),
                }
              : c,
          ),
        })),

      setMemory: (conversationId, memory) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId ? { ...c, memory } : c,
          ),
        })),

      updateWorldState: (conversationId, patch) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  worldState: {
                    ...(c.worldState ?? emptyWorldState()),
                    ...patch,
                  },
                }
              : c,
          ),
        })),

      setUI: (patch) => set((s) => ({ ui: { ...s.ui, ...patch } })),

      replaceAll: (data) =>
        set((s) => ({
          settings: { ...s.settings, ...(data.settings ?? {}) },
          characters: data.characters
            ? data.characters.map((c: Character) => ({
                ...c,
                age: normalizeAge(c.age),
              }))
            : s.characters,
          worlds: data.worlds ?? s.worlds,
          conversations: data.conversations ?? s.conversations,
        })),
    }),
    {
      name: 'nexus-chat-store',
      version: 5,
      migrate: (persisted: any) => {
        if (persisted?.settings?.globalSystemPrompt === PREVIOUS_DEFAULT_GLOBAL_PROMPT) {
          persisted.settings.globalSystemPrompt = DEFAULT_GLOBAL_PROMPT
        }
        if (persisted?.settings?.model === 'openai/gpt-oss-safeguard-20b') {
          persisted.settings.model = DEFAULT_SETTINGS.model
        }
        if (persisted?.settings && !persisted.settings.baseUrl) {
          persisted.settings.baseUrl = DEFAULT_BASE_URL
        }
        if (persisted?.settings && !Array.isArray(persisted.settings.cachedModels)) {
          persisted.settings.cachedModels = []
        }
        if (persisted?.settings) persisted.settings.apiKey = ''
        // Characters are adults only (18+). Clamp anything saved as a minor.
        if (Array.isArray(persisted?.characters)) {
          persisted.characters = persisted.characters.map((c: Character) =>
            c && c.age ? { ...c, age: normalizeAge(c.age) } : c,
          )
        }
        return persisted
      },
      partialize: (s) => ({
        settings: s.settings,
        characters: s.characters,
        worlds: s.worlds,
        conversations: s.conversations,
        activeConversationId: s.activeConversationId,
        activeWorldId: s.activeWorldId,
      }),
    },
  ),
)

export const emptyWorldStateFor = emptyWorldState
