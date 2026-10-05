import { useReducer, useState } from 'react'
import { ChevronRight, Search } from 'lucide-react'
import Sheet from '../../components/Sheet.jsx'
import { addFriend, getRoster, removeFriend } from '../../store/dongi.js'
import Avatar from './Avatar.jsx'
import s from './Sheets.module.css'

// 동기 관리: 이름이나 Los로 찾고, 내 동기는 '삭제', 아직 등록하지 않은 동기는 '추가 >'.
// onChange: 등록이 바뀌면 동기들 화면을 다시 그린다, onToast: 추가했다는 안내
export default function ManageSheet({ onClose, onChange, onToast }) {
  const [query, setQuery] = useState('')
  const [, refresh] = useReducer((n) => n + 1, 0)
  const roster = getRoster()
  const q = query.trim()
  const match = (p) => !q || p.name.includes(q) || p.los.toLowerCase().includes(q.toLowerCase())
  const myCount = roster.filter((p) => p.registered).length
  const mine = roster.filter((p) => p.registered && match(p))
  const others = roster.filter((p) => !p.registered && match(p))

  const add = (p) => {
    addFriend(p.id)
    refresh()
    onChange()
    onToast(`${p.name} 님을 동기로 추가했어요`)
  }

  const del = (p) => {
    removeFriend(p.id)
    refresh()
    onChange()
  }

  const line = (p, action) => (
    <div key={p.id} className={s.row}>
      <Avatar person={p} size={40} />
      <span className={s.who}>
        <span className={s.name}>{p.name}</span>
        <span className={s.sub}>
          {p.los} · 1년차 · 전체 진도 {p.pct}%
        </span>
      </span>
      {action === 'del' ? (
        <button type="button" className={`${s.act} ${s.del}`} onClick={() => del(p)} aria-label={`${p.name} 삭제`}>
          삭제
        </button>
      ) : (
        <button type="button" className={s.act} onClick={() => add(p)} aria-label={`${p.name} 추가`}>
          추가
          <ChevronRight size={16} strokeWidth={2.2} className={s.chev} aria-hidden="true" />
        </button>
      )}
    </div>
  )

  return (
    <Sheet open onClose={onClose} title="동기 관리">
      <label className={s.search}>
        <Search size={20} strokeWidth={2.2} aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="이름이나 Los로 찾기"
          aria-label="동기 찾기"
          autoComplete="off"
        />
      </label>
      <section className={s.group}>
        <h3 className={s.groupTitle}>내 동기 {myCount}명</h3>
        {mine.length > 0 ? mine.map((p) => line(p, 'del')) : <p className={s.hint}>찾는 동기가 없어요</p>}
      </section>
      <section className={s.group}>
        <h3 className={s.groupTitle}>동기 찾기</h3>
        {others.length > 0 ? others.map((p) => line(p, 'add')) : <p className={s.hint}>더 추가할 동기가 없어요</p>}
      </section>
    </Sheet>
  )
}
