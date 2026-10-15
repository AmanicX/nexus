import type { ParsedCommand, ParsedInput } from '@/types'

/**
 * Parses the user's rich input syntax:
 *   (...content...)            -> user's inner thought
 *   "...content..."            -> user's physical action
 *   (...: Name)                -> Name's inner thought
 *   "..." : Name               -> Name's physical action
 *   <...>                      -> GOD command (rewrite reality / opinions)
 *   [...]                      -> WORLD command (change the world state)
 */
export function parseInput(input: string): ParsedInput {
  const commands: ParsedCommand[] = []
  const speech: string[] = []
  let buffer = ''
  let i = 0
  const n = input.length

  const flush = () => {
    if (buffer.trim()) speech.push(buffer.trim())
    buffer = ''
  }

  while (i < n) {
    const ch = input[i]

    if (ch === '<') {
      const end = input.indexOf('>', i + 1)
      if (end !== -1) {
        flush()
        commands.push({
          type: 'god',
          text: input.slice(i + 1, end).trim(),
          raw: input.slice(i, end + 1),
        })
        i = end + 1
        continue
      }
    }

    if (ch === '[') {
      const end = input.indexOf(']', i + 1)
      if (end !== -1) {
        flush()
        commands.push({
          type: 'world',
          text: input.slice(i + 1, end).trim(),
          raw: input.slice(i, end + 1),
        })
        i = end + 1
        continue
      }
    }

    if (ch === '(') {
      const end = input.indexOf(')', i + 1)
      if (end !== -1) {
        flush()
        const inner = input.slice(i + 1, end)
        const { text, name } = splitName(inner)
        commands.push(
          name
            ? { type: 'npc-thought', text, name, raw: input.slice(i, end + 1) }
            : { type: 'thought', text: inner.trim(), raw: input.slice(i, end + 1) },
        )
        i = end + 1
        continue
      }
    }

    if (ch === '"') {
      const end = input.indexOf('"', i + 1)
      if (end !== -1) {
        flush()
        let text = input.slice(i + 1, end).trim()
        let name: string | undefined
        let consumed = end + 1
        // trailing form:  "text": Name
        const trailing = input.slice(end + 1).match(/^\s*:\s*([^\n,.;!?]{1,60})/)
        if (trailing) {
          name = trailing[1].trim()
          consumed = end + 1 + trailing[0].length
        } else {
          // internal form:  "text: Name"
          const parts = splitName(text)
          if (parts.name) {
            text = parts.text
            name = parts.name
          }
        }
        commands.push(
          name
            ? { type: 'npc-action', text, name, raw: input.slice(i, consumed) }
            : { type: 'action', text, raw: input.slice(i, consumed) },
        )
        i = consumed
        continue
      }
    }

    buffer += ch
    i++
  }

  flush()
  return { speech: speech.join(' ').trim(), commands }
}

export interface Segment {
  kind: 'text' | ParsedCommand['type']
  text: string
  name?: string
  raw: string
}

/**
 * Splits raw input into ordered, typed segments so the UI can style inline
 * commands (thoughts, actions, god & world commands) while keeping order.
 */
export function tokenizeSegments(input: string): Segment[] {
  const segments: Segment[] = []
  let buffer = ''
  let i = 0
  const n = input.length

  const flush = () => {
    if (buffer) {
      segments.push({ kind: 'text', text: buffer, raw: buffer })
      buffer = ''
    }
  }

  while (i < n) {
    const ch = input[i]

    if (ch === '<') {
      const end = input.indexOf('>', i + 1)
      if (end !== -1) {
        flush()
        segments.push({
          kind: 'god',
          text: input.slice(i + 1, end).trim(),
          raw: input.slice(i, end + 1),
        })
        i = end + 1
        continue
      }
    }
    if (ch === '[') {
      const end = input.indexOf(']', i + 1)
      if (end !== -1) {
        flush()
        segments.push({
          kind: 'world',
          text: input.slice(i + 1, end).trim(),
          raw: input.slice(i, end + 1),
        })
        i = end + 1
        continue
      }
    }
    if (ch === '(') {
      const end = input.indexOf(')', i + 1)
      if (end !== -1) {
        flush()
        const { text, name } = splitName(input.slice(i + 1, end))
        segments.push({
          kind: name ? 'npc-thought' : 'thought',
          text,
          name,
          raw: input.slice(i, end + 1),
        })
        i = end + 1
        continue
      }
    }
    if (ch === '"') {
      const end = input.indexOf('"', i + 1)
      if (end !== -1) {
        flush()
        let text = input.slice(i + 1, end).trim()
        let name: string | undefined
        let consumed = end + 1
        const trailing = input.slice(end + 1).match(/^\s*:\s*([^\n,.;!?]{1,60})/)
        if (trailing) {
          name = trailing[1].trim()
          consumed = end + 1 + trailing[0].length
        } else {
          const parts = splitName(text)
          if (parts.name) {
            text = parts.text
            name = parts.name
          }
        }
        segments.push({
          kind: name ? 'npc-action' : 'action',
          text,
          name,
          raw: input.slice(i, consumed),
        })
        i = consumed
        continue
      }
    }

    buffer += ch
    i++
  }
  flush()
  return segments
}

function splitName(inner: string): { text: string; name?: string } {
  const idx = inner.lastIndexOf(':')
  if (idx === -1) return { text: inner.trim() }
  const candidate = inner
    .slice(idx + 1)
    .trim()
    .replace(/[.!?]+$/, '')
  const text = inner.slice(0, idx).trim()
  const words = candidate.split(/\s+/)
  const looksLikeName =
    candidate.length > 0 &&
    words.length <= 5 &&
    /^[\p{L}0-9'’.\- ]+$/u.test(candidate) &&
    !/[.!?,;]/.test(candidate)
  if (text && looksLikeName) return { text, name: candidate }
  return { text: inner.trim() }
}

export function renderCommandForModel(c: ParsedCommand): string {
  switch (c.type) {
    case 'thought':
      return `({{user}}'s inner thought — not spoken aloud): ${c.text}`
    case 'action':
      return `({{user}}'s action): *${c.text}*`
    case 'npc-thought':
      return `(${c.name}'s inner thought — not spoken aloud): ${c.text}`
    case 'npc-action':
      return `(${c.name}'s action): *${c.text}*`
    case 'god':
      return `GOD COMMAND — this immediately and permanently overrides any prior fact, memory, or opinion, no matter how established: "${c.text}". It is now true.`
    case 'world':
      return `WORLD COMMAND — this is now true of the world itself; weave it into the scene and treat it as canon: "${c.text}".`
  }
}

const LABELS: Record<ParsedCommand['type'], string> = {
  thought: 'Your thought',
  action: 'Your action',
  'npc-thought': 'Inner thought',
  'npc-action': 'Action',
  god: 'God command',
  world: 'World command',
}

export function commandLabel(c: ParsedCommand) {
  return c.type.startsWith('npc') && c.name ? `${c.name} · ${LABELS[c.type]}` : LABELS[c.type]
}

export const COMMAND_HELP: {
  syntax: string
  name: string
  description: string
  example: string
}[] = [
  {
    syntax: '( … )',
    name: 'Your thoughts',
    description: 'Inner monologue. The character perceives intent but you did not say it aloud.',
    example: '(I should not trust him yet)',
  },
  {
    syntax: '" … "',
    name: 'Your actions',
    description: 'A physical action you perform in the scene.',
    example: '"I slam the door behind me"',
  },
  {
    syntax: '( … : Name )',
    name: "Another's thoughts",
    description: "Directs a character's private inner thoughts.",
    example: '(She wonders if I am lying : Rias)',
  },
  {
    syntax: '" … " : Name',
    name: "Another's actions",
    description: "Directs a character's physical action.",
    example: '"she draws her blade" : Hinata',
  },
  {
    syntax: '< … >',
    name: 'God command',
    description:
      'Overrides reality. Rewrites opinions, facts, and feelings permanently — even if they were firmly established.',
    example: '<Sasuke no longer hates me and deeply trusts me>',
  },
  {
    syntax: '[ … ]',
    name: 'World command',
    description:
      'Changes the world itself: weather, events, factions, location, what is happening right now.',
    example: '[The village is attacked at dawn]',
  },
]
