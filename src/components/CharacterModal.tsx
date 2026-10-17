import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  Brush,
  Check,
  Image as ImageIcon,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload,
  UserRound,
  Users,
  X,
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { ANIME_PRESETS, ANIME_SOURCES, avatarFor, presetToCharacter, type AnimePreset } from '@/data/anime'
import { Modal } from './Modal'
import { Avatar } from './Avatar'
import { cn, imageFileToResizedDataURL } from '@/lib/utils'
import type { CharacterMeta } from '@/types'

const EMOJIS = [
  '✦','❀','☾','🌙','⚔️','🔥','❄️','⚡','🌸','🖤','🐉','🦊','👑','🎭','🕊️','🐺',
  '🌊','🍥','⛩️','💫','🌺','🃏','🗡️','🛡️','🎴','🧿','🪷','☯️','🍡','🌌',
]

const SWATCHES = [
  '#7c5cff','#b45cff','#ff6fae','#ff5f9e','#34d399','#0ea5e9','#37d7e8',
  '#ffa34d','#ff8a5c','#f472b6','#a78bfa','#66d0ff','#e0466a','#8fd8a8',
]

type Form = {
  name: string
  avatar: string
  avatarColor: string
  tagline: string
  description: string
  gender: string
  age: string
  tags: string[]
  greeting: string
  canon: 'canon' | 'custom'
  source: string
  overrides: string
  metadata: CharacterMeta[]
}

const blankForm = (): Form => ({
  name: '',
  avatar: '',
  avatarColor: SWATCHES[0],
  tagline: '',
  description: '',
  gender: '',
  age: '',
  tags: [],
  greeting: '',
  canon: 'custom',
  source: '',
  overrides: '',
  metadata: [],
})

export function CharacterModal() {
  const modal = useStore((s) => s.ui.characterModal)
  const theme = useStore((s) => s.settings.theme)
  const activeWorldId = useStore((s) => s.activeWorldId)
  const characters = useStore((s) => s.characters)
  const createCharacter = useStore((s) => s.createCharacter)
  const updateCharacter = useStore((s) => s.updateCharacter)
  const deleteCharacter = useStore((s) => s.deleteCharacter)
  const duplicateCharacter = useStore((s) => s.duplicateCharacter)
  const focus = useStore((s) => s.focusOrCreateConversation)
  const setUI = useStore((s) => s.setUI)

  const open = modal !== null
  const tab = modal?.tab ?? 'create'
  const editId = modal?.editId
  const editing = characters.find((c) => c.id === editId)

  const [form, setForm] = useState<Form>(blankForm)
  const [tagDraft, setTagDraft] = useState('')
  const [query, setQuery] = useState('')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    if (editing) {
      setForm({
        name: editing.name,
        avatar: editing.avatar,
        avatarColor: editing.avatarColor,
        tagline: editing.tagline,
        description: editing.description,
        gender: editing.gender,
        age: editing.age,
        tags: editing.tags,
        greeting: editing.greeting,
        canon: editing.canon,
        source: editing.source,
        overrides: editing.overrides,
        metadata: editing.metadata,
      })
    } else {
      setForm(blankForm())
    }
    setTagDraft('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editId])

  const close = () => setUI({ characterModal: null })
  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }))

  const myCharacters = useMemo(
    () => characters.filter((c) => c.theme === theme),
    [characters, theme],
  )

  const filteredPresets = useMemo(() => {
    const q = query.trim().toLowerCase()
    return ANIME_PRESETS.filter((p) => sourceFilter === 'all' || p.source === sourceFilter).filter(
      (p) =>
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.source.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)),
    )
  }, [query, sourceFilter])

  const filteredMine = useMemo(() => {
    const q = query.trim().toLowerCase()
    return myCharacters.filter(
      (c) => !q || c.name.toLowerCase().includes(q) || c.tags.some((t) => t.includes(q)),
    )
  }, [myCharacters, query])

  const addTag = (raw: string) => {
    const t = raw.trim().replace(/,$/, '')
    if (!t || form.tags.includes(t)) return
    set({ tags: [...form.tags, t] })
    setTagDraft('')
  }

  const addPreset = (p: AnimePreset) => {
    const c = createCharacter({ ...presetToCharacter(p), theme: 'anime' })
    focus(c.id)
    close()
  }

  const save = (startChat: boolean) => {
    if (!form.name.trim()) return
    if (editing) {
      updateCharacter(editing.id, form)
      if (startChat) focus(editing.id)
    } else {
      const c = createCharacter({
        ...form,
        name: form.name.trim(),
        theme,
        worldId: theme === 'world' ? activeWorldId ?? undefined : undefined,
      })
      if (startChat) focus(c.id)
    }
    close()
  }

  const upload = async (file: File) => {
    try {
      const url = await imageFileToResizedDataURL(file)
      set({ avatar: url })
    } catch {
      /* ignore */
    }
  }

  const isCanon = form.canon === 'canon'

  return (
    <Modal
      open={open}
      onClose={close}
      title={editing ? `Edit ${editing.name}` : theme === 'anime' ? 'Anime cast' : 'Characters'}
      subtitle={
        editing
          ? isCanon
            ? 'Your edits layer on top — the canon stays intact.'
            : 'Shape this character however you like.'
          : theme === 'anime'
            ? 'Summon a canon character, or build your own.'
            : 'Invent a character from scratch.'
      }
      icon={<UserRound size={18} />}
      size="lg"
      bodyClassName="p-0"
      footer={
        tab === 'create' ? (
          <>
            {editing && (
              <button
                onClick={() => {
                  if (confirm(`Delete ${editing.name}? Its chats will be removed too.`)) {
                    deleteCharacter(editing.id)
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
              {editing ? 'Save' : 'Save only'}
            </button>
            <button
              onClick={() => save(true)}
              disabled={!form.name.trim()}
              className="btn btn-accent"
            >
              <Sparkles size={15} />
              {editing ? 'Save & chat' : 'Create & chat'}
            </button>
          </>
        ) : undefined
      }
    >
      {/* tabs */}
      <div className="flex items-center gap-1 border-b border-border px-2 pt-1">
        <TabButton active={tab === 'create'} onClick={() => setUI({ characterModal: { tab: 'create', editId } })}>
          <Brush size={15} /> {editing ? 'Edit' : 'Create'}
        </TabButton>
        <TabButton active={tab === 'browse'} onClick={() => setUI({ characterModal: { tab: 'browse' } })}>
          <Users size={15} /> Browse
        </TabButton>
      </div>

      {tab === 'create' ? (
        <div className="space-y-5 p-5">
          {/* identity */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex flex-col items-center gap-2">
              <Avatar
                name={form.name || '?'}
                avatar={form.avatar}
                color={form.avatarColor}
                size={84}
                ring
              />
              <div className="flex gap-1.5">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="btn px-3 py-2.5 text-xs sm:px-2.5 sm:py-1.5"
                >
                  <Upload size={13} /> Image
                </button>
                {form.avatar && (
                  <button
                    onClick={() => set({ avatar: '' })}
                    className="btn px-3 py-2.5 text-xs sm:px-2.5 sm:py-1.5"
                  >
                    <X size={13} /> Clear
                  </button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) void upload(f)
                    e.target.value = ''
                  }}
                />
              </div>
            </div>

            <div className="flex-1 space-y-3">
              <Labelled label="Name">
                <input
                  autoFocus
                  value={form.name}
                  onChange={(e) => set({ name: e.target.value })}
                  placeholder="e.g. Aria Vance"
                  className="field"
                />
              </Labelled>
              <Labelled label="Tagline">
                <input
                  value={form.tagline}
                  onChange={(e) => set({ tagline: e.target.value })}
                  placeholder="A one-line hook"
                  className="field"
                />
              </Labelled>
              <div className="grid grid-cols-2 gap-3">
                <Labelled label="Gender">
                  <input
                    value={form.gender}
                    onChange={(e) => set({ gender: e.target.value })}
                    placeholder="Any"
                    className="field"
                  />
                </Labelled>
                <Labelled label="Age">
                  <input
                    value={form.age}
                    onChange={(e) => set({ age: e.target.value })}
                    placeholder="Any"
                    className="field"
                  />
                </Labelled>
              </div>
            </div>
          </div>

          {/* avatar controls */}
          <Labelled label="Avatar">
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => set({ avatar: '' })}
                className={cn('chip', !form.avatar && 'chip-active')}
                title="Use initials"
              >
                <UserRound size={13} /> Initials
              </button>
              {EMOJIS.slice(0, 18).map((e) => (
                <button
                  key={e}
                  onClick={() => set({ avatar: e })}
                  className={cn(
                    'flex size-10 items-center justify-center rounded-lg border text-base transition sm:size-8',
                    form.avatar === e
                      ? 'border-accent bg-surface-2'
                      : 'border-border bg-surface hover:border-border-strong',
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-2xs text-faint">Colour</span>
              {SWATCHES.map((c) => (
                <button
                  key={c}
                  onClick={() => set({ avatarColor: c })}
                  className={cn(
                    'size-9 rounded-full border-2 transition sm:size-6',
                    form.avatarColor === c ? 'border-fg scale-110' : 'border-transparent',
                  )}
                  style={{ background: c }}
                  aria-label={`Colour ${c}`}
                />
              ))}
              <label className="ml-1 flex items-center gap-1 text-2xs text-faint">
                <ImageIcon size={12} />
                <input
                  type="color"
                  value={form.avatarColor}
                  onChange={(e) => set({ avatarColor: e.target.value })}
                  className="h-6 w-8 cursor-pointer rounded border border-border bg-transparent"
                />
              </label>
            </div>
          </Labelled>

          {/* build / canon */}
          {theme === 'anime' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => set({ canon: isCanon ? 'custom' : 'canon' })}
                className={cn('btn', isCanon && 'btn-accent')}
              >
                {isCanon ? <Check size={15} /> : <Sparkles size={15} />}
                {isCanon ? 'Canon character' : 'Mark as canon'}
              </button>
              {isCanon && (
                <input
                  value={form.source}
                  onChange={(e) => set({ source: e.target.value })}
                  placeholder="From which anime? e.g. Naruto"
                  className="field flex-1"
                />
              )}
            </div>
          )}

          {isCanon ? (
            <>
              <Labelled label="Canon personality" hint="Locked — the original identity is preserved.">
                <div className="field max-h-40 overflow-y-auto text-xs leading-relaxed whitespace-pre-wrap text-muted">
                  {form.description || 'No canon description.'}
                </div>
              </Labelled>
              <Labelled
                label="Your modifications"
                hint="Layered on top of canon. Non-destructive — change a trait, keep the rest."
              >
                <textarea
                  value={form.overrides}
                  onChange={(e) => set({ overrides: e.target.value })}
                  rows={4}
                  placeholder="e.g. Now openly devoted to the user; softened her blunt edge."
                  className="field scroll-thin resize-none text-xs leading-relaxed"
                />
              </Labelled>
            </>
          ) : (
            <Labelled
              label="Personality"
              hint="The core of who they are. Voice, temperament, backstory, quirks."
            >
              <textarea
                value={form.description}
                onChange={(e) => set({ description: e.target.value })}
                rows={6}
                placeholder="Describe their nature, how they speak, what they want…"
                className="field scroll-thin resize-none text-sm leading-relaxed"
              />
            </Labelled>
          )}

          <Labelled label="Tags">
            <div className="field flex flex-wrap items-center gap-1.5 py-1.5">
              {form.tags.map((t) => (
                <span key={t} className="chip">
                  {t}
                  <button onClick={() => set({ tags: form.tags.filter((x) => x !== t) })}>
                    <X size={11} />
                  </button>
                </span>
              ))}
              <input
                value={tagDraft}
                onChange={(e) => {
                  if (e.target.value.endsWith(',')) addTag(e.target.value)
                  else setTagDraft(e.target.value)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag(tagDraft)
                  }
                }}
                placeholder={form.tags.length ? '' : 'ninja, stoic, rival…'}
                className="min-w-24 flex-1 bg-transparent text-sm outline-none"
              />
            </div>
          </Labelled>

          <Labelled label="Opening line" hint="The first message when a chat starts. Optional.">
            <textarea
              value={form.greeting}
              onChange={(e) => set({ greeting: e.target.value })}
              rows={3}
              placeholder='*She looks up.* "Hello there — I was hoping you would come."'
              className="field scroll-thin resize-none text-sm leading-relaxed"
            />
          </Labelled>

          {/* metadata */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-muted">Extra attributes</span>
              <button
                onClick={() =>
                  set({
                    metadata: [
                      ...form.metadata,
                      { id: Math.random().toString(36).slice(2, 8), key: '', value: '' },
                    ],
                  })
                }
                className="btn flex items-center gap-1 px-3 py-2.5 text-xs sm:px-2.5 sm:py-1"
              >
                <Plus size={13} /> Add
              </button>
            </div>
            <div className="space-y-2">
              {form.metadata.map((m, i) => (
                <div key={m.id} className="flex gap-2">
                  <input
                    value={m.key}
                    onChange={(e) =>
                      set({
                        metadata: form.metadata.map((x, j) =>
                          j === i ? { ...x, key: e.target.value } : x,
                        ),
                      })
                    }
                    placeholder="Trait"
                    className="field w-24 shrink-0 py-1.5 text-xs sm:w-32"
                  />
                  <input
                    value={m.value}
                    onChange={(e) =>
                      set({
                        metadata: form.metadata.map((x, j) =>
                          j === i ? { ...x, value: e.target.value } : x,
                        ),
                      })
                    }
                    placeholder="Value"
                    className="field py-1.5 text-xs"
                  />
                  <button
                    onClick={() => set({ metadata: form.metadata.filter((_, j) => j !== i) })}
                    className="btn grid size-10 shrink-0 place-items-center rounded-xl p-0 text-faint hover:text-danger"
                    aria-label="Remove attribute"
                    title="Remove"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Search
                size={14}
                className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-faint"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={theme === 'anime' ? 'Search canon or yours…' : 'Search your characters…'}
                className="field py-2 pl-8 text-sm"
              />
            </div>
          </div>

          {theme === 'anime' && (
            <div className="mb-4 flex flex-wrap gap-1.5">
              <button
                onClick={() => setSourceFilter('all')}
                className={cn('chip', sourceFilter === 'all' && 'chip-active')}
              >
                All sources
              </button>
              {ANIME_SOURCES.map((s) => (
                <button
                  key={s}
                  onClick={() => setSourceFilter(s)}
                  className={cn('chip', sourceFilter === s && 'chip-active')}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* yours */}
          <SectionLabel icon={<Users size={13} />}>Your {theme === 'anime' ? 'custom & added' : ''} cast</SectionLabel>
          {filteredMine.length === 0 ? (
            <p className="mb-5 rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-faint">
              Nothing here yet. Switch to <strong className="text-muted">Create</strong> to make one
              {theme === 'anime' ? ', or add a canon character below.' : '.'}
            </p>
          ) : (
            <div className="mb-6 grid gap-2.5 sm:grid-cols-2">
              {filteredMine.map((c) => (
                <Card
                  key={c.id}
                  avatar={<Avatar name={c.name} avatar={c.avatar} color={c.avatarColor} size={44} />}
                  title={c.name}
                  subtitle={c.tagline || c.source}
                  badge={c.canon === 'canon' ? c.source : undefined}
                  tags={c.tags.slice(0, 3)}
                  actions={
                    <>
                      <button onClick={() => focus(c.id)} className="text-xs font-semibold text-accent hover:underline">
                        Chat
                      </button>
                      <button
                        onClick={() => setUI({ characterModal: { tab: 'create', editId: c.id } })}
                        className="text-xs text-muted hover:text-fg"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => duplicateCharacter(c.id)}
                        className="text-xs text-muted hover:text-fg"
                      >
                        Copy
                      </button>
                    </>
                  }
                />
              ))}
            </div>
          )}

          {/* canon library */}
          {theme === 'anime' && (
            <>
              <SectionLabel icon={<Sparkles size={13} />}>Canon library</SectionLabel>
              {filteredPresets.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-faint">
                  No canon characters match.
                </p>
              ) : (
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {filteredPresets.map((p) => {
                    const existing = characters.find(
                      (c) => c.theme === 'anime' && c.canon === 'canon' && c.name === p.name,
                    )
                    return (
                      <Card
                        key={`${p.source}-${p.name}`}
                        avatar={
                          <Avatar name={p.name} avatar={avatarFor(p.name)} color={p.avatarColor} size={44} />
                        }
                        title={p.name}
                        subtitle={p.tagline}
                        badge={p.source}
                        tags={p.tags.slice(0, 3)}
                        actions={
                          existing ? (
                            <button
                              onClick={() => focus(existing.id)}
                              className="flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
                            >
                              <Check size={12} /> Chat
                            </button>
                          ) : (
                            <button
                              onClick={() => addPreset(p)}
                              className="flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
                            >
                              <Plus size={12} /> Add
                            </button>
                          )
                        }
                      />
                    )
                  })}
                </div>
              )}
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

function Card({
  avatar,
  title,
  subtitle,
  badge,
  tags,
  actions,
}: {
  avatar: ReactNode
  title: string
  subtitle?: string
  badge?: string
  tags?: string[]
  actions: ReactNode
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-3 transition hover:border-border-strong">
      {avatar}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold">{title}</span>
          {badge && (
            <span className="shrink-0 rounded-full border border-border bg-bg px-1.5 py-0.5 text-2xs text-faint">
              {badge}
            </span>
          )}
        </div>
        {subtitle && <p className="mt-0.5 line-clamp-2 text-2xs text-muted">{subtitle}</p>}
        <div className="card-actions mt-1.5 flex items-center gap-2">
          {actions}
          {tags && tags.length > 0 && (
            <span className="ml-auto truncate text-2xs text-faint">{tags.join(' · ')}</span>
          )}
        </div>
      </div>
    </div>
  )
}
