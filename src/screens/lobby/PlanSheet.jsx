import { Bell, Check } from 'lucide-react'
import Sheet from '../../components/Sheet.jsx'
import s from './PlanSheet.module.css'

// 진도 계획 시트. 시험까지 남은 날, 전체 진도, 오늘 할 일 체크, 학습 리마인드 설정.
// 리마인드는 설정만 저장한다(실제 알림은 보내지 않는다).
// 단계 학습과 오답 복습 항목은 끝내면 store가 자동으로 체크하고, 다른 탭에서 할 일은 직접 체크한다.
// sampleNote: 처음 보이는 기록이 시연용 예시라는 안내를 맨 아래에 보여 줄지
export default function PlanSheet({ exam, overallPct, plan, remind, sampleNote, onToggle, onToggleRemind, onClose }) {
  return (
    <Sheet open onClose={onClose} title="진도 계획">
      <div className={s.summary}>
        <div className={s.col}>
          <span className={s.cap}>{exam.name}까지</span>
          <span className={s.dday}>{exam.dday}</span>
        </div>
        <div className={`${s.col} ${s.colRight}`}>
          <span className={s.cap}>전체 진도</span>
          <span className={s.pct}>{overallPct}%</span>
        </div>
      </div>

      <h3 className={s.todo}>오늘 할 일</h3>
      <ul className={s.list}>
        {plan.items.map((p) => (
          <li key={p.id}>
            <button type="button" className={s.item} onClick={() => onToggle(p.id)} aria-pressed={p.done}>
              <span className={p.done ? `${s.box} ${s.boxOn}` : s.box}>
                {p.done && <Check size={14} strokeWidth={3.5} aria-hidden="true" />}
              </span>
              <span className={p.done ? `${s.text} ${s.textDone}` : s.text}>{p.text}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className={s.hint}>단계 학습과 오답 복습은 끝내면 자동으로 체크돼요</p>

      <button type="button" className={s.remind} role="switch" aria-checked={remind} onClick={onToggleRemind}>
        <span className={s.remindLabel}>
          <Bell size={20} strokeWidth={2} className={s.bell} aria-hidden="true" />
          매일 21:00 학습 리마인드
        </span>
        <span className={remind ? `${s.track} ${s.trackOn}` : s.track} aria-hidden="true">
          <span className={s.knob} />
        </span>
      </button>

      {sampleNote && (
        <p className={s.hint}>처음 보이는 연속 학습일, 진도, 오답노트, 모의고사 점수는 시연용 예시 기록이에요</p>
      )}
    </Sheet>
  )
}
