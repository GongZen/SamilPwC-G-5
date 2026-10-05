import { Check, X } from 'lucide-react'
import s from './Avatar.module.css'

// 동기 얼굴: 이름 첫 글자를 색 동그라미에 쓴다(나는 '나'). 색은 명단 순서대로 돌려 쓴다.
// ring: 접속 중이면 테두리가 얼굴 색으로 숨 쉬듯 빛난다
// mark: 'ok'(정답) | 'ng'(오답) | 'done'(골랐음, 맞았는지는 아직 모름) | null
const COLORS = ['#C2410C', '#0F766E', '#7C3AED', '#2563EB', '#DB2777', '#B45309']
const ME_COLOR = '#9A3412'

export default function Avatar({ person, size = 30, ring = false, mark = null }) {
  const color = person.me ? ME_COLOR : COLORS[Math.max(0, person.color) % COLORS.length]
  const cls = ring ? `${s.avatar} ${s.ring}` : s.avatar
  return (
    <span className={cls} style={{ '--c': color, '--size': `${size}px` }} aria-hidden="true">
      {person.me ? '나' : person.name.slice(0, 1)}
      {mark && (
        <span className={`${s.mark} ${s[mark]}`}>
          {mark === 'ok' && <Check size={10} strokeWidth={4} />}
          {mark === 'ng' && <X size={10} strokeWidth={4} />}
        </span>
      )}
    </span>
  )
}
