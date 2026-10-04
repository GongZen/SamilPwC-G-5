import { useState } from 'react'
import Sheet from './Sheet.jsx'
import Button3D from './Button3D.jsx'
import s from './LoginSheet.module.css'

// 간편 로그인: 이름과 Los(소속, 코드에서는 dept)만 받는다. 비밀번호와 회원가입은 없다.
// 입력값은 이 기기(localStorage)에만 저장된다(안내는 MY 공지사항에 있다). 창에는 입력란 두 개와 시작하기 버튼만 둔다.
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
        <label className={s.field}>
          <span className={s.label}>이름</span>
          <input
            className={s.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            autoComplete="off"
          />
        </label>
        <label className={s.field}>
          <span className={s.label}>Los</span>
          <input
            className={s.input}
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            maxLength={30}
            autoComplete="off"
          />
        </label>
        <Button3D type="submit" disabled={!ready}>
          시작하기
        </Button3D>
      </form>
    </Sheet>
  )
}
