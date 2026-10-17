import { useEffect, useState } from 'react'
import { Menu, Terminal } from 'lucide-react'
import { useStore } from '@/store/useStore'
import type { ThemeId } from '@/types'
import { Sidebar } from '@/components/Sidebar'
import { ChatView } from '@/components/ChatView'
import { EmptyState } from '@/components/EmptyState'
import { SettingsModal } from '@/components/SettingsModal'
import { CharacterModal } from '@/components/CharacterModal'
import { WorldModal } from '@/components/WorldModal'
import { CommandCheatsheet } from '@/components/CommandCheatsheet'
import { Modal } from '@/components/Modal'

/** Matches --c-bg in index.css, so the mobile status bar follows the theme. */
const THEME_COLORS: Record<ThemeId, string> = {
  chatbot: '#000000',
  anime: '#060310',
  world: '#03100a',
}

function App() {
  const theme = useStore((s) => s.settings.theme)
  const conversation = useStore((s) =>
    s.conversations.find((c) => c.id === s.activeConversationId),
  )
  const setUI = useStore((s) => s.setUI)
  const [showCommands, setShowCommands] = useState(false)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    const color = THEME_COLORS[theme] ?? '#000000'
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color)
  }, [theme])

  return (
    <div className="app-bg flex h-full w-full overflow-hidden text-fg">
      <Sidebar />

      <main className="flex min-w-0 flex-1 flex-col">
        {conversation ? (
          <ChatView onShowCommands={() => setShowCommands(true)} />
        ) : (
          <div className="flex h-full min-w-0 flex-1 flex-col">
            <header className="hairline material pad-top flex items-center gap-2 px-2 py-2.5 lg:hidden">
              <button
                onClick={() => setUI({ sidebarOpen: true })}
                className="btn btn-ghost grid size-11 place-items-center rounded-full p-0"
                aria-label="Open sidebar"
              >
                <Menu size={20} />
              </button>
              <span className="font-display text-body font-semibold">Nexus</span>
            </header>
            <EmptyState />
          </div>
        )}
      </main>

      <SettingsModal />
      <CharacterModal />
      <WorldModal />

      <Modal
        open={showCommands}
        onClose={() => setShowCommands(false)}
        title="Command syntax"
        subtitle="Write richer scenes with these. They work in every theme."
        icon={<Terminal size={18} />}
        size="md"
      >
        <CommandCheatsheet />
      </Modal>
    </div>
  )
}

export default App
