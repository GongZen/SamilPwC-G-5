import { ChevronRight } from 'lucide-react'
import Sheet from '../../components/Sheet.jsx'
import s from './MockSheet.module.css'

// 모의고사 회차 시트. 회차는 시간 제한, 오픈 시각, 알림 없이 언제든 바로 응시한다.
// 회차를 누르면 바로 시작하고(onStart), 응시한 회차는 마지막 점수를 보여 준다.
export default function MockSheet({ exams, onStart, onClose }) {
  return (
    <Sheet open onClose={onClose} title="모의고사">
      <p className={s.hint}>회차를 누르면 바로 시작해요</p>
      {exams.map((m) => (
        <button
          key={m.id}
          type="button"
          className={s.card}
          onClick={() => onStart(m.id)}
          disabled={m.questions === 0}
        >
          <span className={s.col}>
            <span className={s.title}>{m.title}</span>
            <span className={s.meta}>
              {m.questions}문항{m.minutes > 0 && ` · ${m.minutes}분`}
            </span>
          </span>
          {m.score !== null ? <span className={s.score}>{m.score}점</span> : <span className={s.start}>응시하기</span>}
          <ChevronRight size={18} strokeWidth={2.2} className={s.chev} aria-hidden="true" />
        </button>
      ))}
    </Sheet>
  )
}
