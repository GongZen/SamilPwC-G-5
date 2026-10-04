import { useState } from 'react'
import Sheet from './Sheet.jsx'
import Button3D from './Button3D.jsx'
import s from './LoginSheet.module.css'

// 간편 로그인: 이름과 부서만 받는다. 비밀번호와 회원가입은 없다.
// 입력값은 이 기기(localStorage)에만 저장된다.
export default function LoginSheet({ open, onClose, onSubmit }) {
  const [name, setName] = useState('')
  const [dept, setDept] = useState('')
  const ready = name.trim().length > 0 && dept.trim().length > 0

  const submit = (e) => {
    e.preventDefault()
    if (!ready) return
    onSubmit(name.trim(), dept.trim())
    setName('')
    setDept('')
  }

  return (
    <Sheet open={open} onClose={onClose} title="간편 로그인">
      <form className={s.form} onSubmit={submit}>
        <p className={s.lead}>이름과 부서만 입력하면 바로 시작할 수 있어요</p>
        <label className={s.field}>
          <span className={s.label}>이름</span>
          <input
            className={s.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            autoComplete="off"
            placeholder="예: 김삼일"
          />
        </label>
        <label className={s.field}>
          <span className={s.label}>부서</span>
          <input
            className={s.input}
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            maxLength={30}
            autoComplete="off"
            placeholder="예: 감사본부"
          />
        </label>
        <p className={s.note}>입력한 정보는 이 기기에만 저장돼요</p>
        <Button3D type="submit" disabled={!ready}>
          시작하기
        </Button3D>
      </form>
    </Sheet>
  )
}
