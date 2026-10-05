import { useState } from 'react'
import { Check } from 'lucide-react'
import Sheet from '../../components/Sheet.jsx'
import Button3D from '../../components/Button3D.jsx'
import Avatar from './Avatar.jsx'
import s from './Sheets.module.css'

// 스피드 퀴즈 준비: 함께할 동기를 1명에서 config.maxPick명까지 고르고 시작한다(나 포함 최대 maxPick+1명).
// onStart(고른 동기 id 목록)
export default function GameSheet({ friends, config, onStart, onClose }) {
  const [picked, setPicked] = useState([])
  const full = picked.length >= config.maxPick

  const toggle = (id) =>
    setPicked((list) =>
      list.includes(id) ? list.filter((x) => x !== id) : list.length < config.maxPick ? [...list, id] : list,
    )

  return (
    <Sheet open onClose={onClose} title="스피드 퀴즈">
      <div className={s.chips}>
        <span className={s.chip}>{config.rounds}문제</span>
        <span className={s.chip}>문제당 {config.seconds}초</span>
        <span className={s.chip}>정답 100점 + 빠를수록 최대 50점</span>
      </div>
      <section className={s.group}>
        <h3 className={s.groupTitle}>
          함께할 동기 {picked.length}/{config.maxPick}
        </h3>
        {friends.length > 0 ? (
          friends.map((p) => {
            const on = picked.includes(p.id)
            return (
              <button
                key={p.id}
                type="button"
                className={on ? `${s.pick} ${s.pickOn}` : s.pick}
                aria-pressed={on}
                disabled={!on && full}
                onClick={() => toggle(p.id)}
              >
                <span className={s.box} aria-hidden="true">
                  {on && <Check size={14} strokeWidth={3.5} />}
                </span>
                <Avatar person={p} size={30} />
                <span className={s.who}>
                  <span className={s.name}>{p.name}</span>
                  <span className={s.sub}>
                    {p.los} · 전체 진도 {p.pct}%
                  </span>
                </span>
              </button>
            )
          })
        ) : (
          <p className={s.hint}>먼저 관리에서 동기를 추가해 주세요</p>
        )}
      </section>
      <Button3D disabled={picked.length === 0} onClick={() => onStart(picked)}>
        {picked.length > 0 ? `${picked.length + 1}명이서 시작하기` : '동기를 1명 이상 골라 주세요'}
      </Button3D>
    </Sheet>
  )
}
