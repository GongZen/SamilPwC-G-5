import { useState } from 'react'
import { APP_NAME } from '../config.js'
import { chromeIntentUrl, googleIntentUrl, isStandalone } from '../install.js'
import pwcLogo from '../assets/brand/pwc.png'
import b from './Button3D.module.css'
import s from './BrowserGuide.module.css'

// 안드로이드 삼성 인터넷으로 열었을 때 앱 대신 먼저 보여 주는 안내(App.jsx).
// 삼성 인터넷은 기본 설정에서 휴대폰이 다크 모드면 앱 색을 강제로 바꾸고 이 앱의 color-scheme 설정을 따르지 않는다.
// Google 앱과 크롬은 설정을 따라 늘 밝은 화면으로 보인다. 그래서 Google 앱, 크롬 순서로 여는 버튼을 두고,
// 버튼이 막힌 휴대폰(외부 앱 열기 차단, 크롬 꺼짐)을 위해 주소 복사와 '그래도 여기서 보기'를 둔다.
// 삼성 인터넷으로 이미 설치한 앱으로 열었으면 지우고 다시 설치하라고 덧붙인다.
// 여는 버튼은 링크(<a>)다. 사용자가 직접 누른 링크여야 삼성 인터넷이 다른 앱을 열어 준다.
// onStay: '그래도 여기서 보기'(이번 접속 동안 앱을 연다)
export default function BrowserGuide({ onStay }) {
  const [copied, setCopied] = useState(null) // true: 복사함, false: 복사가 막힘
  const url = window.location.href
  const host = window.location.host
  const installed = isStandalone()

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className={s.wrap}>
      <header className={s.brand}>
        <img src={pwcLogo} alt="PwC" className={s.logo} />
      </header>
      <main className={s.body}>
        <h1 className={s.title}>Google 앱이나 크롬에서 열어 주세요</h1>
        <p className={s.text}>
          삼성 인터넷은 휴대폰이 다크 모드일 때 {APP_NAME} 화면 색을 강제로 바꿔요. Google 앱과 크롬에서는 원래 색
          그대로 보이고, 앱 설치도 그곳에서 할 수 있어요.
        </p>
        {installed && (
          <p className={s.note}>
            지금 열린 앱은 삼성 인터넷으로 설치됐어요. 홈 화면에서 이 앱을 지우고 Google 앱이나 크롬에서 다시 설치해
            주세요.
          </p>
        )}

        <div className={s.actions}>
          <a className={`${b.btn} ${b.primary} ${s.link}`} href={googleIntentUrl(url)}>
            Google 앱으로 열기
          </a>
          <p className={s.hint}>Google 앱 검색 결과에서 이 주소를 눌러 주세요</p>
          <a className={`${b.btn} ${b.plain} ${s.link}`} href={chromeIntentUrl(url)}>
            크롬으로 열기
          </a>
        </div>

        <div className={s.copyBox}>
          <span className={s.url}>{host}</span>
          <button type="button" className={s.copy} onClick={copy}>
            주소 복사
          </button>
        </div>
        {copied !== null && (
          <p className={copied ? s.status : `${s.status} ${s.statusFail}`} role="status">
            {copied
              ? '주소를 복사했어요. Google 앱이나 크롬의 주소창에 붙여 넣어 주세요'
              : '복사가 막혀 있어요. 위 주소를 길게 눌러 복사해 주세요'}
          </p>
        )}
      </main>
      <footer className={s.foot}>
        <button type="button" className={s.stay} onClick={onStay}>
          그래도 여기서 보기
        </button>
        <p className={s.stayHint}>휴대폰이 다크 모드면 색이 어둡게 보일 수 있어요</p>
      </footer>
    </div>
  )
}
