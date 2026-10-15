import { COMMAND_HELP } from '@/lib/commands'
import { cn } from '@/lib/utils'

const TONE: Record<string, string> = {
  '( … )': 'var(--c-muted)',
  '" … "': 'var(--c-accent)',
  '( … : Name )': 'var(--c-accent-2)',
  '" … " : Name': 'var(--c-accent-2)',
  '< … >': 'var(--c-accent-2)',
  '[ … ]': 'var(--c-accent)',
}

export function CommandCheatsheet({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-2.5', className)}>
      {COMMAND_HELP.map((c) => (
        <div
          key={c.syntax}
          className="rounded-2xl border border-border bg-surface p-3.5"
        >
          <div className="flex flex-wrap items-center gap-2">
            <code
              className="rounded-lg border border-border bg-bg px-2.5 py-1 font-mono text-sm font-semibold"
              style={{ color: TONE[c.syntax] }}
            >
              {c.syntax}
            </code>
            <span className="text-sm font-semibold">{c.name}</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {c.description}
          </p>
          <p className="mt-1.5 font-mono text-2xs text-faint">
            e.g. <span className="text-faint/80">{c.example}</span>
          </p>
        </div>
      ))}
    </div>
  )
}
