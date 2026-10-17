import { Globe2, Plus, Sparkles, Users } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { THEMES } from '@/data/themes'
import { publicUrl } from '@/lib/utils'
import { Avatar } from './Avatar'
import type { ThemeId } from '@/types'

const BACKDROP: Record<ThemeId, string> = {
  chatbot: publicUrl('backdrops/chatbot.svg'),
  anime: publicUrl('backdrops/anime.svg'),
  world: publicUrl('backdrops/world.svg'),
}

export function EmptyState() {
  const theme = useStore((s) => s.settings.theme)
  const setUI = useStore((s) => s.setUI)
  const characters = useStore((s) => s.characters)
  const worlds = useStore((s) => s.worlds)
  const focus = useStore((s) => s.focusOrCreateConversation)
  const setActiveWorld = useStore((s) => s.setActiveWorld)

  const meta = THEMES[theme]
  const themed = characters.filter((c) => c.theme === theme)

  const openCreate = () => {
    if (theme === 'world') setUI({ worldModal: { tab: worlds.length ? 'cast' : 'world' } })
    else setUI({ characterModal: { tab: 'create' } })
  }

  const openBrowse = () => {
    if (theme === 'world') setUI({ worldModal: { tab: 'cast' } })
    else setUI({ characterModal: { tab: 'browse' } })
  }

  return (
    <div className="scroll-thin relative flex h-full flex-1 items-center justify-center overflow-y-auto p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-[0.16]"
        style={{ backgroundImage: `url(${BACKDROP[theme]})`, filter: 'blur(4px)' }}
      />

      <div className="anim-pop relative w-full max-w-md text-center">
        <div className="mx-auto mb-5 flex size-20 items-center justify-center rounded-[27%] bg-accent-grad text-4xl text-accent-fg shadow-2xl">
          {meta.icon}
        </div>
        <h2 className="font-display text-3xl leading-tight font-bold tracking-tight">
          {meta.name} <span className="text-accent">theme</span>
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
          {meta.blurb}
        </p>

        <ul className="list mx-auto mt-6 max-w-md text-left">
          {meta.features.map((f) => (
            <li key={f} className="list-row text-sm">
              <Sparkles size={16} className="shrink-0 text-accent" />
              {f}
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <button onClick={openCreate} className="btn btn-accent px-5 py-3 sm:py-2.5">
            {theme === 'world' ? <Globe2 size={17} /> : <Plus size={17} />}
            {theme === 'world'
              ? worlds.length
                ? 'New world'
                : 'Create a world'
              : 'Create a character'}
          </button>
          {(themed.length > 0 || (theme === 'world' && worlds.length > 0)) && (
            <button onClick={openBrowse} className="btn px-5 py-3 sm:py-2.5">
              <Users size={16} />
              {theme === 'world' ? 'Browse the cast' : 'Browse existing'}
            </button>
          )}
        </div>

        {theme === 'world' && worlds.length > 0 && (
          <div className="mt-7">
            <p className="mb-2.5 text-2xs font-semibold tracking-wide text-faint uppercase">
              Jump back into a world
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {worlds.map((w) => (
                <button key={w.id} onClick={() => setActiveWorld(w.id)} className="chip">
                  <span className="size-2 rounded-full" style={{ background: w.color }} />
                  {w.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {theme !== 'world' && themed.length > 0 && (
          <div className="mt-7">
            <p className="mb-3 text-2xs font-semibold tracking-wide text-faint uppercase">
              Continue with
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {themed.slice(0, 8).map((c) => (
                <button
                  key={c.id}
                  onClick={() => focus(c.id)}
                  className="group flex w-16 flex-col items-center gap-1.5"
                  title={c.name}
                >
                  <Avatar
                    name={c.name}
                    avatar={c.avatar}
                    color={c.avatarColor}
                    size={52}
                    className="transition duration-300 group-hover:scale-105 group-active:scale-95"
                  />
                  <span className="w-full truncate text-2xs text-muted">{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {theme === 'world' && worlds.length === 0 && (
          <p className="mt-7 text-xs text-faint">
            A world holds many characters. Create one, cast yourself into it, and
            talk to anyone inside.
          </p>
        )}
      </div>
    </div>
  )
}
