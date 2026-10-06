import { useLayoutEffect, useRef } from 'react'
import { flushSync } from 'react-dom'

// 휴대폰 뒤로 가기(안드로이드 뒤로 가기 버튼과 제스처, 브라우저 뒤로 가기)를 앱 안의 '이전 단계'로 바꾼다.
//
// 원리: 앱 안에서 무언가를 열 때마다(다른 탭, 시트, 메뉴) 브라우저 방문 기록을 하나씩 쌓는다. 뒤로 가기를 누르면
// 브라우저가 기록을 하나 되돌리고(popstate), 여기서 맨 위에 열린 것을 닫는다. X 버튼처럼 앱 안에서 닫으면 쌓아 둔
// 기록을 같은 수만큼 되돌린다. 기록마다 이름을 붙이지 않고 '열려 있는 것의 수 = 쌓아 둔 기록의 수'만 맞춘다.
//
// 쌓이는 순서(아래부터)
// 1) 종료 확인용 한 칸: 홈 화면에 설치한 앱에서만. 첫 화면에서 누른 뒤로 가기를 한 번 붙잡아 종료 확인 창을 띄운다
// 2) 탭 기록: 지나온 탭 수 - 1(App.jsx가 useTabHistory로 알려 준다)
// 3) 열린 창: 시트와 메뉴(useBackLayer). 맨 나중에 연 것부터 닫힌다
//
// 크롬은 사용자가 화면을 한 번도 누르지 않은 페이지가 쌓은 기록을 뒤로 가기에서 건너뛴다(악용 방지).
// 그래서 종료 확인용 칸은 첫 터치 뒤에 쌓는다. 앱을 열고 아무것도 누르지 않은 채 뒤로 가면 확인 없이 닫힌다.
// 스크립트가 앱을 대신 닫을 수는 없어서(브라우저가 막는다) 종료 확인 창에서 한 번 더 뒤로 가면 그때 닫힌다.
//
// 쓰는 법
// - useBackLayer(열림, 닫기): 열려 있는 동안 뒤로 가기가 '닫기'를 부른다. <Sheet>는 이미 쓰고 있다
// - useScreenBack(할 일): 그 화면이 탭 기록 위에 있을 때 뒤로 가기가 탭을 되돌리는 대신 '할 일'을 부른다(아수(습)라장)
// - useTabHistory(깊이, 뒤로): App.jsx 전용. useExitGuard(켜기, 붙잡았을 때 할 일), resumeExitGuard(): App.jsx 전용

const KEY = 'samilBack' // 우리가 쌓은 기록에 남기는 표시(값은 처음 연 자리에서 몇 칸 위인지)

let index = 0 // 지금 기록 위치. 처음 연 자리가 0
let pendingTarget = null // 앱이 history.go로 기록을 되돌리는 중이면 도착할 위치
let tabDepth = 0
let tabBack = null
let screenBack = null
let guardOn = false // 종료 확인으로 붙잡기를 쓰는지(설치한 앱)
let guardArmed = false // 붙잡을 칸을 쌓아 두었는지
let prompting = false // 종료 확인 창이 떠 있는 동안
let rootPrompt = null
let syncQueued = false
let nextId = 1
const layers = [] // { id, onBack }. 연 순서대로

function readIndex(state) {
  const n = state && typeof state === 'object' ? state[KEY] : undefined
  return Number.isInteger(n) && n > 0 ? n : 0
}

function desired() {
  return (guardArmed ? 1 : 0) + tabDepth + layers.length
}

// 쌓아 둔 기록 수를 열려 있는 것의 수에 맞춘다
function sync() {
  syncQueued = false
  if (pendingTarget !== null) return // 되돌리는 중. 도착하면 다시 맞춘다
  const want = desired()
  if (want > index) {
    for (let i = index + 1; i <= want; i += 1) window.history.pushState({ [KEY]: i }, '')
    index = want
  } else if (want < index) {
    pendingTarget = want
    window.history.go(want - index)
  }
}

// 한 번에 여러 곳이 바뀌어도(시트를 닫으며 다른 시트를 여는 등) 한 번만 맞춘다
function queueSync() {
  if (syncQueued) return
  syncQueued = true
  queueMicrotask(sync)
}

function run(fn) {
  if (typeof fn === 'function') flushSync(fn)
}

// 뒤로 가기 한 번: 맨 위 창 > 탭 > 첫 화면(종료 확인) 순서
function handleBack() {
  const top = layers[layers.length - 1]
  if (top) {
    run(top.onBack)
    return
  }
  if (tabDepth > 0) {
    run(screenBack || tabBack)
    return
  }
  if (guardArmed) {
    guardArmed = false
    prompting = true
    run(rootPrompt)
  }
}

function onPopState(e) {
  const at = readIndex(e.state)
  if (pendingTarget !== null) {
    const target = pendingTarget
    pendingTarget = null
    index = at
    if (at >= target) {
      queueSync()
      return
    }
  } else {
    index = at
  }
  const want = desired()
  if (at >= want) {
    queueSync() // 앞으로 가기를 눌렀으면 다시 되돌린다
    return
  }
  // 뒤로 간 칸 수만큼 맨 위부터 닫는다. 닫지 않고 확인 창을 띄운 경우(그만할까요? 등)에는 거기서 멈춘다
  for (let steps = want - at; steps > 0; steps -= 1) {
    const before = desired()
    handleBack()
    if (desired() >= before) break
  }
  queueSync()
}

if (typeof window !== 'undefined') {
  const start = readIndex(window.history.state)
  if (start > 0) {
    // 새로고침 등으로 지난번에 쌓은 기록 위에서 다시 열렸다. 처음 자리로 돌아가서 시작한다
    index = start
    pendingTarget = 0
    window.history.go(-start)
  }
  window.addEventListener('popstate', onPopState)
}

/** 열려 있는 동안 뒤로 가기가 onBack을 부르게 한다(시트, 메뉴) */
export function useBackLayer(active, onBack) {
  const ref = useRef(onBack)
  useLayoutEffect(() => {
    ref.current = onBack
  })
  useLayoutEffect(() => {
    if (!active) return undefined
    const id = nextId
    nextId += 1
    layers.push({ id, onBack: () => ref.current?.() })
    queueSync()
    return () => {
      const k = layers.findIndex((l) => l.id === id)
      if (k >= 0) layers.splice(k, 1)
      queueSync()
    }
  }, [active])
}

/** 이 화면이 떠 있는 동안 탭을 되돌리는 대신 handler를 부른다(아수(습)라장: 나가기 버튼과 같게) */
export function useScreenBack(handler) {
  const ref = useRef(handler)
  useLayoutEffect(() => {
    ref.current = handler
  })
  useLayoutEffect(() => {
    const fn = () => ref.current?.()
    screenBack = fn
    return () => {
      if (screenBack === fn) screenBack = null
    }
  }, [])
}

/** App.jsx 전용: 지나온 탭 기록의 깊이(탭 수 - 1)와 한 단계 되돌리는 함수 */
export function useTabHistory(depth, onBack) {
  const ref = useRef(onBack)
  useLayoutEffect(() => {
    ref.current = onBack
  })
  useLayoutEffect(() => {
    tabBack = () => ref.current?.()
  }, [])
  useLayoutEffect(() => {
    tabDepth = depth
    queueSync()
  }, [depth])
}

/** App.jsx 전용: 켜져 있으면 첫 터치 뒤에 붙잡을 칸을 쌓고, 첫 화면에서 뒤로 가기를 누르면 onRoot를 부른다 */
export function useExitGuard(enabled, onRoot) {
  const ref = useRef(onRoot)
  useLayoutEffect(() => {
    ref.current = onRoot
  })
  useLayoutEffect(() => {
    if (!enabled) return undefined
    guardOn = true
    rootPrompt = () => ref.current?.()
    const arm = () => {
      if (guardArmed || prompting) return
      guardArmed = true
      queueSync()
    }
    window.addEventListener('pointerup', arm, true)
    window.addEventListener('keydown', arm, true)
    return () => {
      window.removeEventListener('pointerup', arm, true)
      window.removeEventListener('keydown', arm, true)
      guardOn = false
      guardArmed = false
      prompting = false
      rootPrompt = null
      queueSync()
    }
  }, [enabled])
}

/** App.jsx 전용: 종료 확인 창에서 '계속 공부하기'를 누르면 다시 붙잡을 칸을 쌓는다(버튼을 누른 순간에 부른다) */
export function resumeExitGuard() {
  prompting = false
  if (!guardOn || guardArmed) return
  guardArmed = true
  queueSync()
}
