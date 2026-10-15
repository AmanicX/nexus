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
        <div className="flex items-center gap-2 pr-1 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
          <span className="text-2xs text-faint">{formatTime(message.timestamp)}</span>
          {onDelete && (
            <button
              onClick={onDelete}
              className="text-faint transition hover:text-danger"
              title="Delete message"
            >
              <Trash2 size={13} />
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
        <div className="mt-1 flex items-center gap-3 pl-1 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
          <span className="text-2xs text-faint">{formatTime(message.timestamp)}</span>
          <button
            onClick={handleCopy}
            className="text-faint transition hover:text-fg"
            title="Copy"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
          </button>
          {canRegenerate && onRegenerate && (
            <button
              onClick={onRegenerate}
              className="text-faint transition hover:text-fg"
              title="Regenerate"
            >
              <RotateCcw size={13} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="text-faint transition hover:text-danger"
              title="Delete"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
