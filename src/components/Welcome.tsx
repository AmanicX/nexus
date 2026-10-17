import { useMemo, useState } from 'react'
import {
  AlertCircle,
  Check,
  Cpu,
  Eye,
  EyeOff,
  Globe2,
  KeyRound,
  MessageSquarePlus,
  Palette,
  RefreshCw,
  Sparkles,
  Terminal,
  Users,
  Zap,
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import {
  DEFAULT_BASE_URL,
  GROQ_MODELS,
  PROVIDER_PRESETS,
  listGroqModels,
  providerNeedsKey,
  suggestionsFor,
} from '@/lib/groq'
import { Modal } from './Modal'
import { cn } from '@/lib/utils'

const STEPS = [
  { label: 'Welcome', title: 'Welcome to Nexus', subtitle: 'A studio for characters, worlds and the model you choose.' },
  { label: 'Connect', title: 'Connect a model', subtitle: 'Paste a Groq key, or point Nexus at any other provider.' },
  { label: 'Model', title: 'Pick a model', subtitle: 'GPT-OSS 20B is the default — you can change it any time.' },
  { label: 'Tour', title: 'How Nexus works', subtitle: 'Thirty seconds of orientation, then it is yours.' },
] as const

const TIPS = [
  {
    icon: <MessageSquarePlus size={16} />,
    title: 'Start talking',
    body: 'Press “New character” in the sidebar to write someone, or open a ready-made one from the roster.',
  },
  {
    icon: <Terminal size={16} />,
    title: 'Direct the scene',
    body: 'Type commands to shape a reply: thoughts, actions, and events. The Terminal button lists them all.',
  },
  {
    icon: <Palette size={16} />,
    title: 'Three universes',
    body: 'Chatbot, Anime and World are separate. Characters, chats and lore never mix between them.',
  },
  {
    icon: <Globe2 size={16} />,
    title: 'Worlds remember',
    body: 'In the World theme, reputation, events and notes persist from one turn to the next.',
  },
  {
    icon: <Sparkles size={16} />,
    title: 'Memory keeps the thread',
    body: 'Long chats are quietly summarised, so a scene keeps its shape instead of drifting.',
  },
  {
    icon: <Cpu size={16} />,
    title: 'You own the model',
    body: 'Hosted or local, one key or none. Nothing is sent anywhere but the provider you pick.',
  },
] as const

export function Welcome() {
  const settings = useStore((s) => s.settings)
  const ui = useStore((s) => s.ui)
  const setUI = useStore((s) => s.setUI)
  const updateSettings = useStore((s) => s.updateSettings)

  const open = ui.welcomeOpen || !settings.onboarded

  const [step, setStep] = useState(0)
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<'idle' | 'ok' | 'fail'>('idle')
  const [message, setMessage] = useState('')

  const needsKey = providerNeedsKey(settings.baseUrl)
  const preset = PROVIDER_PRESETS.find((p) => p.baseUrl === settings.baseUrl.trim())
  const current = STEPS[step]

  const models = useMemo(
    () =>
      Array.from(
        new Set([
          ...GROQ_MODELS.map((m) => m.id),
          ...suggestionsFor(settings.baseUrl),
          ...settings.cachedModels,
        ]),
      ).filter(Boolean),
    [settings.baseUrl, settings.cachedModels],
  )

  const close = () => {
    updateSettings({ onboarded: true })
    setUI({ welcomeOpen: false })
    setStep(0)
    setResult('idle')
    setMessage('')
  }

  const testConnection = async () => {
    if (needsKey && !settings.apiKey.trim()) {
      setResult('fail')
      setMessage('Paste your key first.')
      return
    }
    setTesting(true)
    setResult('idle')
    setMessage('')
    try {
      const list = await listGroqModels(settings.apiKey, settings.baseUrl)
      updateSettings({ cachedModels: list })
      setResult('ok')
      setMessage(`Connected · ${list.length} models available`)
    } catch (e) {
      setResult('fail')
      setMessage(e instanceof Error ? e.message : 'Connection failed')
    } finally {
      setTesting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={current.title}
      subtitle={current.subtitle}
      icon={<Zap size={18} />}
      size="lg"
      bodyClassName="p-0"
      footer={
        <div className="flex w-full items-center gap-2">
          <button onClick={close} className="btn btn-ghost mr-auto">
            Skip
          </button>
          {step > 0 && (
            <button onClick={() => setStep((s) => s - 1)} className="btn">
              Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep((s) => s + 1)} className="btn btn-accent">
              Continue
            </button>
          ) : (
            <button onClick={close} className="btn btn-accent">
              <Check size={16} />
              Start
            </button>
          )}
        </div>
      }
    >
      <div className="flex items-center gap-1.5 border-b border-border px-5 py-2.5 sm:px-6">
        {STEPS.map((s, i) => (
          <button
            key={s.label}
            onClick={() => setStep(i)}
            className={cn(
              'flex flex-1 flex-col gap-1.5 text-left',
              i <= step ? 'text-fg' : 'text-faint',
            )}
          >
            <span
              className={cn(
                'h-1 rounded-full transition',
                i <= step ? 'bg-accent' : 'bg-border',
              )}
            />
            <span className="text-2xs font-medium tracking-wide uppercase">{s.label}</span>
          </button>
        ))}
      </div>

      <div className="scroll-thin max-h-[58dvh] overflow-y-auto p-5 sm:p-6">
        {step === 0 && (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-muted">
              Nexus is a free studio for writing AI characters and living inside their worlds.
              You bring the model — hosted or running on your own machine — and Nexus keeps your
              characters, worlds and conversations on this device.
            </p>
            <ul className="list">
              <li className="list-row text-sm">
                <Users size={16} className="shrink-0 text-accent" />
                Write your own characters, or start from a roster and layer changes on top.
              </li>
              <li className="list-row text-sm">
                <Globe2 size={16} className="shrink-0 text-accent" />
                Build worlds with places, factions and lore that carry between scenes.
              </li>
              <li className="list-row text-sm">
                <KeyRound size={16} className="shrink-0 text-accent" />
                Nothing to pay and nothing to sign up for — you supply the model.
              </li>
            </ul>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-accent/40 bg-surface-2 p-4">
              <div className="flex items-center gap-2">
                <KeyRound size={15} className="text-accent" />
                <h3 className="text-sm font-semibold">Paste your Groq key</h3>
                <span className="ml-auto rounded-full bg-accent/15 px-2 py-0.5 text-2xs font-medium text-accent">
                  Recommended
                </span>
              </div>
              <p className="mt-1.5 text-2xs text-faint">
                Free to create, and it stays on this device. Groq answers only the requests you send.
              </p>
              <div className="mt-3 flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={settings.apiKey}
                    onChange={(e) => updateSettings({ apiKey: e.target.value })}
                    placeholder="gsk_…"
                    className="field pr-12 font-mono text-xs sm:pr-9"
                    spellCheck={false}
                  />
                  <button
                    onClick={() => setShowKey((v) => !v)}
                    className="absolute top-1/2 right-0.5 grid size-11 -translate-y-1/2 place-items-center rounded-lg text-faint hover:text-fg sm:right-2 sm:size-8"
                    aria-label={showKey ? 'Hide API key' : 'Show API key'}
                  >
                    {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <button onClick={testConnection} className="btn shrink-0" disabled={testing}>
                  <RefreshCw size={15} className={cn(testing && 'animate-spin')} />
                  Test
                </button>
              </div>
              {result !== 'idle' && (
                <p
                  className={cn(
                    'mt-2 flex items-center gap-1.5 text-xs',
                    result === 'ok' ? 'text-[#30d158]' : 'text-danger',
                  )}
                >
                  {result === 'ok' ? <Check size={13} /> : <AlertCircle size={13} />}
                  {message}
                </p>
              )}
              <p className="mt-2 text-2xs text-faint">
                Get a key at{' '}
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent underline underline-offset-2"
                >
                  console.groq.com/keys
                </a>
                .
              </p>
            </div>

            <div>
              <h3 className="text-xs font-semibold tracking-wide text-faint uppercase">
                Or use another provider
              </h3>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {PROVIDER_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      updateSettings({ baseUrl: p.baseUrl })
                      setResult('idle')
                      setMessage('')
                    }}
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
                className="field mt-2 font-mono text-xs"
                spellCheck={false}
              />
              <p className="mt-2 text-2xs text-faint">
                {preset?.keyUrl
                  ? `Paste that provider's key above too — ${preset.label} needs one.`
                  : needsKey
                    ? 'Any OpenAI-compatible endpoint works. Paste its key above.'
                    : 'This one runs on your own machine, so no key is needed. Press ↻ to list its models.'}
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <div className="scroll-thin max-h-64 overflow-y-auto rounded-xl border border-border">
              {models.map((m) => {
                const meta = GROQ_MODELS.find((g) => g.id === m)
                return (
                  <button
                    key={m}
                    onClick={() => updateSettings({ model: m })}
                    className={cn(
                      'flex w-full items-start gap-3 border-b border-border/60 px-3 py-3 text-left transition last:border-0 hover:bg-surface-2',
                      settings.model === m && 'bg-surface-2',
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate font-mono text-xs">{m}</span>
                        {meta && (
                          <span className="shrink-0 text-2xs text-faint">{meta.label}</span>
                        )}
                      </span>
                      {meta && <span className="mt-0.5 block text-2xs text-faint">{meta.note}</span>}
                    </span>
                    {settings.model === m && <Check size={14} className="mt-0.5 shrink-0 text-accent" />}
                  </button>
                )
              })}
              {models.length === 0 && (
                <p className="px-3 py-4 text-2xs text-faint">
                  No models listed yet. Add a key, then press ↻ to fetch them from your provider.
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <input
                value={settings.model}
                onChange={(e) => updateSettings({ model: e.target.value })}
                placeholder="or type any model id"
                className="field font-mono text-xs"
                spellCheck={false}
              />
              <button onClick={testConnection} className="btn shrink-0" disabled={testing}>
                <RefreshCw size={15} className={cn(testing && 'animate-spin')} />
              </button>
            </div>
            <p className="text-2xs text-faint">
              {message || 'Providers cap tokens per minute. On a rate-limit error, wait a few seconds and retry.'}
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {TIPS.map((t) => (
              <div key={t.title} className="rounded-2xl border border-border bg-surface p-3.5">
                <div className="flex items-center gap-2 text-accent">
                  {t.icon}
                  <h3 className="text-sm font-semibold text-fg">{t.title}</h3>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">{t.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
