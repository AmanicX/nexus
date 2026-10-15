import type { GroqModel } from '@/types'

const GROQ_BASE = 'https://api.groq.com/openai/v1'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface GroqChatOptions {
  apiKey: string
  model: string
  messages: ChatMessage[]
  temperature?: number
  maxTokens?: number
  topP?: number
  signal?: AbortSignal
}

export const GROQ_MODELS: GroqModel[] = [
  {
    id: 'openai/gpt-oss-120b',
    label: 'GPT-OSS 120B',
    note: 'Flagship all-rounder · great roleplay & reasoning',
  },
  {
    id: 'openai/gpt-oss-20b',
    label: 'GPT-OSS 20B',
    note: 'Balanced — fast and capable',
  },
  {
    id: 'qwen/qwen3.8-27b',
    label: 'Qwen3 27B',
    note: 'Nuanced, multilingual, expressive',
  },
  {
    id: 'allam-2-7b',
    label: 'Allam 2 7B',
    note: 'Lightweight and quick',
  },
]

const NON_CHAT = /whisper|tts|orpheus|prompt-guard|guard|embed|rerank|vision/i


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
      `Rate limit reached — ${msg || 'Groq caps tokens per minute on your plan. Wait a few seconds, then send again.'}`,
    )
  }
  if (status === 413) {
    return new Error('This conversation is too large for the model. Clear the chat or trim memory, then retry.')
  }
  if (msg) return new Error(`${status}: ${msg}`)
  return new Error(`${status}: ${body.slice(0, 300) || 'Request failed'}`)
}

export async function* streamGroq(opts: GroqChatOptions): AsyncGenerator<string> {
  const res = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${opts.apiKey}`,
    },
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
  const res = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${opts.apiKey}`,
    },
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

export async function listGroqModels(apiKey: string): Promise<string[]> {
  const res = await fetch(`${GROQ_BASE}/models`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  })
  if (!res.ok) throw errorFrom(await res.text().catch(() => ''), res.status)
  const json = await res.json()
  return (json?.data ?? [])
    .map((m: { id: string }) => m.id)
    .filter((id: string) => !NON_CHAT.test(id))
    .sort()
}
