import { useStore } from '@/store/useStore'
import { THEMES, THEME_ORDER } from '@/data/themes'

export function ThemeSwitcher() {
  const theme = useStore((s) => s.settings.theme)
  const setTheme = useStore((s) => s.setTheme)

  return (
    <div className="seg grid w-full grid-cols-3">
      {THEME_ORDER.map((id) => {
        const t = THEMES[id]
        const active = id === theme
        return (
          <button
            key={id}
            data-active={active}
            onClick={() => setTheme(id)}
            className="flex items-center justify-center gap-1.5"
          >
            <span style={active ? { color: 'var(--c-accent)' } : undefined}>{t.icon}</span>
            <span>{t.name}</span>
          </button>
        )
      })}
    </div>
  )
}
