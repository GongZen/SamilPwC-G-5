import { useEffect, useRef, useState } from 'react'
import { Crown, X } from 'lucide-react'
import Sheet from '../../components/Sheet.jsx'
import Button3D from '../../components/Button3D.jsx'
import Avatar from './Avatar.jsx'
import { botAnswer, points, rankPlayers } from './speed.js'
import s from './SpeedQuiz.module.css'

// 스피드 퀴즈(전체 화면). 아수(습)라장처럼 제한 시간이 다 지나야 정답을 공개하고,
// 정답 화면은 숫자로 세다가 revealSeconds 뒤 자동으로 다음 문제(마지막이면 결과)로 넘어간다.
// 한 번 고른 보기는 바꿀 수 없고, 속도 점수는 고른 순간까지 걸린 시간으로 계산한다. 상대의 답은 가상이다.
// players: 나(첫 번째)와 함께할 동기, questions: 문항 묶음(store가 고름), config: getQuizConfig()
export default function SpeedQuiz({ players, questions, config, onExit, onAgain }) {
  const { seconds, revealSeconds } = config
  const total = Math.min(config.rounds, questions.length)
  const [i, setI] = useState(0)
  const [phase, setPhase] = useState('ask') // 'ask' | 'reveal' | 'result'
  const [mine, setMine] = useState(null) // 내가 고른 보기 번호
  const [answered, setAnswered] = useState([]) // 이번 문제에서 이미 고른 사람 id(맞았는지는 공개 전까지 모른다)
  const [answers, setAnswers] = useState(null) // 공개된 이번 문제 결과. { id: { pick, t, correct, pts } }
  const [count, setCount] = useState(revealSeconds)
  const [totals, setTotals] = useState(() => Object.fromEntries(players.map((p) => [p.id, { pts: 0, ok: 0, time: 0 }])))
  const started = useRef(0)
  const mineRef = useRef(null)
  const q = questions[i]
  const last = i === total - 1

  // 문제가 열리면 가상 동기의 답을 정하고, 각자 고른 순간 '골랐음' 표시를 붙인다. 제한 시간이 끝나면 정답 공개
  useEffect(() => {
    if (phase !== 'ask') return undefined
    started.current = performance.now()
    mineRef.current = null
    const bots = {}
    for (const p of players) if (!p.me) bots[p.id] = botAnswer(p, questions[i], seconds)
    const timers = Object.entries(bots)
      .filter(([, a]) => a.pick !== null)
      .map(([id, a]) => setTimeout(() => setAnswered((list) => [...list, id]), a.t * 1000))
    timers.push(
      setTimeout(() => {
        const all = { ...bots, me: mineRef.current ?? { pick: null, t: seconds, correct: false } }
        const scored = Object.fromEntries(
          Object.entries(all).map(([id, a]) => [id, { ...a, pts: points(a.correct, a.t, seconds) }]),
        )
        setAnswers(scored)
        setTotals((prev) => {
          const next = { ...prev }
          for (const [id, a] of Object.entries(scored)) {
            const t = prev[id]
            next[id] = { pts: t.pts + a.pts, ok: t.ok + (a.correct ? 1 : 0), time: t.time + (a.correct ? a.t : 0) }
          }
          return next
        })
        setCount(revealSeconds)
        setPhase('reveal')
      }, seconds * 1000),
    )
    return () => timers.forEach(clearTimeout)
  }, [phase, i, players, questions, seconds, revealSeconds])

  // 정답 화면: 1초마다 숫자를 줄이고, 끝나면 다음 문제(마지막이면 결과)
  useEffect(() => {
    if (phase !== 'reveal') return undefined
    const timers = []
    for (let sec = 1; sec < revealSeconds; sec++) timers.push(setTimeout(() => setCount(revealSeconds - sec), sec * 1000))
    timers.push(
      setTimeout(() => {
        if (i + 1 >= total) {
          setPhase('result')
          return
        }
        setI(i + 1)
        setMine(null)
        setAnswered([])
        setAnswers(null)
        setPhase('ask')
      }, revealSeconds * 1000),
    )
    return () => timers.forEach(clearTimeout)
  }, [phase, i, total, revealSeconds])

  // at: 누른 순간(이벤트의 timeStamp, performance.now()와 같은 기준)
  const pick = (k, at) => {
    if (phase !== 'ask' || mine !== null) return
    const t = Math.min(seconds, Math.max(0, Math.round(((at - started.current) / 1000) * 10) / 10))
    mineRef.current = { pick: k, t, correct: k === q.a }
    setMine(k)
    setAnswered((list) => [...list, 'me'])
  }

  return (
    <Sheet open onClose={onExit} showClose={false} closeOnDim={false} ariaLabel="스피드 퀴즈" className={s.full}>
      {phase === 'result' ? (
        <Result players={players} totals={totals} total={total} onExit={onExit} onAgain={onAgain} />
      ) : (
        <>
          <div className={s.head}>
            <span aria-hidden="true" />
            <h2 className={s.title}>스피드 퀴즈</h2>
            <button type="button" className={s.close} onClick={onExit} aria-label="그만하기">
              <X size={22} strokeWidth={2.2} aria-hidden="true" />
            </button>
          </div>

          <div className={s.players} style={{ gridTemplateColumns: `repeat(${players.length}, minmax(0, 1fr))` }}>
            {players.map((p) => {
              const a = answers?.[p.id]
              const mark = a ? (a.correct ? 'ok' : 'ng') : answered.includes(p.id) ? 'done' : null
              return (
                <div key={p.id} className={p.me ? `${s.pl} ${s.plMe}` : s.pl}>
                  <Avatar person={p} size={34} mark={mark} />
                  <span className={s.plName}>{p.name}</span>
                  <span className={s.plScore}>{totals[p.id].pts}</span>
                </div>
              )
            })}
          </div>

          <div className={s.body}>
            <div className={s.meta}>
              <span>
                {i + 1} / {total}
              </span>
              {phase === 'reveal' ? (
                <span className={s.count} role="timer">
                  {last ? '결과까지' : '다음 문제까지'} <b>{count}</b>초
                </span>
              ) : (
                <span>{mine !== null ? '골랐어요' : `${seconds}초 안에 고르세요`}</span>
              )}
            </div>
            {/* 시간 막대: 문제는 주황으로, 정답 화면은 회색으로 줄어든다(단계가 바뀌면 key로 새로 그린다) */}
            <div
              key={`${i}-${phase}`}
              className={phase === 'reveal' ? `${s.timer} ${s.timerWait}` : s.timer}
              style={{ '--limit': `${phase === 'reveal' ? revealSeconds : seconds}s` }}
              aria-hidden="true"
            >
              <span />
            </div>
            <span className={s.subj}>{q.subject}</span>
            <p className={s.qText}>{q.q}</p>

            <div className={s.opts}>
              {q.o.map((o, k) => {
                let cls = s.opt
                if (answers) {
                  if (k === q.a) cls += ` ${s.optOk}`
                  else if (answers.me.pick === k) cls += ` ${s.optNg}`
                } else if (mine === k) cls += ` ${s.optPicked}`
                const who = answers ? players.filter((p) => answers[p.id]?.pick === k) : []
                return (
                  <button
                    key={k}
                    type="button"
                    className={cls}
                    disabled={phase !== 'ask' || mine !== null}
                    onClick={(e) => pick(k, e.timeStamp)}
                  >
                    <span className={s.num}>{k + 1}</span>
                    <span className={s.txt}>{o}</span>
                    {who.length > 0 && (
                      <span className={s.who}>
                        {who.map((p) => (
                          <Avatar key={p.id} person={p} size={22} />
                        ))}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {answers && (
              <div className={s.reveal} role="status">
                {[...players]
                  .sort((a, b) => answers[b.id].pts - answers[a.id].pts)
                  .map((p) => {
                    const a = answers[p.id]
                    const res = a.pick === null ? '시간 초과' : `${a.correct ? '정답' : '오답'} ${a.t.toFixed(1)}초`
                    return (
                      <div key={p.id} className={a.correct ? s.rv : `${s.rv} ${s.rvMiss}`}>
                        <Avatar person={p} size={22} />
                        <span className={s.rvName}>{p.name}</span>
                        <span className={s.rvRes}>{res}</span>
                        <span className={s.rvPts}>+{a.pts}</span>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        </>
      )}
    </Sheet>
  )
}

// 최종 순위(총점, 맞힌 수, 평균 정답 시간)
function Result({ players, totals, total, onExit, onAgain }) {
  const ranked = rankPlayers(players, totals)
  const place = ranked.findIndex((p) => p.me) + 1
  return (
    <>
      <div className={s.head}>
        <span aria-hidden="true" />
        <h2 className={s.title}>최종 순위</h2>
        <button type="button" className={s.close} onClick={onExit} aria-label="닫기">
          <X size={22} strokeWidth={2.2} aria-hidden="true" />
        </button>
      </div>
      <div className={s.resBody}>
        <p className={s.resTitle}>{place === 1 ? '1위! 동기들 중 가장 빨랐어요' : `${place}위로 마쳤어요`}</p>
        <p className={s.resSub}>정답 1개 100점, 빨리 맞힐수록 최대 50점 더</p>
        <ol className={s.podium}>
          {ranked.map((p, k) => {
            const t = totals[p.id]
            const avg = t.ok ? (t.time / t.ok).toFixed(1) : '-'
            const cls = [s.prow, k === 0 && s.first, p.me && s.prowMe].filter(Boolean).join(' ')
            return (
              <li key={p.id} className={cls}>
                <span className={s.place}>
                  {k === 0 ? <Crown size={24} strokeWidth={2.2} aria-label="1위" /> : `${k + 1}위`}
                </span>
                <Avatar person={p} size={30} />
                <span className={s.pinfo}>
                  <span className={s.pname}>{p.name}</span>
                  <span className={s.pstat}>
                    정답 {t.ok}/{total} · 평균 {avg}초
                  </span>
                </span>
                <span className={s.ppts}>
                  {t.pts}
                  <small>점</small>
                </span>
              </li>
            )
          })}
        </ol>
      </div>
      <div className={s.resFoot}>
        <Button3D tone="plain" onClick={onExit}>
          동기들로
        </Button3D>
        <Button3D onClick={onAgain}>다시 하기</Button3D>
      </div>
    </>
  )
}
