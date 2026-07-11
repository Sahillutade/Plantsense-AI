import { useState } from 'react'
import TopStrip from './components/layout/TopStrip'
import CorpusSidebar from './components/layout/CorpusSidebar'
import ChatPanel from './components/chat/ChatPanel'
import AssetContextPanel from './components/layout/AssetContextPanel'

function App() {

  const [mobilePanel, setMobilePanel] = useState('chat')

  const [activeTag, setActiveTag] = useState(null)

  return (
    <div className='flex flex-col h-screen w-screen overflow-hidden bg-slate-950'>
      
      {/* Top strip */}
      <TopStrip mobilePanel={mobilePanel} setMobilePanel={setMobilePanel} activeTag={activeTag} />

      {/* Main content area */}
      <div className='flex flex-1 overflow-hidden'>

        {/* Corpus sidebar
            - Desktop (lg+): always visible, fixed width
            - Tablet (md):   always visible, narrower
            - Mobile:        only visible when mobilePanel === 'sidebar'
        */}
        <div className={`h-full flex-shrink-0 w-full md:w-56 lg:w-60 ${mobilePanel === 'sidebar' ? 'flex' : 'hidden'} md:flex flex-col`}>
          <CorpusSidebar />
        </div>

        {/* Chat panel
            - Desktop/Tablet: always visible, takes remaining space
            - Mobile: only visible when mobilePanel === 'chat'
        */}
        <div className={`flex-1 h-full min-w-0 ${mobilePanel === 'chat' ? 'flex' : 'hidden'} md:flex flex-col`}>
          <ChatPanel onEquipmentDetected={setActiveTag} />
        </div>

        {/* Asset context panel
            - Desktop (lg+): always visible, fixed width
            - Tablet:        hidden
            - Mobile:        only visible when mobilePanel === 'asset'
        */}
        <div className={`h-full flex-shrink-0 w-full lg:w-64 ${mobilePanel === 'asset' ? 'flex' : 'hidden'} lg:flex flex-col`}>
          <AssetContextPanel activeTag={activeTag} />
        </div>

      </div>

      {/* Mobile bottom nav */}
      <MobileNav mobilePanel={mobilePanel} setMobilePanel={setMobilePanel} hasActiveTag={!!activeTag} />

    </div>
  )
}

function MobileNav({ mobilePanel, setMobilePanel, hasActiveTag }) {

  const tabs = [
    { key: 'sidebar', icon: 'bi-files',        label: 'Corpus'  },
    { key: 'chat',    icon: 'bi-chat-dots',     label: 'Chat'    },
    { key: 'asset',   icon: 'bi-cpu',           label: 'Asset'   },
  ]

  return (
    <nav className='md:hidden flex shrink-0 border-t border-slate-800 bg-slate-900'>
      {tabs.map((tab) => {
        const active = mobilePanel === tab.key
        return (
          <button key={tab.key} onClick={() => setMobilePanel(tab.key)} className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors text-xs ${active ? 'text-cyan-400' : 'text-slate-600 hover:text-slate-400'}`}>
            <i className={`bi ${tab.icon} text-lg leading-none`} />
            <span className='text-[10px]'> {tab.label} </span>
            {/* Dot indicator on Asset tab when a tag is active */}
            {tab.key === 'asset' && hasActiveTag && !active && (
              <span className='absolute mt-0.5 w-1.5 h-1.5 bg-cyan-400 rounded-full'></span>
            )}
          </button>
        )
      })}
    </nav>
  )

}

export default App
