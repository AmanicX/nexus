import { useEffect, useState } from 'react'
import { Menu, Terminal } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { Sidebar } from '@/components/Sidebar'
import { ChatView } from '@/components/ChatView'
import { EmptyState } from '@/components/EmptyState'
import { SettingsModal } from '@/components/SettingsModal'
import { CharacterModal } from '@/components/CharacterModal'
import { WorldModal } from '@/components/WorldModal'
import { CommandCheatsheet } from '@/components/CommandCheatsheet'
import { Modal } from '@/components/Modal'

function App() {
  const theme = useStore((s) => s.settings.theme)
  const conversation = useStore((s) =>
    s.conversations.find((c) => c.id === s.activeConversationId),
  )
  const setUI = useStore((s) => s.setUI)
  const [showCommands, setShowCommands] = useState(false)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  return (
    <div className="app-bg flex h-full w-full overflow-hidden text-fg">
      <Sidebar />

      <main className="flex min-w-0 flex-1 flex-col">
        {conversation ? (
          <ChatView onShowCommands={() => setShowCommands(true)} />
        ) : (
          <div className="flex h-full min-w-0 flex-1 flex-col">
            <header className="hairline material flex items-center gap-2 px-3 py-2.5 lg:hidden">
              <button
                onClick={() => setUI({ sidebarOpen: true })}
                className="btn btn-ghost size-9 rounded-full p-0"
                aria-label="Open sidebar"
              >
                <Menu size={18} />
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
