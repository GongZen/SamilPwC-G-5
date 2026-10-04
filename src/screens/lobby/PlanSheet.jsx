import { Bell, Check, ChevronRight } from 'lucide-react'
import Sheet from '../../components/Sheet.jsx'
import s from './PlanSheet.module.css'

// 진도 계획 시트. 시험까지 남은 날, 전체 진도, 오늘 할 일 체크, 학습 리마인드 설정.
// 리마인드는 설정만 저장한다(실제 알림은 보내지 않는다).
// 단계 학습과 오답 복습 항목은 끝내면 store가 자동으로 체크하고, 다른 탭에서 할 일과 직접 쓴 할 일은 직접 체크한다.
// 오늘 할 일은 직접 추가(onAdd)하고 고칠(onEdit) 수 있다. 최대 plan.max개이고, 꽉 차면 '추가' 자리에 최대 개수를 보여 준다.
// '추가', '수정'은 입체 버튼이 아니라 모의고사 시트의 '응시하기 >'와 같은 글자 버튼이다.
export default function PlanSheet({ exam, overallPct, plan, remind, onToggle, onAdd, onEdit, onToggleRemind, onClose }) {
  const canAdd = plan.items.length < plan.max
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

      <div className={s.todoHead}>
        <h3 className={s.todo}>오늘 할 일</h3>
        {canAdd ? (
          <button type="button" className={s.action} onClick={onAdd} aria-label="오늘 할 일 추가">
            추가
            <ChevronRight size={18} strokeWidth={2.2} className={s.chev} aria-hidden="true" />
          </button>
        ) : (
          <span className={s.full}>최대 {plan.max}개</span>
        )}
      </div>
      {plan.items.length > 0 && (
        <ul className={s.list}>
          {plan.items.map((p) => (
            <li key={p.id} className={s.item}>
              <button type="button" className={s.check} onClick={() => onToggle(p.id)} aria-pressed={p.done}>
                <span className={p.done ? `${s.box} ${s.boxOn}` : s.box}>
                  {p.done && <Check size={14} strokeWidth={3.5} aria-hidden="true" />}
                </span>
                <span className={p.done ? `${s.text} ${s.textDone}` : s.text}>{p.text}</span>
              </button>
              <button type="button" className={s.action} onClick={() => onEdit(p)} aria-label={`${p.text} 수정`}>
                수정
                <ChevronRight size={18} strokeWidth={2.2} className={s.chev} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <button type="button" className={s.remind} role="switch" aria-checked={remind} onClick={onToggleRemind}>
        <span className={s.remindLabel}>
          <Bell size={20} strokeWidth={2} className={s.bell} aria-hidden="true" />
          매일 21:00 학습 리마인드
        </span>
        <span className={remind ? `${s.track} ${s.trackOn}` : s.track} aria-hidden="true">
          <span className={s.knob} />
        </span>
      </button>
    </Sheet>
  )
}
