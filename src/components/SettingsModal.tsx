import { useRef, useState } from 'react'
import {
  AlertCircle,
  Check,
  Cpu,
  Database,
  Download,
  Eye,
  EyeOff,
  KeyRound,
  Palette,
  RefreshCw,
  Search,
  Sparkles,
  Terminal,
  Trash2,
  Upload,
  User,
  Zap,
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import {
  GROQ_MODELS,
  PROVIDER_PRESETS,
  DEFAULT_BASE_URL,
  listGroqModels,
  providerNeedsKey,
  presetIdFor,
  suggestionsFor,
} from '@/lib/groq'
import { THEMES, THEME_ORDER } from '@/data/themes'
import { Modal } from './Modal'
import { CommandCheatsheet } from './CommandCheatsheet'
import { cn, clamp, download } from '@/lib/utils'
import type { UIState } from '@/store/useStore'

const TABS: { id: UIState['settingsTab']; label: string; icon: React.ReactNode }[] = [
  { id: 'connection', label: 'Connection', icon: <KeyRound size={16} /> },
  { id: 'persona', label: 'Persona', icon: <User size={16} /> },
  { id: 'themes', label: 'Themes', icon: <Palette size={16} /> },
  { id: 'commands', label: 'Commands', icon: <Terminal size={16} /> },
  { id: 'data', label: 'Data', icon: <Database size={16} /> },
]

export function SettingsModal() {
  const settings = useStore((s) => s.settings)
  const ui = useStore((s) => s.ui)
  const updateSettings = useStore((s) => s.updateSettings)
  const setUI = useStore((s) => s.setUI)
  const setTheme = useStore((s) => s.setTheme)
  const characters = useStore((s) => s.characters)
  const conversations = useStore((s) => s.conversations)
  const worlds = useStore((s) => s.worlds)
  const replaceAll = useStore((s) => s.replaceAll)

  const open = ui.settingsOpen
  const tab = ui.settingsTab
  const [showKey, setShowKey] = useState(false)
  const [testState, setTestState] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle')
  const [testMsg, setTestMsg] = useState('')
  const [modelFilter, setModelFilter] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const needsKey = providerNeedsKey(settings.baseUrl)
  const activePreset = PROVIDER_PRESETS.find((p) => p.baseUrl === settings.baseUrl.trim())
  const presetId = presetIdFor(settings.baseUrl)
  const curated = GROQ_MODELS.find((m) => m.id === settings.model)

  const modelOptions = Array.from(
    new Set([
      ...suggestionsFor(settings.baseUrl),
      ...settings.cachedModels,
      ...GROQ_MODELS.map((m) => m.id),
      settings.model,
    ]),
  ).filter(Boolean)
  const shownModels = modelOptions.filter((m) =>
    m.toLowerCase().includes(modelFilter.trim().toLowerCase()),
  )

  const testConnection = async () => {
    if (needsKey && !settings.apiKey.trim()) {
      setTestState('fail')
      setTestMsg('Add an API key first.')
      return
    }
    setTestState('testing')
    setTestMsg('')
    try {
      const list = await listGroqModels(settings.apiKey, settings.baseUrl)
      updateSettings({ cachedModels: list })
      setTestState('ok')
      setTestMsg(`Connected · ${list.length} models available`)
    } catch (e) {
      setTestState('fail')
      setTestMsg(e instanceof Error ? e.message : 'Connection failed')
    }
  }

  const exportData = () => {
    download(
      `nexus-backup-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify({ settings, characters, worlds, conversations }, null, 2),
    )
  }

  const importData = async (file: File) => {
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      replaceAll(parsed)
    } catch {
      alert('Could not read that backup file.')
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => setUI({ settingsOpen: false })}
      title="Settings"
      subtitle="Configure your studio"
      icon={<Zap size={18} />}
      size="lg"
      bodyClassName="p-0"
    >
      <div className="flex min-h-[58dvh] flex-col sm:flex-row">
        {/* nav */}
        <nav className="scrollbar-none flex gap-1 overflow-x-auto border-b border-border p-2 sm:w-44 sm:shrink-0 sm:flex-col sm:overflow-visible sm:border-r sm:border-b-0 sm:p-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setUI({ settingsTab: t.id })}
              className={cn(
                'flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-3 text-sm font-medium whitespace-nowrap transition sm:py-2',
                tab === t.id
                  ? 'bg-surface-2 text-fg'
                  : 'text-muted hover:bg-surface hover:text-fg',
              )}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>

        {/* body */}
        <div className="scroll-thin max-h-[62dvh] flex-1 overflow-y-auto p-5">
          {tab === 'connection' && (
            <div className="space-y-5">
              <Section
                title="Provider"
                hint="Any OpenAI-compatible API works — pick a preset or paste your own Base URL."
              >
                <div className="flex flex-wrap gap-1.5">
                  {PROVIDER_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => updateSettings({ baseUrl: p.baseUrl })}
                      className={cn('chip', settings.baseUrl.trim() === p.baseUrl && 'chip-active')}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={settings.baseUrl}
                  onChange={(e) => updateSettings({ baseUrl: e.target.value })}
                  placeholder={DEFAULT_BASE_URL}
                  className="field font-mono text-xs"
                  spellCheck={false}
                />
                <p className="text-2xs text-faint">
                  Groq, OpenRouter, LM Studio, Ollama, or your own server. For truly uncensored
                  role-play, point this at an unfiltered model.
                </p>
              </Section>

              <Section
                title={needsKey ? 'API key' : 'API key (optional)'}
                hint={
                  needsKey
                    ? 'Stored only on this device. Sent only to the provider above.'
                    : 'Local servers usually ignore the key — leave it blank.'
                }
              >
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={settings.apiKey}
                      onChange={(e) => updateSettings({ apiKey: e.target.value })}
                      placeholder={activePreset?.keyHint ?? 'your key'}
                      className="field pr-12 font-mono text-xs sm:pr-9"
                      spellCheck={false}
                    />
                    <button
                      onClick={() => setShowKey((v) => !v)}
                      className="absolute top-1/2 right-0.5 grid size-11 -translate-y-1/2 place-items-center rounded-lg text-faint hover:text-fg sm:right-2 sm:size-8"
                      aria-label={showKey ? 'Hide API key' : 'Show API key'}
                      title={showKey ? 'Hide key' : 'Show key'}
                    >
                      {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  <button
                    onClick={testConnection}
                    className="btn shrink-0"
                    disabled={testState === 'testing'}
                  >
                    {testState === 'testing' ? (
                      <RefreshCw size={15} className="animate-spin" />
                    ) : (
                      <Zap size={15} />
                    )}
                    Test
                  </button>
                </div>
                {testState !== 'idle' && (
                  <p
                    className={cn(
                      'flex items-center gap-1.5 text-xs',
                      testState === 'ok' ? 'text-[#30d158]' : testState === 'fail' ? 'text-danger' : 'text-muted',
                    )}
                  >
                    {testState === 'ok' ? <Check size={13} /> : <AlertCircle size={13} />}
                    {testMsg || 'Testing…'}
                  </p>
                )}
                <p className="text-2xs text-faint">
                  {activePreset?.keyUrl ? (
                    <>
                      Get a key at{' '}
                      <a
                        href={activePreset.keyUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-accent underline underline-offset-2"
                      >
                        {activePreset.keyUrl.replace(/^https?:\/\//, '')}
                      </a>
                      .
                    </>
                  ) : needsKey ? (
                    'Paste the key for the provider above.'
                  ) : (
                    'No key needed for this local provider.'
                  )}
                </p>
              </Section>

              <Section title="Model" hint={curated?.note ?? 'Type any model id your provider supports.'}>
                <div className="flex gap-2">
                  <input
                    value={settings.model}
                    onChange={(e) => updateSettings({ model: e.target.value })}
                    placeholder="model id"
                    className="field font-mono text-xs"
                    spellCheck={false}
                  />
                  <button
                    onClick={testConnection}
                    disabled={testState === 'testing'}
                    className="btn shrink-0"
                    title="Fetch the model list from your provider"
                  >
                    <RefreshCw size={15} className={cn(testState === 'testing' && 'animate-spin')} />
                  </button>
                </div>

                <div className="relative">
                  <Search size={13} className="absolute top-1/2 left-3 -translate-y-1/2 text-faint" />
                  <input
                    value={modelFilter}
                    onChange={(e) => setModelFilter(e.target.value)}
                    placeholder={`Filter ${modelOptions.length} models…`}
                    className="field pl-8 text-xs"
                  />
                </div>

                <div className="scroll-thin max-h-44 overflow-y-auto rounded-xl border border-border">
                  {shownModels.map((m) => (
                    <button
                      key={m}
                      onClick={() => updateSettings({ model: m })}
                      className={cn(
                        'flex w-full items-center gap-2 border-b border-border/60 px-3 py-3 text-left font-mono text-xs transition last:border-0 hover:bg-surface-2 sm:py-2',
                        settings.model === m && 'bg-surface-2 text-accent',
                      )}
                    >
                      <span className="truncate">{m}</span>
                      {settings.model === m && <Check size={13} className="ml-auto shrink-0" />}
                    </button>
                  ))}
                  {shownModels.length === 0 && (
                    <p className="px-3 py-3 text-2xs text-faint">
                      No models listed — press ↻ to fetch them from your provider.
                    </p>
                  )}
                </div>

                <p className="text-2xs text-faint">
                  {presetId === 'ollama'
                    ? 'Ollama: run “ollama serve”, pull a model (e.g. “ollama pull qwen2.5”), then press ↻. Local models are fully unfiltered.'
                    : presetId === 'lmstudio'
                      ? 'LM Studio: start its local server, load a model, then press ↻.'
                      : 'Providers cap tokens per minute. On a rate-limit error, wait a few seconds and retry. ↻ refreshes the list.'}
                </p>
              </Section>

              <Section title="Generation">
                <Slider
                  label="Temperature"
                  value={settings.temperature}
                  min={0}
                  max={2}
                  step={0.05}
                  onChange={(v) => updateSettings({ temperature: v })}
                  display={settings.temperature.toFixed(2)}
                />
                <Slider
                  label="Top P"
                  value={settings.topP}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={(v) => updateSettings({ topP: v })}
                  display={settings.topP.toFixed(2)}
                />
                <label className="block">
                  <span className="mb-1 block text-xs text-muted">Max tokens</span>
                  <input
                    type="number"
                    min={256}
                    max={8192}
                    step={128}
                    value={settings.maxTokens}
                    onChange={(e) =>
                      updateSettings({ maxTokens: clamp(Number(e.target.value) || 2048, 256, 8192) })
                    }
                    className="field"
                  />
                </label>
              </Section>

              <Section title="Behaviour">
                <Toggle
                  label="Stream responses"
                  desc="Show words as they are generated."
                  checked={settings.streaming}
                  onChange={(v) => updateSettings({ streaming: v })}
                />
                <Toggle
                  label="Automatic memory"
                  desc="Quietly summarise each conversation so it never forgets."
                  checked={settings.memoryEnabled}
                  onChange={(v) => updateSettings({ memoryEnabled: v })}
                />
              </Section>
            </div>
          )}

          {tab === 'persona' && (
            <div className="space-y-5">
              <Section
                title="Universal system prompt"
                hint="The master instruction applied to every character in every theme."
              >
                <textarea
                  value={settings.globalSystemPrompt}
                  onChange={(e) => updateSettings({ globalSystemPrompt: e.target.value })}
                  rows={6}
                  className="field scroll-thin resize-none text-xs leading-relaxed"
                />
              </Section>

              <Section
                title="Who you are"
                hint="Defines you to every character — your name, nature and standing."
              >
                <textarea
                  value={settings.userPersona}
                  onChange={(e) => updateSettings({ userPersona: e.target.value })}
                  rows={5}
                  className="field scroll-thin resize-none text-xs leading-relaxed"
                  placeholder="Describe yourself…"
                />
                <p className="text-2xs text-faint">
                  In the World theme, your in-world identity is set per world instead.
                </p>
              </Section>
            </div>
          )}

          {tab === 'themes' && (
            <div className="space-y-3">
              <p className="text-sm text-muted">
                Each theme is its own universe. Characters and conversations never
                mix between them.
              </p>
              {THEME_ORDER.map((id) => {
                const t = THEMES[id]
                const active = settings.theme === id
                return (
                  <div
                    key={id}
                    className={cn(
                      'rounded-2xl border p-4 transition',
                      active ? 'border-accent/50 bg-surface-2' : 'border-border bg-surface',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="flex size-10 items-center justify-center rounded-xl bg-accent-grad text-accent-fg"
                        style={{ fontSize: 18 }}
                      >
                        {t.icon}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-display font-semibold">{t.name}</h4>
                          <span className="text-2xs text-faint">{t.tagline}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted">{t.blurb}</p>
                      </div>
                      <button
                        onClick={() => setTheme(id)}
                        disabled={active}
                        className={cn('btn shrink-0', active && 'opacity-60')}
                      >
                        {active ? 'Active' : 'Switch'}
                      </button>
                    </div>
                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {t.features.map((f) => (
                        <li key={f} className="chip text-2xs">
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          )}

          {tab === 'commands' && (
            <div className="space-y-4">
              <p className="text-sm text-muted">
                These work in <strong className="text-fg">every theme</strong>. Mix them
                freely inside a single message.
              </p>
              <CommandCheatsheet />
            </div>
          )}

          {tab === 'data' && (
            <div className="space-y-5">
              <Section title="Workspace" hint="Everything lives in your browser's local storage.">
                <div className="grid grid-cols-3 gap-2">
                  <Stat label="Characters" value={characters.length} />
                  <Stat label="Worlds" value={worlds.length} />
                  <Stat label="Chats" value={conversations.length} />
                </div>
              </Section>
              <Section title="Guide" hint="Reopen the first-run tour whenever you like.">
                <button
                  onClick={() => setUI({ settingsOpen: false, welcomeOpen: true })}
                  className="btn"
                >
                  <Sparkles size={15} /> Show the tutorial again
                </button>
              </Section>
              <Section title="Backup & restore">
                <div className="flex flex-wrap gap-2">
                  <button onClick={exportData} className="btn">
                    <Download size={15} /> Export all
                  </button>
                  <button onClick={() => fileRef.current?.click()} className="btn">
                    <Upload size={15} /> Import
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="application/json"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) void importData(f)
                      e.target.value = ''
                    }}
                  />
                </div>
              </Section>
              <Section title="Danger zone">
                <button
                  onClick={() => {
                    if (
                      confirm(
                        'Erase ALL characters, worlds, chats and settings? This cannot be undone.',
                      )
                    ) {
                      localStorage.removeItem('nexus-chat-store')
                      location.reload()
                    }
                  }}
                  className="btn border-danger/40 text-danger hover:bg-danger/10"
                >
                  <Trash2 size={15} /> Erase everything
                </button>
              </Section>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

function Section({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-2.5">
      <div>
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Cpu size={13} className="text-faint" />
          {title}
        </h3>
        {hint && <p className="mt-0.5 text-2xs text-faint">{hint}</p>}
      </div>
      <div className="space-y-2.5">{children}</div>
    </section>
  )
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  display: string
  onChange: (v: number) => void
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between text-xs text-muted">
        {label}
        <span className="font-mono text-fg">{display}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--c-accent)]"
      />
    </label>
  )
}

function Toggle({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string
  desc: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface px-3.5 py-3 text-left transition hover:border-border-strong"
    >
      <div className="flex-1">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-2xs text-faint">{desc}</div>
      </div>
      <span className="switch" data-on={checked}>
        <span />
      </span>
    </button>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-surface px-3 py-2.5 text-center">
      <div className="font-display text-xl font-bold">{value}</div>
      <div className="text-2xs text-faint">{label}</div>
    </div>
  )
}
