// MY 화면이 다른 기능의 store에서 읽는 값을 한곳에 모으고 다듬는다.
// MY는 읽기만 한다. 다른 기능의 값을 바꾸는 함수는 부르지 않는다.
// 다른 기능이 아직 빈 값(빈 배열, null)을 돌려주거나 오류를 내도 MY 화면은 기본값으로 그린다.
import { getMockExams, getProgress, getWrongNotes } from '../../store/lobby.js'
import { getMyPosts, getSavedPosts } from '../../store/samchocut.js'
import { getBestResult, getRound } from '../../store/asurajang.js'

// store 함수 하나를 부른다. 오류가 나면 개발 중에만 콘솔에 남기고 기본값을 쓴다.
function safe(read, fallback) {
  try {
    return read() ?? fallback
  } catch (err) {
    if (import.meta.env.DEV) console.error('[MY] 다른 기능의 값을 읽지 못했어요', err)
    return fallback
  }
}

const isObj = (v) => Boolean(v) && typeof v === 'object'
const list = (v) => (Array.isArray(v) ? v.filter(isObj) : [])

function text(v) {
  if (typeof v === 'string') return v.trim()
  if (typeof v === 'number' && Number.isFinite(v)) return String(v)
  return ''
}

// 0 이상의 정수. 숫자가 아니면 0
function whole(v) {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0
}

// 0~100 사이의 정수
function percent(v) {
  const n = Number(v)
  return Number.isFinite(n) ? Math.min(100, Math.max(0, Math.round(n))) : 0
}

// ready가 false인 과목은 문항이 아직 없는 '준비 중' 과목이다(진도 막대 대신 준비 중 표시)
function toSubject(x, i) {
  const total = whole(x.total)
  const done = Math.min(whole(x.done), total)
  return {
    id: text(x.subjectId) || `subject-${i}`,
    name: text(x.name) || '과목',
    unit: text(x.unitLabel),
    done,
    total,
    pct: total > 0 ? percent((done / total) * 100) : percent(x.pct),
    ready: x.ready !== false && total > 0,
    group: text(x.group),
    groupLabel: text(x.groupLabel),
  }
}

function toMock(m, i) {
  const round = whole(m.round)
  const done = m.status === 'done'
  const score = Number(m.score)
  return {
    id: text(m.id) || `mock-${i}`,
    title: text(m.title) || (round ? `${round}회차` : '모의고사'),
    questions: whole(m.questions),
    minutes: whole(m.minutes),
    done,
    score: done && m.score !== null && Number.isFinite(score) ? score : null,
    openLabel: text(m.openLabel),
    sample: m.sample === true, // 시연용 예시 점수
  }
}

// 저장한 암기법 한 줄: 키워드 칸을 이어 붙인 글자(예: 계수가배인), 주제, 과목
function toSaved(p, i) {
  return {
    id: text(p.id) || `saved-${i}`,
    keys: Array.isArray(p.keys) ? p.keys.map(text).join('') : '',
    title: text(p.title),
    subject: text(p.subject),
  }
}

function toArena(r) {
  if (!isObj(r)) return null
  return { schedule: text(r.scheduleLabel), subtitle: text(r.subtitle), subjects: text(r.subjectsLabel) }
}

function toBest(b) {
  if (!isObj(b)) return null
  const total = whole(b.total)
  if (total === 0) return null
  return {
    survived: b.survived === true,
    reached: Math.min(Math.max(1, whole(b.reached)), total),
    total,
    rank: whole(b.rank) || null,
  }
}

/** MY 화면에 필요한 값 전부. 화면을 그릴 때마다 새로 읽는다. */
export function readMyData() {
  const progress = safe(getProgress, {})
  const p = isObj(progress) ? progress : {}
  const mocks = list(safe(getMockExams, [])).map(toMock)
  return {
    overallPct: percent(p.overallPct),
    streak: whole(p.streak),
    subjects: list(p.bySubject).map(toSubject),
    wrongCount: list(safe(getWrongNotes, [])).length,
    mocks,
    mockDone: mocks.filter((m) => m.done).length,
    postCount: list(safe(getMyPosts, [])).length,
    saved: list(safe(getSavedPosts, []))
      .map(toSaved)
      .filter((x) => x.title),
    arena: toArena(safe(getRound, null)),
    best: toBest(safe(getBestResult, null)),
  }
}

const WEEK = ['일', '월', '화', '수', '목', '금', '토']

/** 'YYYY-MM-DD'를 '10월 27일'로 바꾼다. full이면 '2026년 10월 27일 (화)'. 형식이 틀리면 ''
 * 시간대 때문에 하루가 밀리지 않도록 글자를 직접 나눠 읽는다. */
export function dateText(iso, full = false) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso ?? ''))
  if (!m) return ''
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  const date = new Date(y, mo - 1, d)
  if (date.getMonth() !== mo - 1 || date.getDate() !== d) return ''
  return full ? `${y}년 ${mo}월 ${d}일 (${WEEK[date.getDay()]})` : `${mo}월 ${d}일`
}

/** 일정 문구를 큰 글자와 작은 글자로 나눈다. 예: 'D-1 오픈' > ['D-1', '오픈'] */
export function splitSchedule(label) {
  const t = text(label)
  const i = t.lastIndexOf(' ')
  return i > 0 ? [t.slice(0, i), t.slice(i + 1)] : [t, '']
}

/** 아수(습)라장 최고 기록을 짧게. 기록이 없으면 null
 * 끝까지 살아남으면 '최종 생존'(속도 순위가 있으면 '최종 생존 3위'), 탈락이면 맞힌 문제 수 '4/8 통과' */
export function bestValue(best) {
  if (!best) return null
  if (best.survived) return best.rank ? `최종 생존 ${best.rank}위` : '최종 생존'
  return `${best.reached - 1}/${best.total} 통과`
}
