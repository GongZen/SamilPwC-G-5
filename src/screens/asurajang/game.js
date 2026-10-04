// 아수(습)라장 진행 규칙. 시간을 직접 재지 않고, 화면이 넣어 준 현재 시각(now, ms)으로만 계산하는 순수 함수다.
// 흐름: lobby(대기실) > ready(시작 카운트다운) > play(문제 풀이, 정답 공개) > out(탈락) 또는 win(최종 생존)
// round는 store의 getRound() 결과다.

/** 화면이 시간을 다시 재는 간격(ms) */
export const TICK_MS = 200

/** 남은 시간이 이 값 이하이면 마감 직전 경고(빨간 타이머) */
export const WARN_SECONDS = 3

export function initGame() {
  return {
    id: 0, // 판 번호. 결과를 한 번만 저장하는 데 쓴다
    phase: 'lobby',
    practice: false, // '연습 모드로 다시 도전'으로 시작한 판
    qi: 0, // 지금 문제(0부터)
    startedAt: 0, // 카운트다운 또는 지금 문제가 시작된 시각
    now: 0, // 마지막으로 잰 시각
    picked: null, // 고른 보기 번호
    revealed: false, // 정답 공개 중
    revealedAt: 0,
    right: false, // 정답 공개 결과
    participants: 0, // 시작 인원(사용자 포함)
    survivors: 0, // 지금 생존자(사용자 포함)
    prev: 0, // 이번 문제 직전 생존자
    totalTime: 0, // 누적 응답 시간(초)
    reason: null, // 탈락 이유: 'wrong' | 'timeout' | 'left'
    beforeStart: false, // 1번 문제가 시작되기 전(카운트다운 중)에 화면을 벗어나 탈락
  }
}

export function isRunning(game) {
  return game.phase === 'ready' || game.phase === 'play'
}

/** 입장(또는 다시 도전): 시작 카운트다운부터.
 * participants: 시작 인원(대기실에서 입장 버튼을 누른 순간 보이던 인원). 없으면 상한(config.maxParticipants) */
export function enter(game, round, now, practice, participants) {
  const cap = round.config.maxParticipants
  const n = Math.max(1, Math.min(cap, Math.round(Number(participants) || cap)))
  return {
    ...initGame(),
    id: game.id + 1,
    phase: 'ready',
    practice,
    startedAt: now,
    now,
    participants: n,
    survivors: n,
    prev: n,
  }
}

// 문제 시작. 그 순간 화면을 벗어나 있으면 그 문제에서 이탈 탈락
function startQuestion(game, round, qi, now, hidden) {
  const next = {
    ...game,
    phase: 'play',
    qi,
    startedAt: now,
    now,
    picked: null,
    revealed: false,
    revealedAt: 0,
    right: false,
    prev: game.survivors,
  }
  if (hidden && round.config.leaveEliminates) return { ...next, phase: 'out', reason: 'left' }
  return next
}

// 시간이 끝나면 정답 공개. 맞히면 생존 비율만큼 생존자가 줄되, 사용자 1명 아래로는 내려가지 않는다
function reveal(game, round, now) {
  const item = round.questions[game.qi]
  const right = game.picked === item.a
  const rates = round.config.survivalRates
  const rate = rates[Math.min(game.qi, rates.length - 1)]
  const cut = Math.max(1, Math.min(game.survivors, Math.round(game.survivors * rate)))
  return {
    ...game,
    now,
    revealed: true,
    revealedAt: now,
    right,
    prev: game.survivors,
    survivors: right ? cut : game.survivors,
  }
}

// 정답 공개가 끝나면: 틀렸으면 탈락, 맞혔으면 다음 문제, 마지막 문제였으면 최종 생존
function advance(game, round, now, hidden) {
  if (!game.right) {
    return { ...game, now, phase: 'out', reason: game.picked === null ? 'timeout' : 'wrong' }
  }
  if (game.qi + 1 < round.questions.length) return startQuestion(game, round, game.qi + 1, now, hidden)
  return { ...game, now, phase: 'win', reason: null }
}

/** 시간 흐름. hidden: 지금 화면을 벗어나 있는지(document.hidden) */
export function tick(game, round, now, hidden) {
  const { countdown, secondsPerQuestion, revealSeconds } = round.config
  if (game.phase === 'ready') {
    if (now - game.startedAt >= countdown * 1000) return startQuestion(game, round, 0, now, hidden)
    return { ...game, now }
  }
  if (game.phase === 'play' && !game.revealed) {
    if (now - game.startedAt >= secondsPerQuestion * 1000) return reveal(game, round, now)
    return { ...game, now }
  }
  if (game.phase === 'play') {
    if (now - game.revealedAt >= revealSeconds * 1000) return advance(game, round, now, hidden)
    return { ...game, now }
  }
  return game
}

/** 보기 고르기. 한 번 고르면 바꿀 수 없고, 시간이 끝난 뒤에는 받지 않는다 */
export function pick(game, round, index, now) {
  if (game.phase !== 'play' || game.revealed || game.picked !== null) return game
  const used = (now - game.startedAt) / 1000
  if (used >= round.config.secondsPerQuestion) return game
  return { ...game, now, picked: index, totalTime: game.totalTime + Math.max(0, used) }
}

/** 화면을 벗어났을 때(다른 앱, 다른 탭, 화면 잠금). 카운트다운 중이면 1번 문제 시작 전 탈락(beforeStart).
 * 정답 공개 중에는 결과가 이미 정해졌으므로 넘어가고, 다음 문제가 시작될 때 다시 확인한다 */
export function leave(game, now) {
  if (game.phase === 'ready') {
    return { ...game, now, phase: 'out', qi: 0, reason: 'left', beforeStart: true }
  }
  if (game.phase === 'play' && !game.revealed) return { ...game, now, phase: 'out', reason: 'left' }
  return game
}

/** 나가기 버튼으로 진행 중인 판을 떠날 때 저장할 마지막 상태. 저장할 결과가 없으면 null */
export function endOnExit(game, round, now) {
  if (game.phase === 'play' && game.revealed) {
    const done = advance(game, round, now, true)
    return done.phase === 'out' || done.phase === 'win' ? done : null
  }
  if (!round.config.leaveEliminates) return null
  const left = leave(game, now)
  return left.phase === 'out' ? left : null
}

/** 나가기 버튼을 눌렀을 때 먼저 물어볼지. 실전 판이 진행 중이고, 지금 나가면 결과가 바뀔 때
 * (화면 이탈 탈락이 되거나 기록 없이 끝날 때)만 묻는다. 연습 모드이거나, 정답 공개 중이라
 * 결과가 이미 정해졌으면(오답, 시간 초과, 마지막 문제 정답) 묻지 않고 바로 나간다 */
export function exitNeedsConfirm(game, round) {
  if (!isRunning(game) || game.practice) return false
  const last = endOnExit(game, round, game.now)
  return !last || last.reason === 'left'
}

/** 시작까지 남은 초(3, 2, 1) */
export function countdownLeft(game, round) {
  const ms = round.config.countdown * 1000 - (game.now - game.startedAt)
  return Math.max(1, Math.ceil(ms / 1000))
}

/** 이번 문제의 남은 초. 정답 공개 중이면 0 */
export function secondsLeft(game, round) {
  if (game.phase !== 'play' || game.revealed) return 0
  const ms = round.config.secondsPerQuestion * 1000 - (game.now - game.startedAt)
  return Math.max(0, Math.ceil(ms / 1000))
}

/** 이번 문제에서 흐른 시간의 비율(0~1). 타이머 원을 줄이는 데 쓴다 */
export function elapsedRatio(game, round) {
  if (game.phase !== 'play' || game.revealed) return 1
  const ratio = (game.now - game.startedAt) / (round.config.secondsPerQuestion * 1000)
  return Math.min(1, Math.max(0, ratio))
}

/** 최종 생존자 중 속도 순위. 평균 응답 시간이 짧을수록 앞선다(가상 참가자 기준 추정) */
export function speedRank(game, round) {
  const avg = game.totalTime / round.questions.length
  const rank = Math.ceil((avg / round.config.secondsPerQuestion) * game.survivors)
  return Math.max(1, Math.min(game.survivors, rank))
}

/** store의 saveResult에 넘길 결과 */
export function toResult(game, round) {
  const win = game.phase === 'win'
  return {
    survived: win,
    reached: win ? round.questions.length : game.qi + 1,
    total: round.questions.length,
    rank: win ? speedRank(game, round) : null,
    participants: game.participants,
    totalTime: Math.round(game.totalTime * 10) / 10,
    reason: win ? 'win' : game.reason,
    practice: game.practice,
  }
}
