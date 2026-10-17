import { useMemo, useState } from 'react'
import {
  Plus,
  Search,
  Settings as SettingsIcon,
  Pin,
  Trash2,
  MessageSquarePlus,
  Globe2,
  Check,
  Compass,
  X,
  Info,
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { THEMES } from '@/data/themes'
import { providerNeedsKey } from '@/lib/groq'
import { Avatar } from './Avatar'
import { ThemeSwitcher } from './ThemeSwitcher'
import { cn, timeAgo } from '@/lib/utils'

export function Sidebar() {
  const theme = useStore((s) => s.settings.theme)
  const conversations = useStore((s) => s.conversations)
  const characters = useStore((s) => s.characters)
  const worlds = useStore((s) => s.worlds)
  const activeWorldId = useStore((s) => s.activeWorldId)
  const activeConversationId = useStore((s) => s.activeConversationId)
  const sidebarOpen = useStore((s) => s.ui.sidebarOpen)
  const apiKey = useStore((s) => s.settings.apiKey)
  const baseUrl = useStore((s) => s.settings.baseUrl)
  const setUI = useStore((s) => s.setUI)
  const setActiveConversation = useStore((s) => s.setActiveConversation)
  const deleteConversation = useStore((s) => s.deleteConversation)
  const togglePin = useStore((s) => s.togglePin)
  const setActiveWorld = useStore((s) => s.setActiveWorld)

  const [query, setQuery] = useState('')
  const [onlyPinned, setOnlyPinned] = useState(false)
  const [worldPicker, setWorldPicker] = useState(false)
  const ready = apiKey.trim() !== '' || !providerNeedsKey(baseUrl)

  const activeWorld = worlds.find((w) => w.id === activeWorldId)
  const meta = THEMES[theme]

  const items = useMemo(() => {
    const q = query.trim().toLowerCase()
    return conversations
      .filter((c) => c.theme === theme)
      .filter((c) => (theme === 'world' && activeWorldId ? c.worldId === activeWorldId : true))
      .filter((c) => (onlyPinned ? c.pinned : true))
      .filter((c) => {
        if (!q) return true
        const char = characters.find((ch) => ch.id === c.characterId)
        return (
          c.title.toLowerCase().includes(q) ||
          (char?.name.toLowerCase().includes(q) ?? false)
        )
      })
      .sort((a, b) => {
        if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1
        return b.updatedAt - a.updatedAt
      })
  }, [conversations, theme, activeWorldId, query, onlyPinned, characters])

  const openAdd = () => {
    if (theme === 'world') {
      setUI({ worldModal: { tab: worlds.length ? 'cast' : 'world' } })
    } else {
      setUI({ characterModal: { tab: 'create' } })
    }
  }

  return (
    <>
      {sidebarOpen && (
        <button
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setUI({ sidebarOpen: false })}
          aria-label="Close sidebar"
        />
      )}
      <aside
        className={cn(
          'safe-left fixed inset-y-0 left-0 z-40 flex w-[86%] max-w-xs flex-col border-r border-border bg-bg-2/95 backdrop-blur-xl transition-transform duration-300 lg:static lg:z-auto lg:w-72 lg:translate-x-0 lg:bg-transparent lg:backdrop-blur-none',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* brand */}
        <div className="pad-top flex items-center gap-2.5 px-4 pt-4 pb-3">
          <span className="flex size-9 items-center justify-center rounded-[27%] bg-accent-grad text-accent-fg shadow-lg">
            <span className="font-display text-base font-bold">N</span>
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-body leading-none font-bold tracking-tight">
              Nexus
            </h1>
            <p className="mt-0.5 truncate text-2xs text-faint">{meta.tagline}</p>
          </div>
          <button
            className="btn btn-ghost grid size-10 place-items-center rounded-lg p-0 lg:hidden"
            onClick={() => setUI({ sidebarOpen: false })}
            aria-label="Close sidebar"
          >
            <X size={16} />
          </button>
        </div>

        {/* theme */}
        <div className="px-3">
          <ThemeSwitcher />
        </div>

        {/* world selector + add */}
        <div className="mt-3 flex items-center gap-2 px-3">
          <button
            onClick={openAdd}
            className="btn btn-accent flex-1 rounded-2xl py-2.5"
          >
            <Plus size={17} />
            {theme === 'world' ? 'Create world' : 'New character'}
          </button>
          {theme === 'world' && (
            <div className="relative">
              <button
                onClick={() => setWorldPicker((v) => !v)}
                className="btn size-10 rounded-2xl p-0"
                title="Switch world"
              >
                <Globe2 size={17} />
              </button>
              {worldPicker && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setWorldPicker(false)} />
                  <div className="panel anim-pop absolute left-0 z-30 mt-1 w-60 rounded-2xl p-1.5 shadow-2xl">
                    <div className="px-2 py-1.5 text-2xs font-semibold tracking-wide text-faint uppercase">
                      Your worlds
                    </div>
                    {worlds.length === 0 && (
                      <p className="px-2 py-2 text-xs text-faint">No worlds yet.</p>
                    )}
                    {worlds.map((w) => (
                      <button
                        key={w.id}
                        onClick={() => {
                          setActiveWorld(w.id)
                          setWorldPicker(false)
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-2 py-2.5 text-left text-sm hover:bg-surface-2 sm:py-1.5"
                      >
                        <span
                          className="size-2.5 rounded-full"
                          style={{ background: w.color }}
                        />
                        <span className="truncate">{w.name}</span>
                        {w.id === activeWorldId && (
                          <Check size={14} className="ml-auto text-accent" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {theme === 'world' && activeWorld && (
          <div className="mt-2 px-3">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2">
              <Globe2 size={14} className="text-accent" />
              <span className="truncate text-xs font-medium">{activeWorld.name}</span>
              <span className="ml-auto text-2xs text-faint">
                {activeWorld.genre}
              </span>
            </div>
          </div>
        )}

        {/* search */}
        <div className="mt-3 flex items-center gap-2 px-3">
          <div className="relative flex-1">
            <Search
              size={14}
              className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-faint"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search chats…"
              className="field py-1.5 pl-8 text-xs"
            />
          </div>
          <button
            onClick={() => setOnlyPinned((v) => !v)}
            className={cn('btn size-10 shrink-0 rounded-xl p-0 sm:size-9', onlyPinned && 'btn-accent')}
            title="Pinned only"
            aria-label="Show pinned only"
          >
            <Pin size={15} />
          </button>
        </div>

        {/* list */}
        <div className="scroll-thin mt-2 flex-1 space-y-1 overflow-y-auto px-2 pb-2">
          {items.length === 0 && (
            <div className="mt-8 flex flex-col items-center gap-2 px-4 text-center">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-surface text-faint">
                <MessageSquarePlus size={18} />
              </span>
              <p className="text-xs text-muted">
                {theme === 'world' && !activeWorld
                  ? 'Create a world to begin.'
                  : 'No conversations yet. Start one above.'}
              </p>
            </div>
          )}
          {items.map((c) => {
            const char = characters.find((ch) => ch.id === c.characterId)
            const last = [...c.messages].reverse().find((m) => m.role !== 'system')
            const active = c.id === activeConversationId
            return (
              <div
                key={c.id}
                onClick={() => setActiveConversation(c.id)}
                className={cn(
                  'group relative flex cursor-pointer items-center gap-3 rounded-2xl border px-2.5 py-2 transition',
                  active
                    ? 'border-border-strong bg-surface-2'
                    : 'border-transparent hover:bg-surface',
                )}
              >
                <Avatar
                  name={char?.name ?? '?'}
                  avatar={char?.avatar}
                  color={char?.avatarColor}
                  size={38}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {c.pinned && <Pin size={11} className="shrink-0 text-accent" fill="currentColor" />}
                    <span className="truncate text-sm font-medium">
                      {char?.name ?? c.title}
                    </span>
                  </div>
                  <p className="truncate text-2xs text-faint">
                    {last?.content?.replace(/[*_"<>[\]]/g, '').slice(0, 46) ||
                      'No messages yet'}
                  </p>
                </div>
                <span className="shrink-0 text-2xs text-faint opacity-0 transition group-hover:opacity-100">
                  {timeAgo(c.updatedAt)}
                </span>
                <div className="row-actions">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      togglePin(c.id)
                    }}
                    className="bg-bg-2/80 text-faint hover:text-accent"
                    title="Pin"
                    aria-label={c.pinned ? 'Unpin chat' : 'Pin chat'}
                  >
                    <Pin size={12} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteConversation(c.id)
                    }}
                    className="bg-bg-2/80 text-faint hover:text-danger"
                    title="Delete"
                    aria-label="Delete chat"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* footer */}
        <div className="hairline pad-bottom flex items-center gap-2 px-3 py-3">
          <button
            onClick={() => setUI({ settingsOpen: true })}
            className="btn flex-1 justify-start rounded-xl"
          >
            <SettingsIcon size={16} />
            Settings
            <span
              className={cn(
                'ml-auto size-2 rounded-full',
                ready ? 'bg-[#30d158]' : 'bg-[#ff9f0a]',
              )}
              title={ready ? 'AI connected' : 'No API key / provider set'}
            />
          </button>
          <button
            onClick={() => setUI({ welcomeOpen: true })}
            className="btn size-10 shrink-0 rounded-xl p-0 sm:size-9"
            title="Show the tour"
            aria-label="Show the tour"
          >
            <Compass size={16} />
          </button>
          <button
            onClick={() => setUI({ settingsOpen: true, settingsTab: 'themes', rightPanel: 'none' })}
            className="btn size-10 shrink-0 rounded-xl p-0 sm:size-9"
            title="About this theme"
            aria-label="About this theme"
          >
            <Info size={16} />
          </button>
        </div>
      </aside>
    </>
  )
}
