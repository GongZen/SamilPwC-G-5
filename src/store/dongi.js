// 동기들 데이터 창구. 담당: 빌드 리드.
// 서버가 없어 동기들의 진도, 접속 여부, 스피드 퀴즈 상대의 답과 속도는 시연용 가상 값이다(MY 공지사항에 밝힌다).
// 찌르기를 눌러도 실제 알림은 가지 않는다. 화면에는 상대 휴대폰에 갈 알림의 예시만 보여 준다.
//
// 함수
// - getPeople(): 등록된 동기와 나를 전체 진도 높은 순으로. 나의 진도는 MY에서 고른 연차의 실제 전체 진도다
// - getRoster(): 관리 화면에 쓰는 전체 동기 명단(등록 여부 포함). 팀 9명 다음에 아수(습)라장 가상 참가자
// - addFriend(id), removeFriend(id): 동기 등록, 삭제
// - getQuizConfig(): 스피드 퀴즈 설정(문제 수, 제한 시간, 정답 화면 시간, 함께할 동기 최대 수)
// - getQuizQuestions(count): 스피드 퀴즈 문항. 삼일 끝내기 문항 중 짧은 것에서 무작위로 고른다
// - getPoke(): 찌르기 문구와 사진을 보여 주는 시간
//
// 사람 한 명의 모양: { id, name, los, pct, online, me, color }
// - color: 얼굴 색 순서(명단 안의 순서). 나는 -1
//
// 저장 키(모두 'dongi.'로 시작)
// - dongi.friends: 등록한 동기 id 목록. 저장된 값이 없으면 data의 팀 9명
import { read, write } from './storage.js'
import { getUser } from './user.js'
import { getProgress, getQuestionBank } from './lobby.js'
import { getRound } from './asurajang.js'
import data from '../data/dongi.json'

const K = { friends: 'dongi.friends' }

const text = (v) => (typeof v === 'string' ? v.trim() : '')
const pct = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? Math.min(100, Math.max(0, Math.round(n))) : 0
}

const TEAM = (Array.isArray(data.team) ? data.team : [])
  .map((p) => ({ id: text(p.id), name: text(p.name), los: text(p.los), pct: pct(p.pct) }))
  .filter((p) => p.id && p.name)
const ONLINE = new Set(Array.isArray(data.online) ? data.online : [])

// 동기 찾기에 나오는 가상 동기: 아수(습)라장 대기실 가상 참가자 이름. 진도는 이름 순서로 정한 고정 값
function pool() {
  const crowd = getRound()?.crowd || {}
  const names = (Array.isArray(crowd.names) ? crowd.names : []).map(text).filter(Boolean)
  const los = (Array.isArray(crowd.los) ? crowd.los : []).map(text).filter(Boolean)
  return names.map((name, i) => ({
    id: `p${i + 1}`,
    name,
    los: los.length ? los[i % los.length] : '',
    pct: ((i * 29 + 17) % 86) + 6,
  }))
}

// 전체 명단(팀 9명 다음에 가상 동기). 이름이 겹치면 앞의 사람만 쓴다
function roster() {
  const seen = new Set()
  return [...TEAM, ...pool()]
    .filter((p) => (seen.has(p.name) ? false : seen.add(p.name)))
    .map((p, i) => ({ ...p, online: ONLINE.has(p.id), me: false, color: i }))
}

function friendIds(all = roster()) {
  const ids = new Set(all.map((p) => p.id))
  const saved = read(K.friends, null)
  if (!Array.isArray(saved)) return TEAM.map((p) => p.id).filter((id) => ids.has(id))
  return [...new Set(saved)].filter((id) => ids.has(id))
}

/** 등록된 동기와 나(전체 진도 높은 순). 나의 Los는 간편 로그인에 넣은 값(없으면 빈칸) */
export function getPeople() {
  const all = roster()
  const byId = new Map(all.map((p) => [p.id, p]))
  const friends = friendIds(all).map((id) => byId.get(id))
  const me = { id: 'me', name: '나', los: text(getUser()?.dept), pct: pct(getProgress()?.overallPct), online: false, me: true, color: -1 }
  return [me, ...friends].sort((a, b) => b.pct - a.pct)
}

/** 관리 화면용 전체 명단. registered: 내 동기로 등록했는지 */
export function getRoster() {
  const all = roster()
  const ids = new Set(friendIds(all))
  return all.map((p) => ({ ...p, registered: ids.has(p.id) }))
}

export function addFriend(id) {
  const all = roster()
  const ids = friendIds(all)
  if (!all.some((p) => p.id === id) || ids.includes(id)) return ids
  return write(K.friends, [...ids, id])
}

export function removeFriend(id) {
  return write(
    K.friends,
    friendIds().filter((x) => x !== id),
  )
}

/** 스피드 퀴즈 설정 */
export function getQuizConfig() {
  const q = data.quiz || {}
  const int = (v, min, max, fallback) => {
    const n = Math.round(Number(v))
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback
  }
  return {
    rounds: int(q.rounds, 1, 30, 10),
    seconds: int(q.seconds, 3, 60, 10),
    revealSeconds: int(q.revealSeconds, 1, 15, 5),
    maxPick: int(q.maxPick, 1, 3, 3),
  }
}

/** 스피드 퀴즈 문항 count개. 문제와 보기가 짧은 문항만 쓰고, 모자라면 나머지 문항도 쓴다(시작 버튼을 누를 때 부른다) */
export function getQuizQuestions(count) {
  const maxQ = Number(data.quiz?.maxQuestionLength) || 46
  const maxO = Number(data.quiz?.maxOptionLength) || 18
  const bank = getQuestionBank()
  const short = bank.filter((x) => x.q.length <= maxQ && x.o.every((o) => o.length <= maxO))
  const list = short.length >= count ? short : bank
  const out = [...list]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out.slice(0, count).map((x) => ({ subject: x.subject, q: x.q, o: x.o, a: x.a }))
}

/** 찌르기 문구와 사진을 보여 주는 시간(ms) */
export function getPoke() {
  const p = data.poke || {}
  const sec = Number(p.imageSeconds)
  return {
    message: text(p.message) || '시험이 얼마나 남았다고 잠이 오냐?',
    button: text(p.button) || '푹 찌르기',
    imageMs: Number.isFinite(sec) && sec > 0 ? Math.round(sec * 1000) : 300,
  }
}
