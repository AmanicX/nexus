import type { GroqModel } from '@/types'

export const DEFAULT_BASE_URL = 'https://api.groq.com/openai/v1'

export interface ProviderPreset {
  id: string
  label: string
  baseUrl: string
  keyHint: string
  keyUrl?: string
}

/**
 * Any OpenAI-compatible endpoint works. The presets are just shortcuts —
 * the user can always type their own Base URL and model id.
 */
export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    id: 'groq',
    label: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    keyHint: 'gsk_…',
    keyUrl: 'https://console.groq.com/keys',
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    keyHint: 'sk-or-…',
    keyUrl: 'https://openrouter.ai/keys',
  },
  {
    id: 'lmstudio',
    label: 'LM Studio',
    baseUrl: 'http://localhost:1234/v1',
    keyHint: 'not needed',
  },
  {
    id: 'ollama',
    label: 'Ollama',
    baseUrl: 'http://localhost:11434/v1',
    keyHint: 'not needed',
  },
  {
    id: 'openai',
    label: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    keyHint: 'sk-…',
    keyUrl: 'https://platform.openai.com/api-keys',
  },
]

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface GroqChatOptions {
  apiKey: string
  model: string
  messages: ChatMessage[]
  baseUrl?: string
  temperature?: number
  maxTokens?: number
  topP?: number
  signal?: AbortSignal
}

export const GROQ_MODELS: GroqModel[] = [
  {
    id: 'llama-3.3-70b-versatile',
    label: 'Llama 3.3 70B',
    note: 'Groq’s most steerable big model · strong, unfiltered roleplay',
  },
  {
    id: 'llama-3.1-8b-instant',
    label: 'Llama 3.1 8B',
    note: 'Very fast and permissive',
  },
  {
    id: 'qwen/qwen3.8-27b',
    label: 'Qwen3 27B',
    note: 'Nuanced, multilingual, expressive',
  },
  {
    id: 'openai/gpt-oss-120b',
    label: 'GPT-OSS 120B',
    note: 'Smartest overall, but stricter about mature content',
  },
  {
    id: 'openai/gpt-oss-20b',
    label: 'GPT-OSS 20B',
    note: 'Balanced — fast and capable',
  },
  {
    id: 'allam-2-7b',
    label: 'Allam 2 7B',
    note: 'Lightweight and quick',
  },
]

/**
 * Suggested model ids per provider. These are just starting points — "fetch
 * models" pulls the provider's real, live list at runtime.
 */
export const MODEL_SUGGESTIONS: Record<string, string[]> = {
  groq: GROQ_MODELS.map((m) => m.id),
  openrouter: [
    'cognitivecomputations/dolphin-mixtral-8x22b',
    'sao10k/l3.1-euryale-70b',
    'nousresearch/hermes-3-llama-3.1-70b',
    'meta-llama/llama-3.3-70b-instruct',
    'mistralai/mistral-nemo',
    'anthropic/claude-3.5-sonnet',
  ],
  ollama: [
    'llama3.2',
    'llama3.1',
    'qwen2.5',
    'mistral-nemo',
    'mixtral',
    'gemma2',
    'deepseek-r1',
  ],
  lmstudio: [],
  openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1', 'gpt-4.1-mini'],
}

export function presetIdFor(baseUrl?: string): string | null {
  const base = resolveBaseUrl(baseUrl)
  return PROVIDER_PRESETS.find((p) => p.baseUrl === base)?.id ?? null
}

export function suggestionsFor(baseUrl?: string): string[] {
  const id = presetIdFor(baseUrl)
  return id ? (MODEL_SUGGESTIONS[id] ?? []) : []
}

const NON_CHAT = /whisper|tts|orpheus|prompt-guard|guard|embed|rerank|vision/i

export function resolveBaseUrl(baseUrl?: string): string {
  const base = (baseUrl ?? '').trim() || DEFAULT_BASE_URL
  return base.replace(/\/+$/, '')
}

/** Local servers (Ollama, LM Studio…) ignore auth, so a key is optional for them. */
export function providerNeedsKey(baseUrl?: string): boolean {
  return !/localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]/i.test(resolveBaseUrl(baseUrl))
}

function headers(apiKey: string): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' }
  if (apiKey.trim()) h.Authorization = `Bearer ${apiKey.trim()}`
  return h
}

function errorFrom(body: string, status: number) {
  let msg = ''
  try {
    const parsed = JSON.parse(body)
    msg = parsed?.error?.message ?? parsed?.message ?? ''
  } catch {
    /* not json */
  }
  if (status === 429) {
    return new Error(
      `Rate limit reached — ${msg || 'The provider caps tokens per minute. Wait a few seconds, then send again.'}`,
    )
  }
  if (status === 413) {
    return new Error('This conversation is too large for the model. Clear the chat or trim memory, then retry.')
  }
  if (status === 401 || status === 403) {
    return new Error(`Not authorised (${status}) — check your API key. ${msg}`.trim())
  }
  if (msg) return new Error(`${status}: ${msg}`)
  return new Error(`${status}: ${body.slice(0, 300) || 'Request failed'}`)
}

export async function* streamGroq(opts: GroqChatOptions): AsyncGenerator<string> {
  const res = await fetch(`${resolveBaseUrl(opts.baseUrl)}/chat/completions`, {
    method: 'POST',
    headers: headers(opts.apiKey),
    body: JSON.stringify({
      model: opts.model,
      messages: opts.messages,
      temperature: opts.temperature ?? 0.85,
      max_tokens: opts.maxTokens ?? 2048,
      top_p: opts.topP ?? 1,
      stream: true,
    }),
    signal: opts.signal,
  })

  if (!res.ok || !res.body) {
    throw errorFrom(await res.text().catch(() => ''), res.status)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || !trimmed.startsWith('data:')) continue
      const data = trimmed.slice(5).trim()
      if (data === '[DONE]') return
      try {
        const json = JSON.parse(data)
        const delta: string | undefined = json?.choices?.[0]?.delta?.content
        if (delta) yield delta
      } catch {
        /* partial chunk */
      }
    }
  }
}

export async function chatGroq(opts: GroqChatOptions): Promise<string> {
  const res = await fetch(`${resolveBaseUrl(opts.baseUrl)}/chat/completions`, {
    method: 'POST',
    headers: headers(opts.apiKey),
    body: JSON.stringify({
      model: opts.model,
      messages: opts.messages,
      temperature: opts.temperature ?? 0.4,
      max_tokens: opts.maxTokens ?? 1024,
      stream: false,
    }),
    signal: opts.signal,
  })
  if (!res.ok) throw errorFrom(await res.text().catch(() => ''), res.status)
  const json = await res.json()
  return json?.choices?.[0]?.message?.content?.trim() ?? ''
}

export async function listGroqModels(apiKey: string, baseUrl?: string): Promise<string[]> {
  const res = await fetch(`${resolveBaseUrl(baseUrl)}/models`, {
    headers: headers(apiKey),
  })
  if (!res.ok) throw errorFrom(await res.text().catch(() => ''), res.status)
  const json = await res.json()
  return (json?.data ?? [])
    .map((m: { id: string }) => m.id)
    .filter((id: string) => !NON_CHAT.test(id))
    .sort()
}
