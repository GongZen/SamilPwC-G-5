// 앱 설치(홈 화면에 추가) 안내에 쓰는 상태. 화면은 components/InstallBanner.jsx가 그린다.
// - 안드로이드 크롬·삼성 인터넷: 브라우저가 설치를 허락하면(beforeinstallprompt) '설치' 버튼 한 번으로 설치 창을 연다.
//   크롬은 페이지를 한 번 이상 누르고 30초가 지나야 이 신호를 보낸다(브라우저 규칙). 그 전에는 배너를 보이지 않는다
// - 아이폰: 웹에서 설치 창을 열 수 없어 '공유 > 홈 화면에 추가' 방법을 보여 준다
// - 카카오톡 안 브라우저: 설치할 수 없다. index.html이 기본 브라우저로 넘기고, 넘어가지 않으면 직접 여는 방법을 보여 준다
// - 이미 설치한 앱(전체 화면)으로 열었거나 PC(마우스)면 아무것도 보여 주지 않는다
// 배너를 닫으면 이 탭에서는 다시 보이지 않는다(sessionStorage).

const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
const DISMISS_KEY = 'samil-kkeutnaegi:install.dismissed'

let deferred = null // 설치 창을 열 수 있는 beforeinstallprompt 이벤트
let installed = false
let dismissed = readDismissed()
const listeners = new Set()
const notify = () => listeners.forEach((fn) => fn())

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault() // 브라우저 기본 안내 대신 앱의 설치 배너를 쓴다
    deferred = e
    notify()
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    installed = true
    notify()
  })
}

function readDismissed() {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

function matches(query) {
  return typeof window !== 'undefined' && Boolean(window.matchMedia?.(query).matches)
}

/** 카카오톡 안 브라우저(휴대폰)로 열었는지 */
export function isKakaoInApp() {
  return /KAKAOTALK/i.test(ua) && /Android|iPhone|iPad|iPod/i.test(ua)
}

function isIos() {
  return /iPhone|iPad|iPod/i.test(ua)
}

/** 홈 화면에 설치한 앱(주소창 없는 전체 화면)으로 열었는지 */
export function isStandalone() {
  return matches('(display-mode: standalone)') || matches('(display-mode: fullscreen)') || navigator.standalone === true
}

/** 지금 보여 줄 설치 안내: 'install'(설치 버튼) | 'ios'(아이폰 방법 안내) | 'kakao'(카카오톡 밖으로 열기 안내) | null */
export function getInstallMode() {
  if (installed || dismissed || isStandalone()) return null
  if (isKakaoInApp()) return 'kakao'
  if (!matches('(pointer: coarse)')) return null
  if (deferred) return 'install'
  if (isIos()) return 'ios'
  return null
}

/** 설치 안내가 바뀌면 fn을 부른다. 돌려준 함수를 부르면 그만 듣는다 */
export function subscribeInstall(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/** 브라우저 설치 창을 연다(버튼을 누를 때만 부른다). 결과: 'accepted' | 'dismissed' | 'unavailable' */
export async function promptInstall() {
  const e = deferred
  if (!e) return 'unavailable'
  deferred = null
  notify()
  try {
    await e.prompt()
    const { outcome } = await e.userChoice
    return outcome
  } catch {
    return 'dismissed'
  }
}

/** 이 탭에서는 설치 안내를 더 보이지 않는다 */
export function dismissInstall() {
  dismissed = true
  try {
    sessionStorage.setItem(DISMISS_KEY, '1')
  } catch {
    // 저장을 못 해도 이번 화면에서는 닫힌다
  }
  notify()
}

/** 카카오톡 안 브라우저에서 기본 브라우저로 다시 열기(카카오톡 공식 문서에는 없는 방식) */
export function openOutsideKakao() {
  window.location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(window.location.href)}`
}
