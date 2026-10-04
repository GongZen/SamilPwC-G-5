import { X } from 'lucide-react'
import { TABS } from '../../config.js'
import { splitMark } from './format.js'
import s from './ArenaHeader.module.css'

// 표시 이름은 config.js에서 가져온다. '아수(습)라장'의 괄호 속 글자는 동그라미 안에 그린다.
const LABEL = TABS.find((t) => t.id === 'asurajang')?.label ?? ''
const PARTS = splitMark(LABEL)

// 머리 부분: 나가기, 기능 이름과 회차. 오른쪽 칸은 제목을 가운데에 두려고 비워 둔다
export default function ArenaHeader({ subtitle, onExit }) {
  return (
    <header className={s.header}>
      <button type="button" className={s.exit} onClick={onExit} aria-label="나가기">
        <X size={24} strokeWidth={2.4} aria-hidden="true" />
      </button>
      <div className={s.center}>
        <h1 className={s.title}>
          {PARTS ? (
            <>
              <span className={s.art} aria-hidden="true">
                {PARTS[0]}
                <span className={s.mark}>{PARTS[1]}</span>
                {PARTS[2]}
              </span>
              <span className={s.srOnly}>{PARTS.join('')}</span>
            </>
          ) : (
            LABEL
          )}
        </h1>
        {subtitle && <p className={s.subtitle}>{subtitle}</p>}
      </div>
      <span />
    </header>
  )
}
