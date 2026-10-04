// 아수(습)라장 데이터 창구. 담당: 아수(습)라장 담당자.
// MY 화면이 쓰는 getRound, getBestResult는 이름과 돌려주는 모양을 바꾸지 않는다.
// 함수는 더 만들어도 된다. 만들면 이 파일 맨 위 설명에 한 줄 추가한다.
// - getResults: 저장된 최근 결과 목록(최신순, 최대 20개)
// 회차 문구, 문항, 설정값은 src/data/asurajang.json에서 고친다. 여기서는 값이 비거나 범위를 벗어나지 않게 다듬기만 한다.
import { read, write } from './storage.js'
import data from '../data/asurajang.json'

const BEST_KEY = 'asurajang.best'
const RESULTS_KEY = 'asurajang.results'
const MAX_RESULTS = 20
// 참가자 총수 상한(저장소 규칙 3절). data 파일에 더 큰 값을 넣어도 300명으로 맞춘다.
const MAX_PARTICIPANTS = 300
const OUT_REASONS = ['wrong', 'timeout', 'left']

function text(value) {
  return typeof value === 'string' ? value : ''
}

function clamp(value, min, max, fallback) {
  const n = Number(value)
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback
}

function toQuestion(item) {
  if (!item || typeof item.q !== 'string' || !Array.isArray(item.o) || item.o.length < 2) return null
  const a = Number(item.a)
  if (!Number.isInteger(a) || a < 0 || a >= item.o.length) return null
  return { subject: text(item.subject), q: item.q, o: item.o.map(String), a, ex: text(item.ex) }
}

/** 회차 정보, 문항, 설정값
 * 기본 모양은 그대로 두고, 대기실 문구용 tagline, prize, resultNotice와 config.revealSeconds를 더했다.
 * - title: 대기실 큰 제목(줄바꿈 \n 포함), subtitle: 머리 부분 회차 이름, scheduleLabel: 열리는 때(MY에서 씀)
 * - tagline: 대기실 카드 맨 위 작은 글자, prize: 경품 이름(비우면 표시하지 않음), resultNotice: 우승 화면 공지 안내
 * - config.survivalRates: 문제마다 다음 문제로 넘어가는 생존 비율. 문항이 더 많으면 마지막 값을 다시 쓴다
 * - config.leaveEliminates: true면 퀴즈 도중 화면을 벗어날 때 탈락, config.revealSeconds: 정답 공개 후 다음 문제까지 초
 * @returns {{ title: string, subtitle: string, scheduleLabel: string, subjectsLabel: string,
 *   tagline: string, prize: string, resultNotice: string,
 *   questions: Array<{ subject: string, q: string, o: string[], a: number, ex: string }>,
 *   config: { maxParticipants: number, secondsPerQuestion: number, countdown: number,
 *     survivalRates: number[], leaveEliminates: boolean, revealSeconds: number } } | null} */
export function getRound() {
  const round = data.round
  if (!round || typeof round !== 'object') return null
  const questions = (Array.isArray(round.questions) ? round.questions : []).map(toQuestion).filter(Boolean)
  if (questions.length === 0) return null

  const c = round.config || {}
  const rates = (Array.isArray(c.survivalRates) ? c.survivalRates : []).map((v) => clamp(v, 0, 1, 1))
  const subjects = [...new Set(questions.map((q) => q.subject).filter(Boolean))].join(' · ')

  return {
    title: text(round.title),
    subtitle: text(round.subtitle),
    scheduleLabel: text(round.scheduleLabel),
    subjectsLabel: text(round.subjectsLabel) || subjects,
    tagline: text(round.tagline),
    prize: text(round.prize),
    resultNotice: text(round.resultNotice),
    questions,
    config: {
      maxParticipants: Math.round(clamp(c.maxParticipants, 1, MAX_PARTICIPANTS, MAX_PARTICIPANTS)),
      secondsPerQuestion: Math.round(clamp(c.secondsPerQuestion, 3, 60, 10)),
      countdown: Math.round(clamp(c.countdown, 1, 10, 3)),
      survivalRates: rates.length > 0 ? rates : [1],
      leaveEliminates: c.leaveEliminates !== false,
      revealSeconds: clamp(c.revealSeconds, 0.5, 10, 2.2),
    },
  }
}

function toInt(value, min, max, fallback) {
  const n = Math.round(Number(value))
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback
}

// 저장할 결과의 값을 정리한다. 모양이 맞지 않으면 null
function toResult(r) {
  if (!r || typeof r !== 'object') return null
  const total = toInt(r.total, 1, 999, 1)
  const survived = r.survived === true
  return {
    survived,
    reached: survived ? total : toInt(r.reached, 1, total, 1),
    total,
    rank: r.rank === null || r.rank === undefined ? null : toInt(r.rank, 1, MAX_PARTICIPANTS, null),
    participants: toInt(r.participants, 1, MAX_PARTICIPANTS, MAX_PARTICIPANTS),
    totalTime: Math.round(Math.max(0, Number(r.totalTime) || 0) * 10) / 10,
    reason: survived ? 'win' : OUT_REASONS.includes(r.reason) ? r.reason : 'wrong',
    practice: r.practice === true,
  }
}

// 저장된 기록(playedAt 포함)을 읽는다
function toStored(value) {
  const r = toResult(value)
  return r && typeof value.playedAt === 'string' ? { ...r, playedAt: value.playedAt } : null
}

// a가 b보다 좋은 기록인가: 생존 > 더 멀리 감 > 속도 순위 > 누적 응답 시간
function isBetter(a, b) {
  if (a.survived !== b.survived) return a.survived
  if (a.reached !== b.reached) return a.reached > b.reached
  const ra = a.rank ?? Infinity
  const rb = b.rank ?? Infinity
  if (ra !== rb) return ra < rb
  return a.totalTime < b.totalTime
}

// 목록에서 가장 좋은 기록. 없으면 null
function bestOf(list) {
  return list.reduce((best, r) => (!best || isBetter(r, best) ? r : best), null)
}

// 저장된 최고 실전 기록. 예전 버전이 연습 모드 판을 최고 기록으로 저장해 두었으면 최근 실전 기록에서 다시 고른다
function readBest() {
  const best = toStored(read(BEST_KEY, null))
  return best && best.practice ? bestOf(getResults().filter((r) => !r.practice)) : best
}

/** 한 판 결과 저장. 최근 목록에 넣고, 실전 판이 가장 좋은 기록이면 그것도 바꾼다.
 * 연습 모드 판은 최근 목록에만 넣는다(정답을 본 뒤 다시 푸는 판이라 최고 기록에서 뺀다).
 * - reached: 탈락한 문제 번호(1부터). 끝까지 살아남으면 total
 * - rank: 최종 생존자 중 속도 순위(탈락이면 null), totalTime: 누적 응답 시간(초)
 * - practice: '연습 모드로 다시 도전'으로 한 판이면 true(없어도 된다)
 * @param {{ survived: boolean, reached: number, total: number, rank: number|null,
 *   participants: number, totalTime: number, reason: 'win'|'wrong'|'timeout'|'left', practice?: boolean }} result
 * @returns {null | { survived: boolean, reached: number, total: number, rank: number|null, participants: number,
 *   totalTime: number, reason: string, practice: boolean, playedAt: string }} */
export function saveResult(result) {
  const r = toResult(result)
  if (!r) return null
  const entry = { ...r, playedAt: new Date().toISOString() }

  const list = read(RESULTS_KEY, [])
  write(RESULTS_KEY, [entry, ...(Array.isArray(list) ? list : [])].slice(0, MAX_RESULTS))

  if (!entry.practice) {
    const best = readBest()
    write(BEST_KEY, !best || isBetter(entry, best) ? entry : best)
  }
  return entry
}

/** 가장 좋은 실전 기록(MY에서 씀). 연습 모드 판은 들어가지 않는다
 * @returns {null | { survived: boolean, reached: number, total: number, rank: number|null,
 *   participants: number, totalTime: number, playedAt: string }} */
export function getBestResult() {
  const best = readBest()
  if (!best) return null
  const { survived, reached, total, rank, participants, totalTime, playedAt } = best
  return { survived, reached, total, rank, participants, totalTime, playedAt }
}

/** 최근 결과 목록(최신순, 최대 20개)
 * @returns {Array<{ survived: boolean, reached: number, total: number, rank: number|null, participants: number,
 *   totalTime: number, reason: string, practice: boolean, playedAt: string }>} */
export function getResults() {
  const list = read(RESULTS_KEY, [])
  return Array.isArray(list) ? list.map(toStored).filter(Boolean) : []
}
