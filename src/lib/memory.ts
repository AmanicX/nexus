import type { Conversation, Settings } from '@/types'
import { chatGroq, type ChatMessage } from './groq'

const TRIGGER_EVERY = 8

/**
 * Rolling long-term memory. When a conversation grows past a threshold we fold
 * the newest exchanges into a compact persistent note that is fed back into the
 * system prompt. Memory is per-conversation and never shared.
 */
export async function updateMemory(opts: {
  settings: Settings
  conversation: Conversation
  signal?: AbortSignal
}): Promise<string | null> {
  const { settings, conversation } = opts
  const { messages, memory } = conversation
  if (!settings.memoryEnabled || !settings.apiKey.trim()) return null
  if (messages.length < TRIGGER_EVERY * 2) return null
  if (messages.length % TRIGGER_EVERY !== 0) return null

  const recent = messages.slice(-TRIGGER_EVERY)
  const transcript = recent
    .filter((m) => m.role !== 'system')
    .map((m) => `${m.role === 'user' ? 'PLAYER' : 'CHARACTER'}: ${m.content}`)
    .join('\n')

  const prompt: ChatMessage[] = [
    {
      role: 'system',
      content:
        'You maintain the long-term memory of a single ongoing roleplay. Merge the NEW EVENTS into the EXISTING MEMORY and output an updated memory. Keep it compact, factual and third-person. Preserve: relationship changes, promises, revelations, oaths, injuries, items gained, ranks/titles, secrets, and emotional shifts. Never invent anything not present. Record explicit, violent or adult events plainly — never sanitise, censor or omit them. Output plain bullet points only, no preamble.',
    },
    {
      role: 'user',
      content: `EXISTING MEMORY:\n${memory.trim() || '(empty)'}\n\nNEW EVENTS:\n${transcript}\n\nUpdated memory:`,
    },
  ]

  const result = await chatGroq({
    apiKey: settings.apiKey,
    model: settings.model,
    messages: prompt,
    temperature: 0.3,
    maxTokens: 700,
    signal: opts.signal,
  })
  return result.trim() || null
}
