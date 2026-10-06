import { useState } from 'react'
import { APP_NAME } from '../config.js'
import { chromeIntentUrl, confirmSamsungLight, isStandalone } from '../install.js'
import Button3D from './Button3D.jsx'
import pwcLogo from '../assets/brand/pwc.png'
import b from './Button3D.module.css'
import s from './BrowserGuide.module.css'

// 안드로이드 삼성 인터넷으로 열었을 때 앱 대신 먼저 보여 주는 확인 화면(App.jsx). 접속할 때마다 보여 줄지는 config.js의
// SAMSUNG_GUIDE_EVERY_VISIT가 정한다(지금은 시험용으로 접속할 때마다).
// 삼성 인터넷은 기본 설정에서 휴대폰이 다크 모드면 앱 색을 강제로 바꾸고, 그 사실을 페이지에 알려 주지 않는다.
// 그래서 사용자가 직접 본다: 흰 카드 안의 PwC 마크는 다크 모드가 적용되면 카드가 어두워지며 글자가 거의 사라진다.
// - 잘 안 보이면 '크롬으로 열기'(크롬은 이 앱의 늘 밝은 화면 설정을 따른다). 버튼이 막힌 휴대폰은 주소를 크롬에 직접 입력
// - 잘 보이면 '잘 보여요! 바로 시작하죠!': 앱을 열고, 이 기기에서 기억해 삼성 인터넷에서도 설치할 수 있게 한다
//   (SAMSUNG_GUIDE_EVERY_VISIT가 false면 다음부터 이 화면 없이 바로 앱을 연다)
// 삼성 인터넷으로 이미 설치한 앱으로 열었으면, 다크 모드에서 쓰려면 크롬에서 다시 설치하라고 덧붙인다.
// '크롬으로 열기'는 링크(<a>)다. 사용자가 직접 누른 링크여야 삼성 인터넷이 크롬을 열어 준다.
// onStart: '잘 보여요'를 고른 뒤 앱을 연다
export default function BrowserGuide({ onStart }) {
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

  const start = () => {
    confirmSamsungLight()
    onStart()
  }

  return (
    <div className={s.wrap}>
      <header className={s.brand}>
        <img src={pwcLogo} alt="PwC" className={s.logo} />
      </header>
      <main className={s.body}>
        <h1 className={s.title}>PwC 마크가 잘 보이나요?</h1>
        {/* 확인용 카드: 흰 바탕의 PwC 마크. 다크 모드가 적용되면 카드가 어두워져 검은 글자가 거의 보이지 않는다 */}
        <div className={s.sample} aria-hidden="true">
          <img src={pwcLogo} alt="" className={s.sampleLogo} />
        </div>
        <p className={s.text}>
          바탕이 어둡고 PwC 글자가 잘 안 보이면, 휴대폰 다크 모드 때문에 삼성 인터넷이 {APP_NAME} 화면 색을 바꾼
          거예요. 크롬에서는 원래 색 그대로 보여요.
        </p>
        {installed && (
          <p className={s.note}>다크 모드에서도 원래 색으로 쓰려면 이 앱을 지우고 크롬에서 다시 설치해 주세요.</p>
        )}

        <div className={s.actions}>
          <a className={`${b.btn} ${b.primary} ${s.link}`} href={chromeIntentUrl(url)}>
            크롬으로 열기
          </a>
          <Button3D tone="plain" onClick={start}>
            잘 보여요! 바로 시작하죠!
          </Button3D>
        </div>

        <p className={s.hint}>위 크롬으로 열기가 되지 않는다면, 이 주소를 크롬 주소창에 직접 입력해주세요!</p>
        <div className={s.copyBox}>
          <span className={s.url}>{host}</span>
          <button type="button" className={s.copy} onClick={copy}>
            주소 복사
          </button>
        </div>
        {copied !== null && (
          <p className={copied ? s.status : `${s.status} ${s.statusFail}`} role="status">
            {copied ? '주소를 복사했어요. 크롬 주소창에 붙여 넣어 주세요' : '복사가 막혀 있어요. 위 주소를 길게 눌러 복사해 주세요'}
          </p>
        )}
      </main>
    </div>
  )
}
