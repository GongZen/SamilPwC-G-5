// 앱 설치(홈 화면에 추가) 안내에 쓰는 상태. 화면은 components/InstallBanner.jsx가 그린다.
// - 안드로이드 크롬·삼성 인터넷: 브라우저가 설치를 허락하면(beforeinstallprompt) '설치' 버튼 한 번으로 설치 창을 연다.
//   크롬은 페이지를 한 번 이상 누르고 30초가 지나야 이 신호를 보낸다(브라우저 규칙). 그 전에는 배너를 보이지 않는다
// - 아이폰: 웹에서 설치 창을 열 수 없어 '공유 > 홈 화면에 추가' 방법을 보여 준다
// - 카카오톡 안 브라우저: 설치할 수 없다. index.html이 기본 브라우저로 넘기고, 넘어가지 않으면 직접 여는 방법을 보여 준다
// - 이미 설치한 앱(전체 화면)으로 열었거나 PC(마우스)면 아무것도 보여 주지 않는다
// - 안드로이드 삼성 인터넷: 휴대폰이 다크 모드면 앱 색을 강제로 바꾸므로 처음 한 번 BrowserGuide가 PwC 마크로 확인하게 한다.
//   잘 안 보이면 크롬으로 안내하고, 잘 보인다고 고른 기기에만 설치 정보를 붙여 삼성 인터넷에서도 설치할 수 있게 한다
// 배너를 닫으면 이 탭에서는 다시 보이지 않는다(sessionStorage).

import { read, write } from './store/storage.js'

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

/** 안드로이드 삼성 인터넷으로 열었는지. 삼성 인터넷은 기본 설정에서 휴대폰이 다크 모드면 앱 색을 강제로 바꾸고
 * 이 앱의 color-scheme 설정(늘 밝은 화면)을 따르지 않는다. 크롬과 Google 앱은 따른다 */
export function isSamsungInternet() {
  return /SamsungBrowser/i.test(ua) && /Android/i.test(ua)
}

const CHROME_STORE = 'https://play.google.com/store/apps/details?id=com.android.chrome'
// 삼성 인터넷에서 'PwC 마크가 잘 보여요'를 고른 기기. index.html의 설치 정보 스크립트도 같은 키를 읽는다
const LIGHT_KEY = 'samsung.lightOk'
const MANIFEST_HREF = '/manifest.webmanifest'

/** 삼성 인터넷에서 'PwC 마크가 잘 보여요'를 고른 적이 있는지(이 기기) */
export function isSamsungLightOk() {
  return read(LIGHT_KEY, false) === true
}

/** 주소 끝에 ?check를 붙여 열었는지. 확인용 숨김 기능: 안내 화면을 다시 띄우고, index.html이 다크 모드 신호를 보여 준다 */
export function isCheckMode() {
  return typeof window !== 'undefined' && /[?&]check(?:[=&]|$)/.test(window.location.search)
}

/** 앱 대신 BrowserGuide를 먼저 보여 줄지: 삼성 인터넷이면서 아직 '잘 보여요'를 고르지 않았을 때(또는 ?check) */
export function needsBrowserGuide() {
  return isSamsungInternet() && (!isSamsungLightOk() || isCheckMode())
}

/** '잘 보여요! 바로 시작하죠!': 이 기기에서 기억하고, 설치 정보를 붙여 삼성 인터넷에서도 설치할 수 있게 한다 */
export function confirmSamsungLight() {
  write(LIGHT_KEY, true)
  if (document.querySelector('link[rel="manifest"]')) return
  const link = document.createElement('link')
  link.rel = 'manifest'
  link.href = MANIFEST_HREF
  document.head.appendChild(link)
}

/** 지금 주소를 크롬으로 여는 안드로이드 intent 주소. 크롬이 없거나 꺼져 있으면 Play 스토어의 크롬 페이지로 간다 */
export function chromeIntentUrl(href = window.location.href) {
  const u = new URL(href)
  const fallback = encodeURIComponent(CHROME_STORE)
  return `intent://${u.host}${u.pathname}${u.search}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${fallback};end`
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
