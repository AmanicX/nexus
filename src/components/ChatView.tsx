import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Brain,
  ChevronLeft,
  Menu,
  MoreVertical,
  Pencil,
  Sparkles,
  Trash2,
  Users,
  Download,
  Eraser,
  X,
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { parseInput } from '@/lib/commands'
import { buildRequestMessages } from '@/lib/prompt'
import { streamGroq, chatGroq } from '@/lib/groq'
import { updateMemory } from '@/lib/memory'
import { extractState } from '@/lib/state'
import { Avatar } from './Avatar'
import { Composer } from './Composer'
import { MessageBubble } from './MessageBubble'
import { RightPanel } from './RightPanel'
import { cn, download, uid } from '@/lib/utils'
import type { Message } from '@/types'

export function ChatView({ onShowCommands }: { onShowCommands: () => void }) {
  const conversation = useStore((s) =>
    s.conversations.find((c) => c.id === s.activeConversationId),
  )
  const character = useStore((s) =>
    s.characters.find((c) => c.id === conversation?.characterId),
  )
  const world = useStore((s) => s.worlds.find((w) => w.id === conversation?.worldId))
  const rightPanel = useStore((s) => s.ui.rightPanel)

  const addMessage = useStore((s) => s.addMessage)
  const updateMessage = useStore((s) => s.updateMessage)
  const removeMessage = useStore((s) => s.removeMessage)
  const setMemory = useStore((s) => s.setMemory)
  const updateWorldState = useStore((s) => s.updateWorldState)
  const setUI = useStore((s) => s.setUI)

  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const streamRef = useRef(false)

  const scrollToBottom = (smooth: boolean) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' })
  }

  useEffect(() => {
    scrollToBottom(!streamRef.current)
  }, [conversation?.messages, conversation?.id])

  useEffect(() => {
    streamRef.current = streaming
  }, [streaming])

  const applyState = (convId: string, update: NonNullable<ReturnType<typeof extractState>['update']>) => {
    const conv = useStore.getState().conversations.find((c) => c.id === convId)
    if (!conv?.worldState) return
    const ws = conv.worldState
    updateWorldState(convId, {
      reputation: { ...ws.reputation, ...(update.reputation ?? {}) },
      events: update.events
        ? [...ws.events, ...update.events].slice(-40)
        : ws.events,
      notes: update.notes ?? ws.notes,
    })
  }

  const runAssistant = async (convId: string) => {
    const state = useStore.getState()
    const conv = state.conversations.find((c) => c.id === convId)
    if (!conv) return
    const char = state.characters.find((c) => c.id === conv.characterId)
    const wld = state.worlds.find((w) => w.id === conv.worldId)

    if (!state.settings.apiKey.trim()) {
      addMessage(convId, {
        id: uid('msg'),
        role: 'assistant',
        content:
          '⚠ No Groq API key set yet. Open **Settings → Connection**, paste your key and save — then send again and I will respond.',
        timestamp: Date.now(),
        error: true,
      })
      setUI({ settingsOpen: true, settingsTab: 'connection' })
      return
    }

    setStreaming(true)
    const controller = new AbortController()
    abortRef.current = controller
    const assistantId = uid('msg')
    addMessage(convId, {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    })

    let acc = ''
    try {
      const messages = buildRequestMessages({
        settings: state.settings,
        character: char!,
        world: wld,
        conversation: conv,
      })
      if (state.settings.streaming) {
        for await (const delta of streamGroq({
          apiKey: state.settings.apiKey,
          model: state.settings.model,
          messages,
          temperature: state.settings.temperature,
          maxTokens: state.settings.maxTokens,
          topP: state.settings.topP,
          signal: controller.signal,
        })) {
          acc += delta
          const { clean } = extractState(acc)
          updateMessage(convId, assistantId, { content: clean })
        }
      } else {
        acc = await chatGroq({
          apiKey: state.settings.apiKey,
          model: state.settings.model,
          messages,
          temperature: state.settings.temperature,
          maxTokens: state.settings.maxTokens,
          signal: controller.signal,
        })
      }
      const { clean, update } = extractState(acc)
      updateMessage(convId, assistantId, { content: clean.trim() || '…' })
      if (update && wld) applyState(convId, update)

      const latest = useStore.getState().conversations.find((c) => c.id === convId)
      if (latest) {
        try {
          const mem = await updateMemory({ settings: state.settings, conversation: latest })
          if (mem) setMemory(convId, mem)
        } catch {
          /* memory is best-effort; never disturb the reply on failure (e.g. rate limit) */
        }
      }
    } catch (err) {
      const aborted = err instanceof DOMException && err.name === 'AbortError'
      const text = aborted
        ? (acc.trim() || '_Stopped._')
        : `⚠ ${err instanceof Error ? err.message : 'Request failed.'}`
      updateMessage(convId, assistantId, { content: text, error: !aborted })
    } finally {
      setStreaming(false)
      abortRef.current = null
    }
  }

  const handleSend = () => {
    if (!input.trim() || streaming || !conversation) return
    const convId = conversation.id
    const parsed = parseInput(input)
    const message: Message = {
      id: uid('msg'),
      role: 'user',
      content: parsed.speech.trim() || input.trim(),
      raw: input.trim(),
      commands: parsed.commands,
      timestamp: Date.now(),
    }
    addMessage(convId, message)

    const worldCmds = parsed.commands.filter((c) => c.type === 'world')
    if (worldCmds.length && useStore.getState().conversations.find((c) => c.id === convId)?.worldState) {
      const conv = useStore.getState().conversations.find((c) => c.id === convId)!
      updateWorldState(convId, {
        events: [...(conv.worldState?.events ?? []), ...worldCmds.map((c) => c.text)].slice(-40),
      })
    }

    setInput('')
    void runAssistant(convId)
  }

  const handleRegenerate = () => {
    if (!conversation || streaming) return
    const msgs = conversation.messages
    const last = msgs[msgs.length - 1]
    if (last?.role === 'assistant') removeMessage(conversation.id, last.id)
    void runAssistant(conversation.id)
  }

  const handleStop = () => {
    abortRef.current?.abort()
  }

  const messages = conversation?.messages ?? []
  const lastAssistantId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') return messages[i].id
    }
    return null
  }, [messages])

  if (!conversation) return null

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col">
      {/* header */}
      <header className="hairline material flex items-center gap-3 px-3 py-2.5 sm:px-4">
        <button
          onClick={() => setUI({ sidebarOpen: true })}
          className="btn btn-ghost size-9 shrink-0 rounded-full p-0 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu size={18} />
        </button>

        <Avatar
          name={character?.name ?? '?'}
          avatar={character?.avatar}
          color={character?.avatarColor}
          size={40}
          ring
        />
        <div className="min-w-0 flex-1">
          {renaming ? (
            <input
              autoFocus
              defaultValue={conversation.title}
              className="field py-1 text-sm"
              onBlur={(e) => {
                useStore.getState().renameConversation(conversation.id, e.target.value.trim() || conversation.title)
                setRenaming(false)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                if (e.key === 'Escape') setRenaming(false)
              }}
            />
          ) : (
            <h1 className="truncate font-display text-body font-semibold">
              {character?.name ?? conversation.title}
            </h1>
          )}
          <p className="truncate text-xs text-muted">
            {character?.tagline || character?.source || 'Ready'}
            {world ? ` · ${world.name}` : ''}
          </p>
        </div>

        <button
          onClick={() => setUI({ rightPanel: rightPanel === 'memory' ? 'none' : 'memory' })}
          className={cn('btn btn-ghost size-9 rounded-full p-0', rightPanel === 'memory' && 'bg-surface-2')}
          title="Memory"
        >
          <Brain size={17} />
        </button>
        {world && (
          <button
            onClick={() => setUI({ rightPanel: rightPanel === 'reputation' ? 'none' : 'reputation' })}
            className={cn('btn btn-ghost size-9 rounded-full p-0', rightPanel === 'reputation' && 'bg-surface-2')}
            title="Reputation"
          >
            <Users size={17} />
          </button>
        )}

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="btn btn-ghost size-9 rounded-full p-0"
            title="More"
          >
            <MoreVertical size={17} />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
              <div className="panel anim-pop absolute right-0 z-30 mt-1 w-52 overflow-hidden rounded-2xl p-1.5 shadow-2xl">
                <MenuItem
                  icon={<Pencil size={15} />}
                  onClick={() => {
                    setRenaming(true)
                    setMenuOpen(false)
                  }}
                >
                  Rename chat
                </MenuItem>
                <MenuItem
                  icon={<Sparkles size={15} />}
                  onClick={() => {
                    onShowCommands()
                    setMenuOpen(false)
                  }}
                >
                  Command help
                </MenuItem>
                <MenuItem
                  icon={<Download size={15} />}
                  onClick={() => {
                    const text = messages
                      .map((m) => `${m.role === 'user' ? 'You' : character?.name}: ${m.content}`)
                      .join('\n\n')
                    download(`${conversation.title}.txt`, text)
                    setMenuOpen(false)
                  }}
                >
                  Export transcript
                </MenuItem>
                <MenuItem
                  icon={<Eraser size={15} />}
                  onClick={() => {
                    useStore.getState().clearConversation(conversation.id)
                    setMenuOpen(false)
                  }}
                >
                  Clear messages
                </MenuItem>
                <div className="my-1 h-px bg-border" />
                <MenuItem
                  danger
                  icon={<Trash2 size={15} />}
                  onClick={() => {
                    useStore.getState().deleteConversation(conversation.id)
                    setMenuOpen(false)
                  }}
                >
                  Delete chat
                </MenuItem>
              </div>
            </>
          )}
        </div>

        <button
          onClick={() => setUI({ sidebarOpen: false })}
          className="btn btn-ghost hidden"
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="scroll-thin flex-1 overflow-y-auto px-3 py-5 sm:px-5">
            <div className="mx-auto flex max-w-3xl flex-col gap-5">
              {messages.length === 0 && (
                <div className="anim-fade mt-10 flex flex-col items-center text-center">
                  <Avatar
                    name={character?.name ?? '?'}
                    avatar={character?.avatar}
                    color={character?.avatarColor}
                    size={72}
                    ring
                    className="anim-floaty mb-4"
                  />
                  <h3 className="font-display text-xl font-semibold">
                    Talk to {character?.name}
                  </h3>
                  <p className="mt-1 max-w-sm text-sm text-muted">
                    {character?.tagline || 'Say something to begin the scene.'}
                  </p>
                  <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs">
                    <span className="chip font-mono">(thoughts)</span>
                    <span className="chip font-mono">"actions"</span>
                    <span className="chip font-mono">&lt;god command&gt;</span>
                    <span className="chip font-mono">[world change]</span>
                  </div>
                </div>
              )}
              {messages.map((m) => (
                <MessageBubble
                  key={m.id}
                  message={m}
                  character={character}
                  streaming={streaming && m.id === messages[messages.length - 1]?.id && m.role === 'assistant'}
                  canRegenerate={m.id === lastAssistantId && !streaming}
                  onRegenerate={handleRegenerate}
                  onDelete={() => removeMessage(conversation.id, m.id)}
                />
              ))}
              <div ref={bottomRef} />
            </div>
          </div>
          <Composer
            value={input}
            onChange={setInput}
            onSend={handleSend}
            onStop={handleStop}
            onShowHelp={onShowCommands}
            streaming={streaming}
            characterName={character?.name}
          />
        </div>

        {rightPanel !== 'none' && (
          <RightPanel
            conversation={conversation}
            world={world}
            onClose={() => setUI({ rightPanel: 'none' })}
            onMemoryChange={(v) => setMemory(conversation.id, v)}
            onReputationChange={(next) => updateWorldState(conversation.id, { reputation: next })}
          />
        )}
      </div>
    </div>
  )
}

function MenuItem({
  children,
  icon,
  onClick,
  danger,
}: {
  children: React.ReactNode
  icon?: React.ReactNode
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-surface-2',
        danger && 'text-danger hover:bg-danger/10',
      )}
    >
      {icon}
      {children}
      <ChevronLeft size={14} className="ml-auto opacity-0" />
    </button>
  )
}
