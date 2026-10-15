import { Fragment, type ReactNode } from 'react'
import { tokenizeSegments } from '@/lib/commands'
import { cn } from '@/lib/utils'

function inline(text: string, keyBase: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`)/g)
  return parts.map((p, i) => {
    if (!p) return null
    const key = `${keyBase}-${i}`
    if (p.startsWith('**') && p.endsWith('**'))
      return (
        <strong key={key} className="font-semibold text-fg">
          {p.slice(2, -2)}
        </strong>
      )
    if (p.startsWith('`') && p.endsWith('`'))
      return (
        <code key={key} className="rounded bg-black/25 px-1.5 py-0.5 text-[0.85em]">
          {p.slice(1, -1)}
        </code>
      )
    if (p.startsWith('*') && p.endsWith('*'))
      return (
        <span key={key} className="msg-action">
          {p.slice(1, -1)}
        </span>
      )
    return <Fragment key={key}>{p}</Fragment>
  })
}

/** Lightweight markdown renderer for assistant output (bold, *actions*, `code`). */
export function MarkdownText({ text, className }: { text: string; className?: string }) {
  const paragraphs = text.split(/\n{2,}/)
  return (
    <div className={cn('prose-chat', className)}>
      {paragraphs.map((para, pi) => (
        <p key={pi}>
          {para.split('\n').map((line, li, arr) => (
            <Fragment key={li}>
              {inline(line, `${pi}-${li}`)}
              {li < arr.length - 1 && <br />}
            </Fragment>
          ))}
        </p>
      ))}
    </div>
  )
}

const SEGMENT_CLASS: Record<string, string> = {
  text: '',
  thought: 'msg-thought',
  action: 'msg-action',
  'npc-thought': 'msg-thought',
  'npc-action': 'msg-action',
  god: 'msg-god',
  world: 'msg-world',
}

/** Renders the player's raw input, styling inline command syntax in place. */
export function RawText({ text, className }: { text: string; className?: string }) {
  const segments = tokenizeSegments(text)
  return (
    <span className={cn('whitespace-pre-wrap break-words', className)}>
      {segments.map((s, i) => (
        <span key={i} className={SEGMENT_CLASS[s.kind]}>
          {s.raw}
        </span>
      ))}
    </span>
  )
}
