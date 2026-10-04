import { CircleX } from 'lucide-react'
import Button3D from '../../components/Button3D.jsx'
import { fmt } from './format.js'
import s from './Result.module.css'

const TITLES = {
  left: '화면을 벗어나 탈락했어요',
  timeout: '시간 초과로 탈락했어요',
  wrong: '아쉽게 탈락했어요',
}

// 탈락 결과와 그 문제의 해설(틀림, 시간 초과, 화면 이탈).
// 카운트다운 중에 벗어났으면(beforeStart) 아직 보지 않은 1번 문제와 정답은 보여 주지 않는다
export default function OutResult({ game, round, onRetry, onHome, homeLabel }) {
  const item = game.beforeStart ? null : round.questions[game.qi]

  return (
    <div className={s.wrap}>
      <div className={s.scroll}>
        <div className={s.outIcon}>
          <CircleX size={46} strokeWidth={2.2} aria-hidden="true" />
        </div>
        <h2 className={s.title}>{TITLES[game.reason] ?? TITLES.wrong}</h2>
        {item ? (
          <>
            <p className={s.sub}>
              {game.qi + 1}번 문제에서 탈락 · 이때 생존자 {fmt(game.survivors)}명
            </p>
            <div className={s.review}>
              {item.subject && <span className={s.reviewSubject}>{item.subject}</span>}
              <p className={s.reviewQ}>{item.q}</p>
              <p className={s.reviewAnswer}>정답 · {item.o[item.a]}</p>
              {item.ex && <p className={s.reviewEx}>{item.ex}</p>}
            </div>
          </>
        ) : (
          <>
            <p className={s.sub}>1번 문제가 시작되기 전이었어요</p>
            <p className={s.note}>
              카운트다운부터는 화면을 벗어나면 탈락이에요.
              <br />
              알림과 다른 앱은 잠시 꺼 두세요.
            </p>
          </>
        )}
      </div>

      <div className={s.footer}>
        <Button3D onClick={onRetry}>연습 모드로 다시 도전</Button3D>
        <button type="button" className={s.textBtn} onClick={onHome}>
          {homeLabel}
        </button>
      </div>
    </div>
  )
}
