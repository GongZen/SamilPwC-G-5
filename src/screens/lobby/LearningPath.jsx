import { useLayoutEffect, useRef } from 'react'
import { Check, Lock, Star } from 'lucide-react'
import MascotTalk from '../../components/MascotTalk.jsx'
import s from './LearningPath.module.css'

// 징검다리 학습 경로. 단계마다 왼쪽 여백을 달리해 지그재그로 놓는다(시안 값 104, 168, 112, 48, 112px).
const POS = [s.pos0, s.pos1, s.pos2, s.pos3, s.pos4]

// 지금 열 수 없는 단계를 눌렀을 때 알려 주는 말(Lobby가 토스트로 보여 준다)
const HINT = {
  waiting: '내일 열려요. 완료한 단계를 눌러 복습할 수 있어요',
  locked: '앞 단계를 끝내면 열려요',
  empty: '이 단계 문항은 준비하고 있어요',
}

// 단계 버튼 하나. 열 수 없는 단계도 눌리게 두고(aria-disabled) 누르면 이유를 알려 준다.
function StepNode({ u, onOpen, onHint }) {
  const ready = u.count > 0

  if (u.status === 'done') {
    return (
      <button
        type="button"
        className={`${s.node} ${s.nodeDone}`}
        onClick={ready ? () => onOpen(u.index) : () => onHint(HINT.empty)}
        aria-disabled={ready ? undefined : 'true'}
        aria-label={ready ? `${u.label} 완료. 눌러서 다시 풀기` : `${u.label} 완료. 문항 준비 중`}
      >
        <Check size={32} strokeWidth={3} aria-hidden="true" />
      </button>
    )
  }

  if (u.status === 'current') {
    const open = ready && !u.waiting
    let label = `${u.label} 학습 시작`
    if (u.waiting) label = `${u.label} 내일 오픈`
    else if (!ready) label = `${u.label} 문항 준비 중`
    return (
      <button
        type="button"
        className={open ? `${s.node} ${s.nodeCurrent}` : `${s.node} ${s.nodeCurrent} ${s.nodeWaiting}`}
        onClick={open ? () => onOpen(u.index) : () => onHint(u.waiting ? HINT.waiting : HINT.empty)}
        aria-disabled={open ? undefined : 'true'}
        aria-label={label}
      >
        <Star size={34} strokeWidth={1.5} className={s.star} aria-hidden="true" />
      </button>
    )
  }

  return (
    <button
      type="button"
      className={`${s.node} ${s.nodeLocked}`}
      onClick={() => onHint(HINT.locked)}
      aria-disabled="true"
      aria-label={`${u.label} 잠김`}
    >
      <Lock size={28} strokeWidth={2.2} aria-hidden="true" />
    </button>
  )
}

function bubbleTip(u) {
  if (u.waiting) return '내일 학습 오픈'
  return u.count > 0 ? `오늘 학습 ${u.count}문` : '문항 준비 중'
}

// 마스코트(마마쉘)는 '지금 단계' 줄(모두 끝냈으면 마지막 줄)의 오른쪽 위에 둔다(마스코트 배치판에서 정한 자리).
// 자동 스크롤이 그 줄을 늘 보이게 하므로 화면 높이와 상관없이 첫 화면에 보이고, 스크롤하면 단계와 함께 움직인다.
// 마마쉘을 누르면 말풍선으로 mascotLines를 차례로 말한다.
// 문항이 아직 없는 과목(subject.ready가 false)은 단계 대신 '준비 중' 안내를 보여 준다.
export default function LearningPath({ subject, units, mascotLines, onOpen, onHint }) {
  const boxRef = useRef(null)
  const focusRef = useRef(null)

  const current = units.find((u) => u.status === 'current')
  const focusIndex = current ? current.index : units.length - 1
  const waiting = Boolean(current?.waiting)

  // 과목을 바꾸거나 진도가 바뀌면 맨 위에서 시작해, 지금 단계가 보일 만큼만 내린다
  useLayoutEffect(() => {
    const box = boxRef.current
    const row = focusRef.current
    if (!box || !row) return
    const rowBottom = row.offsetTop + row.offsetHeight + 16 // 단계 버튼 아래 입체 면과 여유
    box.scrollTop = Math.max(0, rowBottom - box.clientHeight)
  }, [subject.id, focusIndex, waiting])

  if (!subject.ready || units.length === 0) {
    return (
      <div ref={boxRef} className={`${s.path} ${s.pathSoon}`}>
        <div className={s.soon}>
          <MascotTalk name="mamashell" size={78} lines={mascotLines} side="top" align="center" />
          <p className={s.soonTitle}>{subject.name} 문항은 준비 중이에요</p>
          <p className={s.soonSub}>다른 과목을 먼저 학습해 보세요</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={boxRef} className={s.path}>
      <ol className={s.list} aria-label="학습 단계">
        {units.map((u) => {
          const isCurrent = u.status === 'current'
          const rowCls = [s.row, POS[u.index % POS.length], isCurrent ? s.rowCurrent : '']
            .filter(Boolean)
            .join(' ')
          return (
            <li key={u.index} ref={u.index === focusIndex ? focusRef : undefined} className={rowCls}>
              <div className={s.nodeWrap}>
                {isCurrent && (
                  <div className={s.bubble} aria-hidden="true">
                    <p className={s.bubbleLabel}>{u.label}</p>
                    <p className={s.bubbleTip}>{bubbleTip(u)}</p>
                  </div>
                )}
                <StepNode u={u} onOpen={onOpen} onHint={onHint} />
              </div>

              {!isCurrent && (
                <span className={u.status === 'locked' ? `${s.side} ${s.sideLocked}` : s.side}>{u.label}</span>
              )}

              {u.index === focusIndex && (
                <MascotTalk
                  name="mamashell"
                  size={78}
                  lines={mascotLines}
                  side="top"
                  align="end"
                  className={s.mascot}
                />
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
