import { useState } from 'react'
import { Plus, X, Brain, Heart } from 'lucide-react'
import type { Conversation, World } from '@/types'
import { cn, clamp } from '@/lib/utils'

interface Props {
  conversation: Conversation
  world?: World
  onClose: () => void
  onMemoryChange: (value: string) => void
  onReputationChange: (next: Record<string, number>) => void
}

function tone(value: number) {
  if (value >= 40) return { label: 'Adored', color: '#34d399' }
  if (value >= 10) return { label: 'Friendly', color: '#6ee7b7' }
  if (value > -10) return { label: 'Neutral', color: '#93b8aa' }
  if (value > -40) return { label: 'Wary', color: '#fbbf24' }
  if (value > -75) return { label: 'Hostile', color: '#fb7185' }
  return { label: 'Hated', color: '#ef4444' }
}

export function RightPanel({
  conversation,
  world,
  onClose,
  onMemoryChange,
  onReputationChange,
}: Props) {
  const [memoryDraft, setMemoryDraft] = useState(conversation.memory)
  const [newNpc, setNewNpc] = useState('')
  const reputation = conversation.worldState?.reputation ?? {}
  const events = conversation.worldState?.events ?? []

  const setRep = (name: string, value: number) =>
    onReputationChange({ ...reputation, [name]: clamp(Math.round(value), -100, 100) })

  return (
    <>
      <button className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={onClose} />
      <aside className="pad-top safe-right fixed inset-y-0 right-0 z-40 flex w-[88%] max-w-sm flex-col border-l border-border bg-bg-2/95 backdrop-blur-xl lg:static lg:z-auto lg:w-80 lg:bg-transparent lg:backdrop-blur-none">
        <div className="hairline flex items-center justify-between px-4 py-3">
          <h3 className="flex items-center gap-2 font-display text-sm font-semibold">
            {conversation.worldId ? <Heart size={15} /> : <Brain size={15} />}
            {conversation.worldId ? 'World state' : 'Memory'}
          </h3>
          <button
            onClick={onClose}
            className="btn btn-ghost grid size-10 shrink-0 place-items-center rounded-lg p-0"
            aria-label="Close panel"
          >
            <X size={16} />
          </button>
        </div>

        <div className="scroll-thin flex-1 space-y-6 overflow-y-auto p-4">
          {world && (
            <section>
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-xs font-semibold tracking-wide text-muted uppercase">
                  Reputation
                </h4>
                <span className="text-2xs text-faint">−100 … +100</span>
              </div>
              <div className="space-y-3">
                {Object.keys(reputation).length === 0 && (
                  <p className="text-xs text-faint">No relationships yet.</p>
                )}
                {Object.entries(reputation)
                  .sort((a, b) => b[1] - a[1])
                  .map(([name, value]) => {
                    const t = tone(value)
                    return (
                      <div key={name} className="rounded-2xl border border-border bg-surface p-3">
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className="truncate text-sm font-medium">{name}</span>
                          <span
                            className="rounded-full px-2 py-0.5 text-2xs font-semibold"
                            style={{ background: `${t.color}22`, color: t.color }}
                          >
                            {t.label} {value > 0 ? `+${value}` : value}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={-100}
                          max={100}
                          value={value}
                          onChange={(e) => setRep(name, Number(e.target.value))}
                          className="w-full accent-[var(--c-accent)]"
                        />
                      </div>
                    )
                  })}
                <div className="flex gap-2">
                  <input
                    value={newNpc}
                    onChange={(e) => setNewNpc(e.target.value)}
                    placeholder="Add a character…"
                    className="field py-1.5 text-xs"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newNpc.trim()) {
                        setRep(newNpc.trim(), 0)
                        setNewNpc('')
                      }
                    }}
                  />
                  <button
                    className="btn grid size-10 shrink-0 place-items-center p-0"
                    onClick={() => {
                      if (newNpc.trim()) {
                        setRep(newNpc.trim(), 0)
                        setNewNpc('')
                      }
                    }}
                    title="Add character"
                    aria-label="Add character"
                  >
                    <Plus size={15} />
                  </button>
                </div>
              </div>

              {events.length > 0 && (
                <div className="mt-5">
                  <h4 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
                    World log
                  </h4>
                  <ul className="space-y-1.5">
                    {[...events].reverse().slice(0, 12).map((e, i) => (
                      <li
                        key={i}
                        className={cn(
                          'rounded-xl border border-border bg-surface px-3 py-2 text-xs text-muted',
                        )}
                      >
                        {e}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          <section>
            <h4 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
              Long-term memory
            </h4>
            <textarea
              value={memoryDraft}
              onChange={(e) => setMemoryDraft(e.target.value)}
              onBlur={() => onMemoryChange(memoryDraft)}
              rows={10}
              placeholder="Facts this conversation should never forget. Auto-fills as you chat — edit freely."
              className="field scroll-thin resize-none text-xs leading-relaxed"
            />
            <p className="mt-1.5 text-2xs text-faint">
              Scoped to this chat only. Other conversations keep their own memory.
            </p>
          </section>
        </div>
      </aside>
    </>
  )
}
