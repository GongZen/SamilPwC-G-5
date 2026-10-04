import { CircleX, EyeOff, Gift, Users } from 'lucide-react'
import { WARN_SECONDS, elapsedRatio, secondsLeft } from './game.js'
import { fmt } from './format.js'
import s from './QuizPlay.module.css'

const RADIUS = 60
const RING = 2 * Math.PI * RADIUS // 타이머 원 둘레

// 문제 풀이: 고르기 전, 답안 제출 후 대기, 마감 직전, 정답 공개(생존, 오답, 시간 초과)
export default function QuizPlay({ game, round, onPick }) {
  const { config, questions } = round
  const item = questions[game.qi]
  const total = questions.length
  const left = secondsLeft(game, round)
  const ratio = elapsedRatio(game, round)
  const pct = Math.round(((game.qi + (game.revealed ? 1 : 0)) / total) * 100)
  const locked = game.picked !== null || game.revealed

  let status = '정답이라고 생각하는 보기를 고르세요'
  let tone = ''
  if (game.revealed && game.right) {
    status = `생존! ${fmt(game.prev)}명 중 ${fmt(game.survivors)}명 통과`
    tone = s.ok
  } else if (game.revealed) {
    status = game.picked === null ? '시간 초과 · 탈락' : '오답 · 탈락'
    tone = s.ng
  } else if (game.picked !== null) {
    status = '답안 제출 완료 · 다른 참가자를 기다리는 중'
  }

  const optionClass = (i) => {
    if (game.revealed && i === item.a) return s.correct
    if (game.revealed && i === game.picked) return s.wrong
    if (i === game.picked) return s.picked
    return ''
  }

  const ringCls = [s.ring, left <= WARN_SECONDS ? s.warn : '', ratio >= 1 ? s.done : '']
    .filter(Boolean)
    .join(' ')

  return (
    <div className={s.wrap}>
      <div className={s.board}>
        <div className={s.boardRow}>
          <div className={s.stat}>
            <span className={s.statLabel}>
              <Users size={14} strokeWidth={2.2} aria-hidden="true" />
              생존자
            </span>
            <span>
              <b className={s.survivors}>{fmt(game.survivors)}</b>
              <span className={s.ofTotal}> /{fmt(game.participants)}명</span>
            </span>
          </div>
          <div className={`${s.stat} ${s.statEnd}`}>
            <span className={s.statLabel}>문제</span>
            <span className={s.count}>
              {game.qi + 1} / {total}
            </span>
          </div>
        </div>
        <div className={s.bar}>
          <div className={s.barFill} style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className={s.timerBox}>
        <div className={s.timerFit}>
          <div className={ringCls} role="timer" aria-label={`남은 시간 ${left}초`}>
            <svg viewBox="0 0 140 140" className={s.ringSvg} aria-hidden="true">
              <circle cx="70" cy="70" r={RADIUS} className={s.track} />
              <circle
                cx="70"
                cy="70"
                r={RADIUS}
                className={s.progress}
                strokeDasharray={RING}
                strokeDashoffset={RING * ratio}
              />
            </svg>
            <div className={s.ringText} aria-hidden="true">
              <span className={s.sec}>{String(left).padStart(2, '0')}</span>
              <span className={s.secUnit}>초</span>
            </div>
          </div>
        </div>
      </div>

      {item.subject && <span className={s.chip}>{item.subject}</span>}
      <p className={s.question}>{item.q}</p>

      <div className={s.options}>
        {item.o.map((text, i) => (
          <button
            key={`${game.qi}-${i}`}
            type="button"
            className={`${s.opt} ${optionClass(i)}`}
            onClick={() => onPick(i)}
            disabled={locked}
            aria-pressed={game.picked === i}
          >
            <span className={s.no}>{i + 1}</span>
            <span className={s.optText}>{text}</span>
          </button>
        ))}
      </div>

      <p className={`${s.status} ${tone}`} role="status">
        {status}
      </p>

      <div className={s.foot}>
        <span>
          <CircleX size={14} strokeWidth={2} aria-hidden="true" />
          틀리면 탈락
        </span>
        {config.leaveEliminates && (
          <span>
            <EyeOff size={14} strokeWidth={2} aria-hidden="true" />
            화면 이탈 시 탈락
          </span>
        )}
        <span>
          <Gift size={14} strokeWidth={2} aria-hidden="true" />
          최후 1인 경품
        </span>
      </div>
    </div>
  )
}
