import { Users } from 'lucide-react'
import { fmt } from './format.js'
import s from './Countdown.module.css'

// 시작 카운트다운(3, 2, 1)
export default function Countdown({ seconds, participants, leaveEliminates }) {
  return (
    <div className={s.wrap}>
      <div className={s.inner}>
        <p className={s.lead}>곧 1번 문제가 시작돼요</p>
        <div className={s.circle} role="timer" aria-label={`시작까지 ${seconds}초`}>
          {seconds}
        </div>
        <p className={s.pill}>
          <Users size={18} strokeWidth={2} aria-hidden="true" />
          {fmt(participants)}명 입장 완료
        </p>
        {leaveEliminates && (
          <p className={s.note}>
            지금부터 화면을 벗어나면 탈락이에요.
            <br />
            알림과 다른 앱은 잠시 꺼 두세요.
          </p>
        )}
      </div>
    </div>
  )
}
