import { useEffect, useState, useSyncExternalStore } from 'react'
import { Share, SquarePlus, X } from 'lucide-react'
import { APP_NAME } from '../config.js'
import { dismissInstall, getInstallMode, openOutsideKakao, promptInstall, subscribeInstall } from '../install.js'
import Sheet from './Sheet.jsx'
import s from './InstallBanner.module.css'

// 카카오톡에서 기본 브라우저로 넘어가는 동안(index.html) 안내가 잠깐 번쩍이지 않게 기다리는 시간(ms)
const KAKAO_WAIT_MS = 1500

const TEXT = {
  install: { title: `${APP_NAME} 앱 설치`, sub: '설치하면 전체 화면 앱으로 바로 열려요', action: '설치' },
  ios: { title: '홈 화면에 추가하기', sub: '추가하면 전체 화면 앱처럼 열려요', action: '방법 보기' },
  kakao: {
    title: '카카오톡에서는 설치할 수 없어요',
    sub: "메뉴에서 '다른 브라우저로 열기'를 선택해 주세요",
    action: '다시 열기',
  },
}

// 하단 탭 위에 뜨는 앱 설치 안내. 어떤 안내를 보일지는 src/install.js가 정한다.
// 안드로이드는 '설치'를 누르면 브라우저 설치 창이 열리고, 아이폰은 홈 화면에 추가하는 방법을 보여 준다.
export default function InstallBanner() {
  const mode = useSyncExternalStore(subscribeInstall, getInstallMode, () => null)
  const [kakaoReady, setKakaoReady] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)

  useEffect(() => {
    if (mode !== 'kakao') return undefined
    const timer = setTimeout(() => setKakaoReady(true), KAKAO_WAIT_MS)
    return () => clearTimeout(timer)
  }, [mode])

  const visible = Boolean(mode) && (mode !== 'kakao' || kakaoReady)
  const text = mode ? TEXT[mode] : null

  const act = () => {
    if (mode === 'install') promptInstall()
    else if (mode === 'ios') setGuideOpen(true)
    else if (mode === 'kakao') openOutsideKakao()
  }

  return (
    <>
      {visible && (
        <section className={s.banner} aria-label="앱 설치 안내">
          <img src="/icons/icon-192.png" alt="" className={s.icon} />
          <div className={s.text}>
            <p className={s.title}>{text.title}</p>
            <p className={s.sub}>{text.sub}</p>
          </div>
          <button type="button" className={s.action} onClick={act}>
            {text.action}
          </button>
          <button type="button" className={s.close} onClick={dismissInstall} aria-label="설치 안내 닫기">
            <X size={18} strokeWidth={2.2} aria-hidden="true" />
          </button>
        </section>
      )}

      <Sheet open={guideOpen} onClose={() => setGuideOpen(false)} title="홈 화면에 추가하는 방법">
        <ol className={s.steps}>
          <li className={s.step}>
            <span className={s.stepNo}>1</span>
            <span className={s.stepText}>
              화면의 공유 버튼
              <Share size={18} strokeWidth={2.2} className={s.stepIcon} aria-hidden="true" />을 눌러요
            </span>
          </li>
          <li className={s.step}>
            <span className={s.stepNo}>2</span>
            <span className={s.stepText}>
              &apos;홈 화면에 추가&apos;
              <SquarePlus size={18} strokeWidth={2.2} className={s.stepIcon} aria-hidden="true" />를 눌러요
            </span>
          </li>
          <li className={s.step}>
            <span className={s.stepNo}>3</span>
            <span className={s.stepText}>오른쪽 위 &apos;추가&apos;를 누르면 홈 화면에 앱 아이콘이 생겨요</span>
          </li>
        </ol>
        <p className={s.note}>추가한 아이콘으로 열면 주소창 없이 전체 화면 앱처럼 열려요</p>
      </Sheet>
    </>
  )
}
