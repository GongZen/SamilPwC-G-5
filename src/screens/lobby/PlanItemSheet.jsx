import { useState } from 'react'
import Sheet from '../../components/Sheet.jsx'
import Button3D from '../../components/Button3D.jsx'
import s from './PlanItemSheet.module.css'

// 진도 계획의 '오늘 할 일' 한 줄을 직접 쓰거나 고친다. 간편 로그인 창처럼 입력란 하나와 버튼만 둔다.
// item이 있으면 고치기(지금 글자를 채워 열고 아래에 '삭제'), 없으면 새로 추가한다.
// 진도 계획 시트 위에 겹쳐 열린다(Esc와 Tab은 맨 위 시트만 받는다).
export default function PlanItemSheet({ item, maxLength, onSubmit, onDelete, onClose }) {
  const [text, setText] = useState(item?.text ?? '')
  const ready = text.trim().length > 0

  const submit = (e) => {
    e.preventDefault()
    if (!ready) return
    onSubmit(text.trim())
  }

  return (
    <Sheet open onClose={onClose} title={item ? '할 일 수정' : '할 일 추가'}>
      <form className={s.form} onSubmit={submit}>
        <label className={s.field}>
          <span className={s.label}>할 일</span>
          <input
            className={s.input}
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={maxLength}
            autoComplete="off"
            enterKeyHint="done"
          />
        </label>
        <Button3D type="submit" disabled={!ready}>
          {item ? '저장하기' : '추가하기'}
        </Button3D>
        {item && (
          <button type="button" className={s.remove} onClick={onDelete}>
            삭제
          </button>
        )}
      </form>
    </Sheet>
  )
}
