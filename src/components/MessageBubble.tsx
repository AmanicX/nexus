import { useState } from 'react'
import { Check, Copy, RotateCcw, Trash2 } from 'lucide-react'
import type { Character, Message } from '@/types'
import { Avatar } from './Avatar'
import { MarkdownText, RawText } from './RichText'
import { cn, copyText, formatTime } from '@/lib/utils'

interface Props {
  message: Message
  character?: Character
  onDelete?: () => void
  onRegenerate?: () => void
  canRegenerate?: boolean
  streaming?: boolean
}

export function MessageBubble({
  message,
  character,
  onDelete,
  onRegenerate,
  canRegenerate,
  streaming,
}: Props) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'
  const isEmptyStreaming = streaming && !message.content

  const handleCopy = async () => {
    await copyText(isUser ? message.raw ?? message.content : message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }

  if (isUser) {
    return (
      <div className="group anim-rise flex flex-col items-end gap-1">
        <div className="bubble-user max-w-[85%] rounded-3xl rounded-br-lg px-4 py-2.5 text-body leading-relaxed [overflow-wrap:anywhere] sm:max-w-[75%]">
          <RawText text={message.raw ?? message.content} />
        </div>
        {/* Always reachable on touch; hover-revealed only where hover is real. */}
        <div className="flex items-center gap-1 pr-1 opacity-100 transition pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 pointer-fine:group-focus-within:opacity-100 sm:gap-2">
          <span className="px-1 text-2xs text-faint">{formatTime(message.timestamp)}</span>
          {onDelete && (
            <button
              onClick={onDelete}
              className="grid size-9 place-items-center rounded-full text-faint transition hover:text-danger sm:size-7"
              aria-label="Delete message"
              title="Delete message"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="group anim-rise flex items-start gap-3">
      <Avatar
        name={character?.name ?? 'AI'}
        avatar={character?.avatar}
        color={character?.avatarColor}
        size={36}
        className="mt-0.5"
      />
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2 pl-1">
          <span className="text-sm font-semibold text-fg">
            {character?.name ?? 'Assistant'}
          </span>
          {character?.source && (
            <span className="text-2xs text-faint">{character.source}</span>
          )}
        </div>
        <div
          className={cn(
            'bubble-bot inline-block max-w-[92%] rounded-3xl rounded-bl-lg px-4 py-2.5 text-body leading-relaxed [overflow-wrap:anywhere]',
            message.error && 'border border-danger/40 bg-danger/10 text-fg',
          )}
        >
          {isEmptyStreaming ? (
            <span className="caret text-muted">thinking</span>
          ) : (
            <MarkdownText text={message.content} className={streaming ? 'caret' : undefined} />
          )}
        </div>
        <div className="mt-1 flex items-center gap-1 pl-1 opacity-100 transition pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 pointer-fine:group-focus-within:opacity-100 sm:gap-3">
          <span className="px-1 text-2xs text-faint">{formatTime(message.timestamp)}</span>
          <button
            onClick={handleCopy}
            className="grid size-9 place-items-center rounded-full text-faint transition hover:text-fg sm:size-7"
            aria-label="Copy message"
            title="Copy"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
          {canRegenerate && onRegenerate && (
            <button
              onClick={onRegenerate}
              className="grid size-9 place-items-center rounded-full text-faint transition hover:text-fg sm:size-7"
              aria-label="Regenerate reply"
              title="Regenerate"
            >
              <RotateCcw size={14} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="grid size-9 place-items-center rounded-full text-faint transition hover:text-danger sm:size-7"
              aria-label="Delete message"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
