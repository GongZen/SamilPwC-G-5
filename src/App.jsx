import { useState } from 'react'
import { FULLSCREEN_TABS, TAB_SURFACE, TABS } from './config.js'
import { UserProvider, useUser } from './store/UserContext.jsx'
import TabBar from './components/TabBar.jsx'
import LoginSheet from './components/LoginSheet.jsx'
import Lobby from './screens/lobby/Lobby.jsx'
import Samchocut from './screens/samchocut/Samchocut.jsx'
import Asurajang from './screens/asurajang/Asurajang.jsx'
import My from './screens/my/My.jsx'
import pwcLogo from './assets/brand/pwc.png'
import s from './App.module.css'

const SCREENS = { lobby: Lobby, samchocut: Samchocut, asurajang: Asurajang, my: My }

// 주소 끝에 ?tab=samchocut 처럼 붙이면 그 탭으로 바로 연다(확인·캡처용)
function initialTab() {
  const id = new URLSearchParams(window.location.search).get('tab')
  return TABS.some((t) => t.id === id) ? id : 'lobby'
}

function Shell() {
  const [tab, setTab] = useState(initialTab)
  const [prevTab, setPrevTab] = useState('lobby')
  // 다른 탭으로 넘어가며 함께 전한 값. 예: MY의 오답노트 칸 > { sheet: 'wrong' }
  const [entry, setEntry] = useState(null)
  const { loginOpen, closeLogin, login } = useUser()

  // 다른 탭으로 이동. options는 그 탭 화면이 처음 열릴 때 entry로 받는다(예: 특정 시트 바로 열기)
  const goTo = (id, options = null) => {
    if (id === tab || !SCREENS[id]) return
    setPrevTab(tab)
    setEntry(options)
    setTab(id)
  }

  // 전체 화면 탭에서 나갈 때 직전 탭으로 돌아감
  const goBack = () => {
    setEntry(null)
    setTab(prevTab && prevTab !== tab ? prevTab : 'lobby')
  }

  const Screen = SCREENS[tab]
  const fullScreen = FULLSCREEN_TABS.includes(tab)
  const surface = TAB_SURFACE[tab] === 'bg' ? s.surfaceBg : ''

  return (
    <div className={`${s.app} ${surface}`}>
      <header className={s.brand}>
        <img src={pwcLogo} alt="PwC" className={s.logo} />
      </header>
      <main className={s.screen}>
        <Screen key={tab} goTo={goTo} goBack={goBack} entry={entry} />
      </main>
      {!fullScreen && <TabBar current={tab} onSelect={goTo} />}
      <div id="sheet-root" className={s.sheetRoot} />
      <LoginSheet open={loginOpen} onClose={closeLogin} onSubmit={login} />
    </div>
  )
}

export default function App() {
  return (
    <UserProvider>
      <Shell />
    </UserProvider>
  )
}
