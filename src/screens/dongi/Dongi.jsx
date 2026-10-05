import { useEffect, useReducer, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronRight } from 'lucide-react'
import { APP_NAME, TABS } from '../../config.js'
import { getPeople, getPoke, getQuizConfig, getQuizQuestions, isPoked, markPoked } from '../../store/dongi.js'
import Avatar from './Avatar.jsx'
import ManageSheet from './ManageSheet.jsx'
import GameSheet from './GameSheet.jsx'
import PokeSheet from './PokeSheet.jsx'
import SpeedQuiz from './SpeedQuiz.jsx'
import pokeImg from '../../assets/dongi/poke.png'
import pwcLogo from '../../assets/brand/pwc.png'
import s from './Dongi.module.css'

const TITLE = TABS.find((t) => t.id === 'dongi')?.label ?? '동기들'
const TOAST_MS = 1800
const PUSH_MS = 3500

// 동기들: 등록한 동기와 나의 전체 진도(높은 순), 관리(추가, 삭제), 동기들과 스피드 퀴즈, 접속하지 않은 동기 찌르기.
// 접속 중인 동기는 얼굴 테두리가 얼굴 색으로 숨 쉬듯 빛나고 진도 바에 빛이 지나간다.
// 동기들의 진도, 접속 여부, 상대의 답은 store/dongi.js의 가상 값이다(MY 공지사항에 밝힌다).
// 찌르면 사진이 잠깐 떴다가 사라지고, 그 동기 휴대폰에 갈 알림의 예시를 위에 보여 준다(실제로 보내지는 않는다).
export default function Dongi() {
  const [sheet, setSheet] = useState(null) // 'manage' | 'game' | { poke: 사람 }
  const [quiz, setQuiz] = useState(null) // { players, questions, run }
  const [flash, setFlash] = useState(null) // 사진을 띄우는 동안 찌른 동기 이름
  const [push, setPush] = useState(null) // 알림 예시에 쓸 찌른 동기 이름
  const [toast, setToast] = useState(null) // { id, text }
  const [, refresh] = useReducer((n) => n + 1, 0)
  const seq = useRef(0) // 퀴즈 판, 안내 글을 구분하는 번호
  const people = getPeople()
  const friends = people.filter((p) => !p.me)
  const config = getQuizConfig()
  const poke = getPoke()
  const root = document.getElementById('sheet-root')

  // 찌른 사진이 끝나면 안내와 알림 예시
  useEffect(() => {
    if (!flash) return undefined
    const name = flash
    const id = setTimeout(() => {
      setFlash(null)
      setToast({ id: (seq.current += 1), text: `${name} 님을 푹 찔렀어요` })
      setPush(name)
    }, poke.imageMs)
    return () => clearTimeout(id)
  }, [flash, poke.imageMs])

  useEffect(() => {
    if (!toast) return undefined
    const id = setTimeout(() => setToast(null), TOAST_MS)
    return () => clearTimeout(id)
  }, [toast])

  useEffect(() => {
    if (!push) return undefined
    const id = setTimeout(() => setPush(null), PUSH_MS)
    return () => clearTimeout(id)
  }, [push])

  const startQuiz = (ids) => {
    const byId = new Map(friends.map((p) => [p.id, p]))
    const me = people.find((p) => p.me)
    setSheet(null)
    setQuiz({
      players: [me, ...ids.map((id) => byId.get(id)).filter(Boolean)],
      questions: getQuizQuestions(config.rounds),
      run: (seq.current += 1),
    })
  }

  const again = () => setQuiz((q) => ({ ...q, questions: getQuizQuestions(config.rounds), run: (seq.current += 1) }))

  const doPoke = (p) => {
    if (isPoked(p.id)) return
    markPoked(p.id)
    setSheet(null)
    setFlash(p.name)
  }

  return (
    <div className={s.screen}>
      <div className={s.scroll}>
        <header className={s.head}>
          <h1 className={s.title}>{TITLE}</h1>
          <button type="button" className={s.textBtn} onClick={() => setSheet('manage')}>
            관리
            <ChevronRight size={18} strokeWidth={2.2} className={s.chev} aria-hidden="true" />
          </button>
        </header>

        <section className={s.card} aria-label="동기들 전체 진도">
          <div className={s.cardHead}>
            <h2 className={s.cardTitle}>전체 진도</h2>
            <span className={s.cardMeta}>동기 {friends.length}명</span>
          </div>
          {friends.length > 0 ? (
            <ol className={s.list}>
              {people.map((p, k) => (
                <PersonRow key={p.id} person={p} rank={k + 1} onPoke={() => setSheet({ poke: p })} />
              ))}
            </ol>
          ) : (
            <p className={s.empty}>아직 추가한 동기가 없어요</p>
          )}
        </section>

        <button type="button" className={s.game} onClick={() => setSheet('game')}>
          동기들과 스피드 퀴즈 뜨기
        </button>
      </div>

      {sheet === 'manage' && (
        <ManageSheet
          onClose={() => setSheet(null)}
          onChange={refresh}
          onToast={(text) => setToast({ id: (seq.current += 1), text })}
        />
      )}
      {sheet === 'game' && (
        <GameSheet friends={friends} config={config} onStart={startQuiz} onClose={() => setSheet(null)} />
      )}
      {sheet?.poke && (
        <PokeSheet
          person={sheet.poke}
          poke={poke}
          done={isPoked(sheet.poke.id)}
          onPoke={() => doPoke(sheet.poke)}
          onClose={() => setSheet(null)}
        />
      )}
      {quiz && (
        <SpeedQuiz
          key={quiz.run}
          players={quiz.players}
          questions={quiz.questions}
          config={config}
          onExit={() => setQuiz(null)}
          onAgain={again}
        />
      )}

      {root &&
        createPortal(
          <>
            {flash && (
              <div className={s.pokeFx} aria-hidden="true">
                <img src={pokeImg} alt="" />
              </div>
            )}
            {push && (
              <div className={s.push} role="status">
                <p className={s.pushHead}>
                  <img src={pwcLogo} alt="" />
                  {APP_NAME} · 지금
                </p>
                <p className={s.pushTitle}>동기가 푹 찔렀어요</p>
                <p className={s.pushText}>{poke.message}</p>
                <p className={s.pushNote}>{push} 님 휴대폰에 가는 알림 예시</p>
              </div>
            )}
            {toast && (
              <p key={toast.id} className={s.toast} role="status">
                {toast.text}
              </p>
            )}
          </>,
          root,
        )}
    </div>
  )
}

// 동기 한 줄. 접속하지 않은 동기는 줄 전체가 버튼이라 누르면 찌르기 창이 열린다
function PersonRow({ person: p, rank, onPoke }) {
  const off = !p.me && !p.online
  const cls = [s.row, p.me && s.me, p.online && s.online].filter(Boolean).join(' ')
  const inner = (
    <>
      <span className={s.rowTop}>
        <span className={rank === 1 ? `${s.rank} ${s.rankTop}` : s.rank}>{rank}</span>
        <Avatar person={p} size={30} ring={p.online} />
        <span className={s.who}>
          <span className={s.name}>{p.name}</span>
          {p.los && <span className={s.los}>{p.los}</span>}
        </span>
        <span className={s.pct}>{p.pct}%</span>
      </span>
      <span className={s.bar} aria-hidden="true">
        <span style={{ width: `${p.pct}%` }} />
      </span>
    </>
  )
  return (
    <li className={cls}>
      {off ? (
        <button type="button" className={s.rowIn} onClick={onPoke} aria-label={`${p.name} ${p.pct}%, 눌러서 찌르기`}>
          {inner}
        </button>
      ) : (
        <div className={s.rowIn}>{inner}</div>
      )}
    </li>
  )
}
