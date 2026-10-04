import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Mascot from './Mascot.jsx'
import { mascotWidth } from './mascotSize.js'
import s from './MascotTalk.module.css'

// 말풍선이 떠 있는 시간(ms)
const SHOW_MS = 2800
// 마스코트와 말풍선 사이(10px), 말풍선과 앱 틀 끝 사이(8px)
const GAP = 10
const EDGE = 8

const NAMES = { mamashell: '마마쉘', joy: '조이' }

// 누르면 말풍선이 잠깐 떴다가 사라지는 마스코트. 누를 때마다 lines의 다음 문구를 보여 준다.
// side: 말풍선 위치 'top' | 'bottom' | 'left' | 'right'
// align: 위아래 말풍선을 마스코트의 어느 쪽 끝에 맞출지 'start' | 'center' | 'end'(화면 끝에 닿지 않는 쪽으로 고른다)
// className: 화면 안에서 마스코트 자리를 정하는 클래스.
// 말풍선은 앱 틀 맨 위 층(#sheet-root)에 그려서 스크롤 영역 끝에 잘리지 않는다. 화면을 스크롤하면 바로 닫힌다.
export default function MascotTalk({ name, size = 72, lines = [], side = 'top', align = 'center', className = '' }) {
  const btnRef = useRef(null)
  const [turn, setTurn] = useState(-1) // 지금까지 누른 횟수 - 1. 다음 문구를 고르는 데 쓴다
  const [box, setBox] = useState(null) // 말풍선을 띄울 때 잰 마스코트 자리. null이면 닫힘

  // 말풍선은 잠깐 보였다가 사라진다. 떠 있는 동안 다시 누르면 다음 문구로 바뀌고 시간이 새로 잡힌다.
  useEffect(() => {
    if (!box) return undefined
    const timer = setTimeout(() => setBox(null), SHOW_MS)
    const close = () => setBox(null)
    document.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [box, turn])

  const list = lines.filter(Boolean)
  const text = box && turn >= 0 && list.length > 0 ? list[turn % list.length] : ''

  const talk = () => {
    const root = document.getElementById('sheet-root')
    const btn = btnRef.current
    if (list.length === 0 || !root || !btn) return
    const r = btn.getBoundingClientRect()
    const base = root.getBoundingClientRect()
    // 말풍선이 앱 틀 밖으로 나가지 않도록 쓸 수 있는 폭을 잰다(좁은 휴대폰에서는 줄바꿈이 늘어난다)
    const center = r.left + r.width / 2
    let room = base.width
    if (side === 'right') room = base.right - r.right - GAP - EDGE
    else if (side === 'left') room = r.left - base.left - GAP - EDGE
    else if (align === 'end') room = r.right - base.left - EDGE
    else if (align === 'start') room = base.right - r.left - EDGE
    else room = 2 * (Math.min(center - base.left, base.right - center) - EDGE)
    setBox({
      left: r.left - base.left,
      top: r.top - base.top,
      width: r.width,
      height: r.height,
      room: Math.max(120, Math.floor(room)),
    })
    setTurn((t) => t + 1)
  }

  const root = text ? document.getElementById('sheet-root') : null
  const wrapCls = [s.wrap, className].filter(Boolean).join(' ')
  const bubbleCls = [s.bubble, s[side], s[`align-${align}`]].filter(Boolean).join(' ')

  return (
    <div className={wrapCls} style={{ width: mascotWidth(name, size) }}>
      <button
        ref={btnRef}
        type="button"
        className={s.btn}
        onClick={talk}
        aria-label={`${NAMES[name] ?? '마스코트'}에게 말 걸기`}
      >
        <Mascot name={name} size={size} />
      </button>
      {/* 화면 읽기 프로그램은 말풍선 대신 이 알림 글자를 읽는다 */}
      <span className={s.srOnly} role="status" aria-live="polite">
        {text}
      </span>
      {root &&
        createPortal(
          <div
            className={s.anchor}
            style={{
              left: box.left,
              top: box.top,
              width: box.width,
              height: box.height,
              '--mw': `${box.width}px`,
              '--room': `${box.room}px`,
            }}
            aria-hidden="true"
          >
            <p key={turn} className={bubbleCls}>
              {text}
            </p>
          </div>,
          root,
        )}
    </div>
  )
}
