import { useEffect, useRef, useState } from 'react'
import { Star, X } from 'lucide-react'
import { TABS } from '../../config.js'
import Sheet from '../../components/Sheet.jsx'
import Button3D from '../../components/Button3D.jsx'
import { addWrongNote, saveLessonResult, saveMockResult } from '../../store/lobby.js'
import s from './LessonSheet.module.css'

function scrollBehavior() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
}

// 받침에 맞춰 '로' 또는 '으로'를 붙인다. 예: 삼일 끝내기 > 삼일 끝내기로
function withRo(word) {
  const code = word.charCodeAt(word.length - 1) - 0xac00
  if (!(code >= 0 && code <= 11171)) return `${word}로`
  const last = code % 28 // 0: 받침 없음, 8: ㄹ 받침
  return last === 0 || last === 8 ? `${word}로` : `${word}으로`
}

// 완료 화면 버튼. 탭 이름은 config.js에서 가져온다(시안 문구 '로비로 돌아가기'를 실제 탭 이름으로)
const LOBBY = TABS.find((t) => t.id === 'lobby')?.label || ''
const BACK_LABEL = LOBBY ? `${withRo(LOBBY)} 돌아가기` : '돌아가기'

// 단계 학습 시트. 보기 선택, 확인(채점, 틀리면 오답노트 저장), 다음 문제, 결과 순서로 진행한다.
// lesson은 store의 getLesson() 또는 getMockLesson() 결과다. 열 때마다 새로 그린다(Lobby에서 key로 구분).
// 모의고사(kind 'mock')는 문항마다 과목이 다르고, 진도와 연속 학습일 대신 회차 점수를 저장한다.
export default function LessonSheet({ lesson, onClose, onChange }) {
  const [qi, setQi] = useState(0)
  const [picked, setPicked] = useState(null)
  const [checked, setChecked] = useState(false)
  const [correct, setCorrect] = useState(0)
  const [result, setResult] = useState(null)
  const bodyRef = useRef(null)

  const total = lesson.questions.length
  const item = lesson.questions[Math.min(qi, total - 1)]
  const itemSubject = item.subject || lesson.subjectName
  const isMock = lesson.kind === 'mock'
  const isRight = checked && picked === item.a
  const isLast = qi + 1 >= total
  const pct = result ? 100 : Math.round(((qi + (checked ? 1 : 0)) / total) * 100)

  // 새 문제는 맨 위부터, 채점하면 해설과 다음 버튼이 보이게 아래로
  useEffect(() => {
    const box = bodyRef.current
    if (!box) return
    if (checked) box.scrollTo({ top: box.scrollHeight, behavior: scrollBehavior() })
    else box.scrollTop = 0
  }, [qi, checked])

  const check = () => {
    if (picked === null || checked) return
    setChecked(true)
    if (picked === item.a) {
      setCorrect((n) => n + 1)
      return
    }
    addWrongNote({
      subject: itemSubject,
      q: item.q,
      mine: item.o[picked],
      ans: item.o[item.a],
      ex: item.ex,
    })
    onChange?.()
  }

  const next = () => {
    if (!checked) return
    if (!isLast) {
      setQi(qi + 1)
      setPicked(null)
      setChecked(false)
      return
    }
    if (isMock) {
      const mock = saveMockResult(lesson.mockId, { correct, total })
      setResult({ streak: null, score: mock ? mock.score : null })
    } else {
      const saved = saveLessonResult(lesson.subjectId, { correct, total, nodeIndex: lesson.nodeIndex })
      setResult(saved || { streak: null })
    }
    onChange?.()
  }

  return (
    <Sheet open onClose={onClose} showClose={false} closeOnDim={false} ariaLabel={`${lesson.nodeLabel} 학습`}>
      <div className={s.head}>
        <button type="button" className={s.close} onClick={onClose} aria-label="학습 닫기">
          <X size={22} strokeWidth={2.2} aria-hidden="true" />
        </button>
        <div
          className={s.bar}
          role="progressbar"
          aria-label="학습 진행"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
        >
          <div className={s.fill} style={{ width: `${pct}%` }} />
        </div>
        <span className={s.count}>
          {Math.min(qi + 1, total)}/{total}
        </span>
      </div>

      {result ? (
        <div className={s.done}>
          <div className={s.doneBadge}>
            <Star size={40} strokeWidth={1.5} className={s.doneStar} aria-hidden="true" />
          </div>
          <h2 className={s.doneTitle}>
            {lesson.nodeLabel} {lesson.review ? '복습 완료!' : '완료!'}
          </h2>
          <p className={s.doneText}>
            {total}문제 중 <b>{correct}문제</b> 정답
            {correct < total && ' · 틀린 문제는 오답노트에 저장했어요'}
          </p>
          {result.streak !== null && <p className={s.doneStreak}>연속 학습 {result.streak}일째</p>}
          {isMock && Number.isFinite(result.score) && <p className={s.doneNote}>점수 {result.score}점</p>}
          <Button3D className={s.doneBtn} onClick={onClose}>
            {BACK_LABEL}
          </Button3D>
        </div>
      ) : (
        <>
          <div ref={bodyRef} className={s.body}>
            <div className={s.chips}>
              <span className={s.chipSubject}>{itemSubject}</span>
              <span className={s.chipNode}>{lesson.nodeLabel}</span>
              {lesson.review && <span className={s.chipNode}>복습</span>}
            </div>

            <p className={s.question}>{item.q}</p>

            <div className={s.options}>
              {item.o.map((text, i) => {
                let tone = ''
                if (!checked && picked === i) tone = s.optPicked
                if (checked && i === item.a) tone = s.optRight
                if (checked && picked === i && i !== item.a) tone = s.optWrong
                return (
                  <button
                    key={i}
                    type="button"
                    className={tone ? `${s.option} ${tone}` : s.option}
                    onClick={() => setPicked(i)}
                    disabled={checked}
                    aria-pressed={picked === i}
                  >
                    <span className={s.no}>{i + 1}</span>
                    <span className={s.optionText}>{text}</span>
                  </button>
                )
              })}
            </div>

            {checked && (
              <div className={isRight ? `${s.feedback} ${s.feedbackRight}` : `${s.feedback} ${s.feedbackWrong}`} role="status">
                <p className={s.feedbackTitle}>{isRight ? '정답이에요!' : '아쉬워요 · 오답노트에 저장했어요'}</p>
                <p className={s.feedbackText}>{item.ex}</p>
                {item.source && <p className={s.source}>출처 · {item.source}</p>}
              </div>
            )}
          </div>

          <div className={s.foot}>
            {checked ? (
              <Button3D onClick={next}>{isLast ? '결과 보기' : '다음 문제'}</Button3D>
            ) : (
              <Button3D onClick={check} disabled={picked === null}>
                확인
              </Button3D>
            )}
          </div>
        </>
      )}
    </Sheet>
  )
}
