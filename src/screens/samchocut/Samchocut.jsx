import { useEffect, useId, useReducer, useRef, useState } from 'react'
import { PenLine, Search } from 'lucide-react'
import { SUBJECTS as SUBJECT_LIST, TABS } from '../../config.js'
import { useUser } from '../../store/UserContext.jsx'
import { addPost, getPost, getSubjects, listPosts, toggleLike, toggleSave } from '../../store/samchocut.js'
import MascotTalk from '../../components/MascotTalk.jsx'
import { RankCard, TopCard } from './PostCards.jsx'
import PostSheet from './PostSheet.jsx'
import ShareSheet from './ShareSheet.jsx'
import s from './Samchocut.module.css'

// 화면 제목은 config.js의 탭 이름을 쓴다
const TITLE = TABS.find((t) => t.id === 'samchocut')?.label ?? ''
const SUBJECTS = getSubjects()
const SORTS = [
  { id: 'recommend', label: '추천순', badge: '이번 주 1위' },
  { id: 'latest', label: '최신순', badge: '최신 암기법' },
]
const TOAST_MS = 2600
// 조이를 누르면 하는 말(누를 때마다 차례로)
const JOY_LINES = ['3일도 길어요! 3초면 외우죠!']
// 공유 시트에서 처음 골라져 있는 과목(시연 과목인 정보기술)
const SHARE_DEFAULT = SUBJECT_LIST.find((x) => x.id === 'it')?.name ?? ''

// 삼초컷: 선배들의 암기법 목록. 추천순·최신순 정렬, 과목 필터, 검색, 추천·저장, 내 암기법 공유.
// 목록의 글을 누르면 크게 보기 시트가 열린다. entry.post(글 id)가 있으면 그 글을 연 채로 시작한다(MY의 저장한 암기법).
export default function Samchocut({ entry }) {
  const { user, requireLogin } = useUser()
  const [openId, setOpenId] = useState(() => (entry?.post && getPost(entry.post) ? entry.post : null))
  const [sort, setSort] = useState('recommend')
  const [subject, setSubject] = useState('') // ''이면 전체 과목
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [shareOpen, setShareOpen] = useState(false)
  const [toast, setToast] = useState(0) // 0이면 숨김. 공유할 때마다 1씩 올려 타이머를 새로 건다
  const [, refresh] = useReducer((n) => n + 1, 0) // 추천·저장 뒤 목록을 다시 읽는다
  const listRef = useRef(null)
  const searchRef = useRef(null)
  const searchId = useId()

  const posts = listPosts({ sort, subject, query })
  const [top, ...rest] = posts
  const badge = SORTS.find((o) => o.id === sort)?.badge ?? ''
  // 크게 보기 중인 글. 추천·저장을 누르면 바로 다시 읽어 숫자가 바뀐다. 추천순이면 지금 목록의 순위를 배지로 보여 준다
  const opened = openId ? getPost(openId) : null
  const openedRank = posts.findIndex((p) => p.id === openId) + 1
  const openedBadge = sort === 'recommend' && openedRank > 0 ? `추천순 ${openedRank}위` : ''

  // 공유 완료 알림은 잠시 보였다가 사라진다
  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(0), TOAST_MS)
    return () => clearTimeout(timer)
  }, [toast])

  // 검색창을 열고 닫을 때마다 검색어를 비운다
  const toggleSearch = () => {
    setSearchOpen((v) => !v)
    setQuery('')
  }

  const like = (id) => {
    toggleLike(id)
    refresh()
  }

  const save = (id) => {
    toggleSave(id)
    refresh()
  }

  // 로그인이 안 돼 있으면 간편 로그인 창이 먼저 뜨고, 로그인하면 공유 시트가 이어서 열린다
  const openShare = () => requireLogin(() => setShareOpen(true))

  // 공유하면 최신순으로 바꿔 내 글을 맨 위에 보여 준다
  const share = (values) => {
    const post = addPost(values, user)
    if (!post) return false
    setShareOpen(false)
    setSort('latest')
    setSubject('')
    setQuery('')
    setToast((n) => n + 1)
    listRef.current?.scrollTo({ top: 0 })
    return true
  }

  // PC에서는 마우스 휠로도 칩 줄을 옆으로 넘길 수 있게 한다(휴대폰은 손가락으로 넘긴다)
  const wheelChips = (e) => {
    const el = e.currentTarget
    if (el.scrollWidth <= el.clientWidth || Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return
    el.scrollLeft += e.deltaY
  }

  return (
    <div className={s.screen}>
      <header className={s.head}>
        <div className={s.headText}>
          <div className={s.titleRow}>
            <h1 className={s.title}>{TITLE}</h1>
            <MascotTalk name="joy" size={48} lines={JOY_LINES} side="right" className={s.joy} />
          </div>
          <p className={s.sub}>3초 만에 떠오르는 삼일의 암기법</p>
        </div>
        <button
          type="button"
          className={s.searchBtn}
          aria-label="암기법 검색"
          aria-expanded={searchOpen}
          aria-controls={searchOpen ? searchId : undefined}
          onClick={toggleSearch}
        >
          <Search size={22} strokeWidth={2.2} aria-hidden="true" />
        </button>
      </header>

      {searchOpen && (
        <form
          id={searchId}
          role="search"
          className={s.searchWrap}
          onSubmit={(e) => {
            e.preventDefault()
            searchRef.current?.blur() // 휴대폰 키보드의 검색 키를 누르면 키보드를 내린다
          }}
        >
          <label className={s.searchBox}>
            <Search size={18} strokeWidth={2.2} className={s.searchIcon} aria-hidden="true" />
            <input
              ref={searchRef}
              type="search"
              enterKeyHint="search"
              className={s.searchInput}
              aria-label="암기법 검색어"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="주제나 키워드 (예: 개발단계)"
              autoComplete="off"
              autoFocus
            />
          </label>
        </form>
      )}

      <div className={s.chips} role="group" aria-label="정렬과 과목" onWheel={wheelChips}>
        {SORTS.map((o) => (
          <button
            key={o.id}
            type="button"
            className={sort === o.id ? `${s.chip} ${s.chipOn}` : s.chip}
            aria-pressed={sort === o.id}
            onClick={() => setSort(o.id)}
          >
            {o.label}
          </button>
        ))}
        {SUBJECTS.map((name) => (
          <button
            key={name}
            type="button"
            className={subject === name ? `${s.chip} ${s.chipOn}` : s.chip}
            aria-pressed={subject === name}
            onClick={() => setSubject((cur) => (cur === name ? '' : name))}
          >
            {name}
          </button>
        ))}
      </div>

      <div ref={listRef} className={s.list}>
        {top ? (
          <>
            <TopCard post={top} badge={badge} onLike={like} onSave={save} />
            {rest.map((p, i) => (
              <RankCard key={p.id} post={p} rank={i + 2} onLike={like} onOpen={setOpenId} />
            ))}
          </>
        ) : (
          <div className={s.empty}>
            <MascotTalk name="joy" size={64} lines={JOY_LINES} side="top" />
            <p>찾는 암기법이 없어요. 첫 번째로 공유해 보세요!</p>
          </div>
        )}
      </div>

      <button type="button" className={s.fab} onClick={openShare}>
        <PenLine size={20} strokeWidth={2.2} aria-hidden="true" />
        내 암기법 공유
      </button>

      <div className={s.toastLayer} role="status" aria-live="polite">
        {toast > 0 && <p className={s.toast}>암기법이 공유됐어요! 동기들의 추천을 기다려요</p>}
      </div>

      <PostSheet
        post={opened}
        badge={openedBadge}
        onClose={() => setOpenId(null)}
        onLike={like}
        onSave={save}
      />

      <ShareSheet
        open={shareOpen}
        subjects={SUBJECTS}
        defaultSubject={SHARE_DEFAULT}
        onClose={() => setShareOpen(false)}
        onSubmit={share}
      />
    </div>
  )
}
