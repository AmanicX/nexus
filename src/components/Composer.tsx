import { useEffect, useRef } from 'react'
import { ArrowUp, HelpCircle, Square, Zap } from 'lucide-react'

interface Props {
  value: string
  onChange: (v: string) => void
  onSend: () => void
  onStop: () => void
  onShowHelp: () => void
  streaming: boolean
  disabled?: boolean
  characterName?: string
}

const SNIPPETS: { label: string; title: string; left: string; right: string }[] = [
  { label: '( )', title: 'Your thoughts', left: '(', right: ')' },
  { label: '" "', title: 'Your actions', left: '"', right: '"' },
  { label: '(: Name)', title: "Another's thoughts", left: '(', right: ': Name)' },
  { label: '"" : Name', title: "Another's actions", left: '"', right: '": Name' },
  { label: '< >', title: 'God command — rewrite reality', left: '<', right: '>' },
  { label: '[ ]', title: 'World command — change the world', left: '[', right: ']' },
]

export function Composer({
  value,
  onChange,
  onSend,
  onStop,
  onShowHelp,
  streaming,
  disabled,
  characterName,
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`
  }, [value])

  const insert = (left: string, right: string) => {
    const el = ref.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const next = value.slice(0, start) + left + value.slice(start, end) + right + value.slice(end)
    onChange(next)
    requestAnimationFrame(() => {
      el.focus()
      const caret = start + left.length
      el.setSelectionRange(caret, caret)
    })
  }

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  return (
    <div className="material hairline-top pad-bottom px-3 pt-2 pb-3 sm:px-5 sm:pb-4">
      <div className="mx-auto max-w-3xl">
        <div className="scrollbar-none mb-2 -mx-3 flex items-center gap-1.5 overflow-x-auto px-3 sm:mx-0 sm:flex-wrap sm:px-0">
          {SNIPPETS.map((s) => (
            <button
              key={s.label}
              onClick={() => insert(s.left, s.right)}
              title={s.title}
              className="chip shrink-0 font-mono text-2xs"
            >
              {s.label}
            </button>
          ))}
          <button
            onClick={onShowHelp}
            title="Command reference"
            className="chip ml-auto shrink-0 gap-1 text-2xs"
          >
            <HelpCircle size={12} /> Commands
          </button>
        </div>

        <div className="flex items-end gap-2">
          <div className="flex min-w-0 flex-1 items-end rounded-[22px] border border-border bg-surface px-4 py-1.5 transition focus-within:border-transparent focus-within:ring-[3.5px] focus-within:ring-accent/25">
            <textarea
              ref={ref}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
              enterKeyHint="send"
              autoCapitalize="sentences"
              autoCorrect="on"
              placeholder={
                characterName
                  ? `Message ${characterName}…  (thoughts) "actions" <god> [world]`
                  : 'Write a message…'
              }
              className="scroll-thin max-h-56 flex-1 resize-none bg-transparent py-2 text-body leading-relaxed text-fg outline-none placeholder:text-faint"
            />
          </div>
          {streaming ? (
            <button
              onClick={onStop}
              className="btn btn-accent size-11 shrink-0 rounded-full p-0 sm:size-9"
              title="Stop generating"
            >
              <Square size={15} fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={onSend}
              disabled={disabled || !value.trim()}
              className="btn btn-accent size-11 shrink-0 rounded-full p-0 sm:size-9"
              title="Send"
            >
              <ArrowUp size={19} strokeWidth={2.6} />
            </button>
          )}
        </div>
        <div className="mt-1.5 flex items-center justify-between px-1.5 text-2xs text-faint">
          <span className="flex items-center gap-1">
            <Zap size={11} /> Enter to send
            <span className="hidden sm:inline">· Shift+Enter for a new line</span>
          </span>
          <span className="hidden font-mono sm:inline">( ) " " (:N) &lt; &gt; [ ]</span>
        </div>
      </div>
    </div>
  )
}
