import { House, Lightbulb, Swords, UserRound } from 'lucide-react'
import { TABS } from '../config.js'
import s from './TabBar.module.css'

const ICONS = { lobby: House, samchocut: Lightbulb, asurajang: Swords, my: UserRound }

// 하단 탭 4개. 이름은 config.js의 TABS에서 가져온다.
export default function TabBar({ current, onSelect }) {
  return (
    <nav className={s.bar} aria-label="주요 메뉴">
      {TABS.map((t) => {
        const Icon = ICONS[t.id]
        const on = t.id === current
        return (
          <button
            key={t.id}
            type="button"
            className={on ? `${s.tab} ${s.on}` : s.tab}
            aria-current={on ? 'page' : undefined}
            onClick={() => onSelect(t.id)}
          >
            <Icon size={24} strokeWidth={2} className={s.icon} aria-hidden="true" />
            <span>{t.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
