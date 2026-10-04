import { X } from 'lucide-react'
import Sheet from '../../components/Sheet.jsx'
import Card from '../../components/Card.jsx'
import s from './WrongNoteSheet.module.css'

// 오답노트 시트. '복습 완료'를 누르면 목록에서 지운다.
// 제목 옆 숫자를 오렌지로 칠하려고 머리 부분을 직접 그린다.
// 처음 접속할 때 넣은 시연용 예시 오답(sample)에는 과목 옆에 '예시'를 붙인다.
export default function WrongNoteSheet({ notes, onClear, onClose }) {
  return (
    <Sheet open onClose={onClose} surface="bg" showClose={false} ariaLabel="오답노트">
      <div className={s.head}>
        <h2 className={s.title}>
          오답노트 <span className={s.count}>{notes.length}</span>
        </h2>
        <button type="button" className={s.close} onClick={onClose} aria-label="닫기">
          <X size={22} strokeWidth={2.2} aria-hidden="true" />
        </button>
      </div>

      <div className={s.list}>
        {notes.map((w) => (
          <Card as="article" key={w.id} className={s.item}>
            <span className={s.chips}>
              <span className={s.chip}>{w.subject}</span>
              {w.sample && <span className={s.sample}>예시</span>}
            </span>
            <p className={s.q}>{w.q}</p>
            <p className={s.mine}>내 답 · {w.mine}</p>
            <p className={s.ans}>정답 · {w.ans}</p>
            <p className={s.ex}>{w.ex}</p>
            <button type="button" className={s.clear} onClick={() => onClear(w.id)}>
              복습 완료
            </button>
          </Card>
        ))}
        {notes.length === 0 && <p className={s.empty}>복습할 문항을 모두 끝냈어요!</p>}
      </div>
    </Sheet>
  )
}
