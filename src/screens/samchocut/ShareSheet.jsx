import { useId, useState } from 'react'
import Sheet from '../../components/Sheet.jsx'
import Button3D from '../../components/Button3D.jsx'
import { LIMITS, parseKeys } from '../../store/samchocut.js'
import s from './ShareSheet.module.css'

// '내 암기법 공유' 시트. 과목, 주제, 키워드, 한 줄 설명을 받는다.
// 주제와 키워드를 넣어야 공유하기가 켜진다. 닫았다 다시 열면 쓰던 내용이 남아 있다.
// onSubmit(값)이 true를 돌려주면(저장 성공) 입력란을 비운다.
// defaultSubject: 처음 골라져 있는 과목(목록에 없으면 첫 과목)
export default function ShareSheet({ open, subjects, defaultSubject, onClose, onSubmit }) {
  const [subject, setSubject] = useState(subjects.includes(defaultSubject) ? defaultSubject : (subjects[0] ?? ''))
  const [title, setTitle] = useState('')
  const [keysText, setKeysText] = useState('')
  const [line, setLine] = useState('')
  const subjectLabelId = useId()

  const keys = parseKeys(keysText)
  const ready = title.trim().length > 0 && keys.length > 0

  // 휴대폰 키보드의 '다음'(Enter)은 바로 공유하지 않고 다음 입력란으로 옮긴다.
  // 한글 조합 중에 누른 Enter는 글자 확정용이라 건드리지 않는다.
  const toNext = (e) => {
    if (e.key !== 'Enter' || e.nativeEvent.isComposing) return
    e.preventDefault()
    const fields = [...e.currentTarget.form.querySelectorAll('input')]
    fields[fields.indexOf(e.currentTarget) + 1]?.focus()
  }

  const submit = (e) => {
    e.preventDefault()
    if (!ready) return
    const ok = onSubmit({ subject, title: title.trim(), keys, line: line.trim() })
    if (ok) {
      setTitle('')
      setKeysText('')
      setLine('')
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="내 암기법 공유">
      <form className={s.form} onSubmit={submit}>
        <div className={s.field}>
          <span id={subjectLabelId} className={s.label}>
            과목
          </span>
          <div className={s.subjects} role="group" aria-labelledby={subjectLabelId}>
            {subjects.map((name) => (
              <button
                key={name}
                type="button"
                className={subject === name ? `${s.subject} ${s.subjectOn}` : s.subject}
                aria-pressed={subject === name}
                onClick={() => setSubject(name)}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        <label className={s.field}>
          <span className={s.label}>주제</span>
          <input
            className={s.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={toNext}
            maxLength={LIMITS.title}
            autoComplete="off"
            enterKeyHint="next"
            placeholder="예: 수익인식 5단계"
          />
        </label>

        <label className={s.field}>
          <span className={s.label}>암기 키워드 · 띄어쓰기로 구분</span>
          <input
            className={s.input}
            value={keysText}
            onChange={(e) => setKeysText(e.target.value)}
            onKeyDown={toNext}
            maxLength={LIMITS.keys}
            autoComplete="off"
            enterKeyHint="next"
            placeholder="예: 계 수 가 배 인"
          />
        </label>

        <label className={s.field}>
          <span className={s.label}>한 줄 설명</span>
          <input
            className={s.input}
            value={line}
            onChange={(e) => setLine(e.target.value)}
            maxLength={LIMITS.line}
            autoComplete="off"
            enterKeyHint="done"
            placeholder="예: 계약부터 수익 인식까지 순서대로"
          />
        </label>

        {keys.length > 0 && (
          <ul className={s.preview} aria-label="키워드 미리보기">
            {keys.map((k, i) => (
              <li key={`${i}-${k}`} className={s.previewKey}>
                {k}
              </li>
            ))}
          </ul>
        )}

        <Button3D type="submit" disabled={!ready}>
          공유하기
        </Button3D>
      </form>
    </Sheet>
  )
}
