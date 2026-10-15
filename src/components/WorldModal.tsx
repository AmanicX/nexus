import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Check,
  Globe2,
  MapPin,
  Plus,
  Trash2,
  UserRound,
  Users,
  Pencil,
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { Modal } from './Modal'
import { Avatar } from './Avatar'
import { cn } from '@/lib/utils'
import type { World } from '@/types'

const WORLD_EMOJIS = [
  '🌍','🌌','🏰','⚔️','🌋','🏝️','🌆','🐉','🔮','🏯','🌲','❄️','🔥','⛩️','🗺️','🌠',
]
const SWATCHES = ['#34d399','#0ea5e9','#7c5cff','#b45cff','#f472b6','#ff8a5c','#facc15','#e0466a']
const GENRES = [
  'Fantasy','Isekai','Sci-Fi','Cyberpunk','School','Wuxia','Supernatural',
  'Post-Apocalyptic','Slice of Life','Horror','Historical',
]

type Form = Omit<World, 'id' | 'createdAt'>

const blankForm = (): Form => ({
  name: '',
  genre: '',
  description: '',
  rules: '',
  playerName: '',
  playerRole: '',
  playerAppearance: '',
  avatar: '🌍',
  avatarColor: SWATCHES[0],
  locations: '',
  factions: '',
  lore: '',
  color: SWATCHES[0],
})

export function WorldModal() {
  const modal = useStore((s) => s.ui.worldModal)
  const worlds = useStore((s) => s.worlds)
  const characters = useStore((s) => s.characters)
  const activeWorldId = useStore((s) => s.activeWorldId)
  const createWorld = useStore((s) => s.createWorld)
  const updateWorld = useStore((s) => s.updateWorld)
  const deleteWorld = useStore((s) => s.deleteWorld)
  const setActiveWorld = useStore((s) => s.setActiveWorld)
  const focus = useStore((s) => s.focusOrCreateConversation)
  const deleteCharacter = useStore((s) => s.deleteCharacter)
  const setUI = useStore((s) => s.setUI)

  const open = modal !== null
  const tab = modal?.tab ?? 'world'
  const editId = modal?.editId
  const editing = worlds.find((w) => w.id === editId)
  const activeWorld = worlds.find((w) => w.id === activeWorldId)

  const [form, setForm] = useState<Form>(blankForm)

  useEffect(() => {
    if (!open) return
    if (editing) {
      setForm({
        name: editing.name,
        genre: editing.genre,
        description: editing.description,
        rules: editing.rules,
        playerName: editing.playerName,
        playerRole: editing.playerRole,
        playerAppearance: editing.playerAppearance,
        avatar: editing.avatar,
        avatarColor: editing.avatarColor,
        locations: editing.locations,
        factions: editing.factions,
        lore: editing.lore,
        color: editing.color,
      })
    } else {
      setForm(blankForm())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editId, tab])

  const close = () => setUI({ worldModal: null })
  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }))

  const cast = useMemo(
    () => characters.filter((c) => c.worldId === activeWorldId),
    [characters, activeWorldId],
  )

  const save = (goCast: boolean) => {
    if (!form.name.trim()) return
    if (editing) {
      updateWorld(editing.id, form)
      setActiveWorld(editing.id)
    } else {
      createWorld({ ...form, name: form.name.trim() })
    }
    if (goCast) setUI({ worldModal: { tab: 'cast' } })
    else close()
  }

  const openCharacter = (editId?: string) =>
    setUI({ worldModal: null, characterModal: { tab: 'create', editId } })

  return (
    <Modal
      open={open}
      onClose={close}
      title={editing ? `Edit ${editing.name}` : 'World builder'}
      subtitle={
        editing
          ? 'Shape the setting, its rules and your role inside it.'
          : 'Build a setting, then cast characters to inhabit it.'
      }
      icon={<Globe2 size={18} />}
      size="lg"
      bodyClassName="p-0"
      footer={
        tab === 'world' ? (
          <>
            {editing && (
              <button
                onClick={() => {
                  if (confirm(`Delete ${editing.name}? Its cast and chats will be removed.`)) {
                    deleteWorld(editing.id)
                    close()
                  }
                }}
                className="btn mr-auto border-danger/40 text-danger hover:bg-danger/10"
              >
                <Trash2 size={15} /> Delete
              </button>
            )}
            <button onClick={close} className="btn">
              Cancel
            </button>
            <button onClick={() => save(false)} disabled={!form.name.trim()} className="btn">
              {editing ? 'Save' : 'Save world'}
            </button>
            <button
              onClick={() => save(true)}
              disabled={!form.name.trim()}
              className="btn btn-accent"
            >
              <Users size={15} />
              Save & add cast
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setUI({ worldModal: { tab: 'world' } })} className="btn mr-auto">
              <Pencil size={15} /> Edit world
            </button>
            <button onClick={close} className="btn">
              Done
            </button>
            <button
              onClick={() => openCharacter()}
              disabled={!activeWorld}
              className="btn btn-accent"
            >
              <Plus size={15} /> Add character
            </button>
          </>
        )
      }
    >
      <div className="flex items-center gap-1 border-b border-border px-2 pt-1">
        <TabButton active={tab === 'world'} onClick={() => setUI({ worldModal: { tab: 'world', editId } })}>
          <Globe2 size={15} /> World
        </TabButton>
        <TabButton active={tab === 'cast'} onClick={() => setUI({ worldModal: { tab: 'cast' } })}>
          <Users size={15} /> Cast
        </TabButton>
      </div>

      {tab === 'world' ? (
        <div className="space-y-5 p-5">
          {/* world switcher */}
          {worlds.length > 0 && (
            <div>
              <SectionLabel icon={<Globe2 size={13} />}>Your worlds</SectionLabel>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setUI({ worldModal: { tab: 'world' } })}
                  className={cn('chip', !editing && 'chip-active')}
                >
                  <Plus size={12} /> New
                </button>
                {worlds.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => setUI({ worldModal: { tab: 'world', editId: w.id } })}
                    className={cn('chip', editId === w.id && 'chip-active')}
                  >
                    <span className="size-2 rounded-full" style={{ background: w.color }} />
                    {w.name}
                    {w.id === activeWorldId && (
                      <Check size={11} className="text-accent" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* identity */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex flex-col items-center gap-2">
              <span
                className="flex size-20 items-center justify-center rounded-4xl text-4xl shadow-lg"
                style={{
                  background: `linear-gradient(140deg, ${form.color}, color-mix(in oklab, ${form.color} 45%, #000))`,
                }}
              >
                {form.avatar}
              </span>
              <div className="flex flex-wrap justify-center gap-1">
                {WORLD_EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => set({ avatar: e })}
                    className={cn(
                      'flex size-7 items-center justify-center rounded-lg border text-sm transition',
                      form.avatar === e
                        ? 'border-accent bg-surface-2'
                        : 'border-border bg-surface hover:border-border-strong',
                    )}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 space-y-3">
              <Labelled label="World name">
                <input
                  autoFocus
                  value={form.name}
                  onChange={(e) => set({ name: e.target.value })}
                  placeholder="e.g. The Ashen Covenant"
                  className="field"
                />
              </Labelled>
              <Labelled label="Genre">
                <input
                  value={form.genre}
                  onChange={(e) => set({ genre: e.target.value })}
                  placeholder="Fantasy, Isekai…"
                  className="field"
                />
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {GENRES.map((g) => (
                    <button
                      key={g}
                      onClick={() => set({ genre: g })}
                      className={cn('chip', form.genre === g && 'chip-active')}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </Labelled>
              <Labelled label="Accent colour">
                <div className="flex flex-wrap items-center gap-1.5">
                  {SWATCHES.map((c) => (
                    <button
                      key={c}
                      onClick={() => set({ color: c, avatarColor: c })}
                      className={cn(
                        'size-6 rounded-full border-2 transition',
                        form.color === c ? 'border-fg scale-110' : 'border-transparent',
                      )}
                      style={{ background: c }}
                    />
                  ))}
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) => set({ color: e.target.value, avatarColor: e.target.value })}
                    className="h-6 w-8 cursor-pointer rounded border border-border bg-transparent"
                  />
                </div>
              </Labelled>
            </div>
          </div>

          <Labelled label="Premise" hint="What kind of world this is and what is happening in it.">
            <textarea
              value={form.description}
              onChange={(e) => set({ description: e.target.value })}
              rows={4}
              placeholder="A dying empire, a fracturing realm, a school on the edge of two worlds…"
              className="field scroll-thin resize-none text-sm leading-relaxed"
            />
          </Labelled>

          <Labelled label="Laws & rules" hint="How this world works — magic, technology, hard limits.">
            <textarea
              value={form.rules}
              onChange={(e) => set({ rules: e.target.value })}
              rows={3}
              placeholder="Rules the story must obey."
              className="field scroll-thin resize-none text-sm leading-relaxed"
            />
          </Labelled>

          <div className="grid gap-4 sm:grid-cols-2">
            <Labelled label="Key locations">
              <textarea
                value={form.locations}
                onChange={(e) => set({ locations: e.target.value })}
                rows={3}
                placeholder="Capital, academy, ruins…"
                className="field scroll-thin resize-none text-sm leading-relaxed"
              />
            </Labelled>
            <Labelled label="Factions & powers">
              <textarea
                value={form.factions}
                onChange={(e) => set({ factions: e.target.value })}
                rows={3}
                placeholder="Kingdoms, guilds, clans…"
                className="field scroll-thin resize-none text-sm leading-relaxed"
              />
            </Labelled>
          </div>

          <Labelled label="Deep lore" hint="History, secrets, gods, anything else that matters.">
            <textarea
              value={form.lore}
              onChange={(e) => set({ lore: e.target.value })}
              rows={3}
              placeholder="Optional. The world's buried truths."
              className="field scroll-thin resize-none text-sm leading-relaxed"
            />
          </Labelled>

          {/* player */}
          <div className="rounded-2xl border border-border bg-surface p-4">
            <SectionLabel icon={<UserRound size={13} />}>You in this world</SectionLabel>
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Labelled label="Your name">
                  <input
                    value={form.playerName}
                    onChange={(e) => set({ playerName: e.target.value })}
                    placeholder="Who you are here"
                    className="field"
                  />
                </Labelled>
                <Labelled label="Your role">
                  <input
                    value={form.playerRole}
                    onChange={(e) => set({ playerRole: e.target.value })}
                    placeholder="Knight, student, outlander…"
                    className="field"
                  />
                </Labelled>
              </div>
              <Labelled label="Your appearance & nature">
                <textarea
                  value={form.playerAppearance}
                  onChange={(e) => set({ playerAppearance: e.target.value })}
                  rows={2}
                  placeholder="How you look and what you are."
                  className="field scroll-thin resize-none text-sm leading-relaxed"
                />
              </Labelled>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-5">
          {!activeWorld ? (
            <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center">
              <Globe2 size={26} className="mx-auto mb-2 text-faint" />
              <p className="text-sm text-muted">
                No world selected. Create one in the <strong className="text-fg">World</strong> tab
                first.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center gap-2 rounded-2xl border border-border bg-surface px-3.5 py-2.5">
                <span
                  className="flex size-8 items-center justify-center rounded-xl text-lg"
                  style={{ background: `color-mix(in oklab, ${activeWorld.color} 30%, transparent)` }}
                >
                  {activeWorld.avatar}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{activeWorld.name}</div>
                  <div className="truncate text-2xs text-faint">
                    {activeWorld.genre || 'Unclassified'} · {cast.length} character
                    {cast.length === 1 ? '' : 's'}
                  </div>
                </div>
                <button
                  onClick={() => openCharacter()}
                  className="btn btn-accent px-3 py-1.5 text-xs"
                >
                  <Plus size={14} /> Add
                </button>
              </div>

              {cast.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center">
                  <Users size={26} className="mx-auto mb-2 text-faint" />
                  <p className="text-sm text-muted">
                    This world is empty. Add characters for the player to meet.
                  </p>
                  <button
                    onClick={() => openCharacter()}
                    className="btn btn-accent mx-auto mt-4"
                  >
                    <Plus size={15} /> Add first character
                  </button>
                </div>
              ) : (
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {cast.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-3 transition hover:border-border-strong"
                    >
                      <Avatar name={c.name} avatar={c.avatar} color={c.avatarColor} size={44} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{c.name}</div>
                        <p className="mt-0.5 line-clamp-2 text-2xs text-muted">
                          {c.tagline || c.description.slice(0, 70)}
                        </p>
                        <div className="mt-1.5 flex items-center gap-3">
                          <button
                            onClick={() => focus(c.id, activeWorld.id)}
                            className="text-xs font-semibold text-accent hover:underline"
                          >
                            Chat
                          </button>
                          <button
                            onClick={() => openCharacter(c.id)}
                            className="text-xs text-muted hover:text-fg"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Remove ${c.name} from the cast?`)) deleteCharacter(c.id)
                            }}
                            className="ml-auto text-xs text-faint hover:text-danger"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-5 flex items-center gap-2 rounded-2xl border border-border bg-surface px-3.5 py-3 text-2xs text-faint">
                <MapPin size={13} className="shrink-0" />
                Characters live only inside this world. Their reputations grow as you play.
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex items-center gap-2 px-3.5 py-2.5 text-sm font-semibold transition',
        active ? 'text-fg' : 'text-muted hover:text-fg',
      )}
    >
      {children}
      {active && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent" />}
    </button>
  )
}

function Labelled({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline gap-2">
        <span className="text-xs font-medium text-muted">{label}</span>
        {hint && <span className="text-2xs text-faint">{hint}</span>}
      </span>
      {children}
    </label>
  )
}

function SectionLabel({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <h4 className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-faint uppercase">
      {icon}
      {children}
    </h4>
  )
}
