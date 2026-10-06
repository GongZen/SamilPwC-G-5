import { useState } from 'react'
import { FULLSCREEN_TABS, TAB_SURFACE, TABS } from './config.js'
import { UserProvider, useUser } from './store/UserContext.jsx'
import { isStandalone } from './install.js'
import { resumeExitGuard, useExitGuard, useTabHistory } from './components/backStack.js'
import TabBar from './components/TabBar.jsx'
import LoginSheet from './components/LoginSheet.jsx'
import InstallBanner from './components/InstallBanner.jsx'
import ExitConfirm from './components/ExitConfirm.jsx'
import Lobby from './screens/lobby/Lobby.jsx'
import Samchocut from './screens/samchocut/Samchocut.jsx'
import Asurajang from './screens/asurajang/Asurajang.jsx'
import Dongi from './screens/dongi/Dongi.jsx'
import My from './screens/my/My.jsx'
import pwcLogo from './assets/brand/pwc.png'
import s from './App.module.css'

const SCREENS = { lobby: Lobby, samchocut: Samchocut, asurajang: Asurajang, dongi: Dongi, my: My }

// 주소 끝에 ?tab=samchocut 처럼 붙이면 그 탭으로 바로 연다(확인·캡처용)
function initialTab() {
  const id = new URLSearchParams(window.location.search).get('tab')
  return TABS.some((t) => t.id === id) ? id : 'lobby'
}

function Shell() {
  // 지나온 탭(마지막이 지금 탭). 휴대폰 뒤로 가기를 누르면 지나온 순서대로 하나씩 되돌아간다(backStack.js)
  const [stack, setStack] = useState(() => [initialTab()])
  const tab = stack[stack.length - 1]
  // 다른 탭으로 넘어가며 함께 전한 값. 예: MY의 오답노트 칸 > { sheet: 'wrong' }
  const [entry, setEntry] = useState(null)
  // 종료 확인 창. 홈 화면에 설치한 앱에서만, 첫 화면에서 뒤로 가기를 누르면 뜬다
  const [standalone] = useState(isStandalone)
  const [exitOpen, setExitOpen] = useState(false)
  const { loginOpen, closeLogin, login } = useUser()

  // 다른 탭으로 이동(지나온 탭에 하나 더 쌓는다). options는 그 탭 화면이 처음 열릴 때 entry로 받는다(예: 특정 시트 바로 열기).
  // 전체 화면 탭(아수(습)라장)에서 나갈 때는 그 탭을 기록에서 빼서, 뒤로 가기로 끝난 게임에 다시 들어가지 않게 한다
  const goTo = (id, options = null) => {
    if (id === tab || !SCREENS[id]) return
    setEntry(options)
    setStack((list) => {
      const base = FULLSCREEN_TABS.includes(list[list.length - 1]) ? list.slice(0, -1) : list
      return base[base.length - 1] === id ? base : [...base, id]
    })
  }

  // 한 단계 앞의 탭으로(휴대폰 뒤로 가기, 전체 화면 탭의 나가기 버튼). 더 돌아갈 탭이 없으면 첫 화면
  const goBack = () => {
    setEntry(null)
    setStack((list) => (list.length > 1 ? list.slice(0, -1) : ['lobby']))
  }

  useTabHistory(stack.length - 1, goBack)
  useExitGuard(standalone, () => setExitOpen(true))

  // '계속 공부하기': 창을 닫고 다음 뒤로 가기를 다시 붙잡을 준비를 한다
  const stay = () => {
    setExitOpen(false)
    resumeExitGuard()
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
      {/* 앱 설치 안내(조건이 맞을 때만 보인다). 문제 풀이 중인 전체 화면 탭에는 띄우지 않는다 */}
      {!fullScreen && <InstallBanner />}
      {!fullScreen && <TabBar current={tab} onSelect={goTo} />}
      <div id="sheet-root" className={s.sheetRoot} />
      <LoginSheet open={loginOpen} onClose={closeLogin} onSubmit={login} />
      <ExitConfirm open={exitOpen} onStay={stay} />
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
