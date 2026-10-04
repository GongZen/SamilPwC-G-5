import { Crown } from 'lucide-react'
import Button3D from '../../components/Button3D.jsx'
import MascotTalk from '../../components/MascotTalk.jsx'
import { speedRank } from './game.js'
import { fmt } from './format.js'
import s from './Result.module.css'

// 조이를 누르면 하는 말
const JOY_LINES = ['진짜 살아남았다구요?']

// 최종 생존: 누적 응답 시간과 생존자 중 속도 순위
export default function WinResult({ game, round, onHome, homeLabel }) {
  return (
    <div className={s.wrap}>
      <div className={s.scroll}>
        <div className={s.crown}>
          <Crown size={50} strokeWidth={1.6} fill="currentColor" aria-hidden="true" />
        </div>
        {/* 조이는 제목 오른쪽에 둔다(삼초컷 제목 줄과 같은 방식). 화면 높이와 상관없이 보인다 */}
        <div className={s.winHead}>
          <h2 className={s.winTitle}>끝까지 살아남았어요!</h2>
          <MascotTalk name="joy" size={40} lines={JOY_LINES} side="top" align="end" />
        </div>
        <p className={s.sub}>
          {fmt(game.participants)}명 중 최종 생존자 <b className={s.em}>{fmt(game.survivors)}명</b>
        </p>
        <div className={s.stats}>
          <div className={s.stat}>
            <span className={s.statLabel}>누적 응답 시간</span>
            <span className={s.statValue}>{game.totalTime.toFixed(1)}초</span>
          </div>
          <div className={s.stat}>
            <span className={s.statLabel}>생존자 중 속도 순위</span>
            <span className={s.statValue}>{speedRank(game, round)}위</span>
          </div>
        </div>
        {game.practice ? (
          <p className={s.note}>연습 모드 기록은 최고 기록과 경품 대상에 들어가지 않아요.</p>
        ) : (
          <p className={s.note}>
            최후 1인 경품은 응답 시간이 가장 짧은 생존자에게 돌아가요.
            {round.resultNotice && (
              <>
                <br />
                {round.resultNotice}
              </>
            )}
          </p>
        )}
      </div>

      <div className={s.footer}>
        <Button3D onClick={onHome}>{homeLabel}</Button3D>
      </div>
    </div>
  )
}
