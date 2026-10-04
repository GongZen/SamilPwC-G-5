import { useCallback, useEffect, useRef, useState } from 'react'
import { TABS } from '../../config.js'
import { useUser } from '../../store/UserContext.jsx'
import { getRound, saveResult } from '../../store/asurajang.js'
import Sheet from '../../components/Sheet.jsx'
import Button3D from '../../components/Button3D.jsx'
import {
  TICK_MS,
  countdownLeft,
  endOnExit,
  enter,
  exitNeedsConfirm,
  initGame,
  isRunning,
  leave,
  pick,
  tick,
  toResult,
} from './game.js'
import { withRo } from './format.js'
import ArenaHeader from './ArenaHeader.jsx'
import WaitingRoom from './WaitingRoom.jsx'
import Countdown from './Countdown.jsx'
import QuizPlay from './QuizPlay.jsx'
import OutResult from './OutResult.jsx'
import WinResult from './WinResult.jsx'
import s from './Asurajang.module.css'

const HOME_LABEL = `${withRo(TABS.find((t) => t.id === 'lobby')?.label ?? '처음')} 돌아가기`

// 아수(습)라장: 대기실 > 카운트다운 > 문제 풀이 > 탈락 또는 최종 생존.
// 진행 규칙은 game.js, 문항과 설정값은 store(getRound)에서 온다. 참가자는 가상 시뮬레이션이다.
export default function Asurajang({ goTo, goBack }) {
  const { requireLogin } = useUser()
  const [round] = useState(getRound)
  const [game, setGame] = useState(initGame)
  const [askId, setAskId] = useState(null) // 나가기 확인 창을 띄운 판 번호
  const savedId = useRef(0)
  const running = isRunning(game)
  const ended = game.phase === 'out' || game.phase === 'win'
  // 확인 창은 그 판에서 나가면 결과가 바뀌는 동안에만 보인다. 판이 끝나거나 결과가 정해지면 저절로 닫힌다
  const askOpen = Boolean(round) && askId === game.id && exitNeedsConfirm(game, round)
  const closeAsk = useCallback(() => setAskId(null), [])

  // 시간 흐름: 시작 시각을 기준으로 다시 계산한다. 판이 끝나거나 화면을 떠나면 정리한다
  useEffect(() => {
    if (!round || !running) return undefined
    const id = setInterval(() => {
      const now = Date.now()
      const hidden = document.hidden
      setGame((g) => tick(g, round, now, hidden))
    }, TICK_MS)
    return () => clearInterval(id)
  }, [round, running])

  // 화면 이탈 탈락(설정 leaveEliminates가 true일 때만)
  useEffect(() => {
    if (!round || !running || !round.config.leaveEliminates) return undefined
    const onVisibility = () => {
      if (!document.hidden) return
      const now = Date.now()
      setGame((g) => leave(g, now))
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [round, running])

  // 판이 끝나면 결과를 한 번만 저장한다
  useEffect(() => {
    if (!round || !ended || savedId.current === game.id) return
    savedId.current = game.id
    saveResult(toResult(game, round))
  }, [round, ended, game])

  const start = (practice) => {
    const now = Date.now()
    setGame((g) => enter(g, round, now, practice))
  }

  const onEnter = () => requireLogin(() => start(false))
  const onRetry = () => start(true)

  const onPick = (index) => {
    const now = Date.now()
    setGame((g) => pick(g, round, index, now))
  }

  // 진행 중에 나가면 그 판은 화면 이탈로 기록한다(정답 공개 중이면 그 결과대로)
  const exitNow = () => {
    if (round && running) {
      const last = endOnExit(game, round, Date.now())
      if (last && savedId.current !== last.id) {
        savedId.current = last.id
        saveResult(toResult(last, round))
      }
    }
    goBack()
  }

  // 실전 판 도중에는 실수로 눌러 탈락하지 않게 먼저 묻는다. 묻는 동안에도 시간은 흐른다
  const onExit = () => {
    if (round && exitNeedsConfirm(game, round)) {
      setAskId(game.id)
      return
    }
    exitNow()
  }

  const toHome = () => goTo('lobby')

  let body
  if (!round) {
    body = <p className={s.empty}>퀴즈를 준비하고 있어요</p>
  } else if (game.phase === 'lobby') {
    body = <WaitingRoom round={round} onEnter={onEnter} />
  } else if (game.phase === 'ready') {
    body = (
      <Countdown
        seconds={countdownLeft(game, round)}
        participants={game.participants}
        leaveEliminates={round.config.leaveEliminates}
      />
    )
  } else if (game.phase === 'play') {
    body = <QuizPlay game={game} round={round} onPick={onPick} />
  } else if (game.phase === 'out') {
    body = (
      <OutResult game={game} round={round} onRetry={onRetry} onHome={toHome} homeLabel={HOME_LABEL} />
    )
  } else {
    body = <WinResult game={game} round={round} onHome={toHome} homeLabel={HOME_LABEL} />
  }

  return (
    <div className={s.screen}>
      <ArenaHeader subtitle={game.practice ? '연습 모드' : round?.subtitle} onExit={onExit} />
      {body}
      <Sheet open={askOpen} onClose={closeAsk} title="지금 나갈까요?" showClose={false}>
        <p className={s.askText}>
          {round?.config.leaveEliminates
            ? '나가면 이 판은 화면 이탈 탈락으로 기록돼요.'
            : '나가면 이 판은 여기서 끝나요.'}{' '}
          이 창이 떠 있는 동안에도 시간은 계속 흘러요.
        </p>
        <div className={s.askActions}>
          <Button3D onClick={closeAsk}>계속하기</Button3D>
          <button type="button" className={s.askLeave} onClick={exitNow}>
            그만두고 나가기
          </button>
        </div>
      </Sheet>
    </div>
  )
}
