// 삼일 끝내기(로비) 데이터 창구. 담당: 로비 담당자.
// MY 화면이 쓰는 getProgress, getWrongNotes, getMockExams는 이름과 돌려주는 모양을 바꾸지 않는다(필드 추가만 한다).
// 함수는 더 만들어도 된다. 만들면 이 파일 맨 위 설명에 한 줄 추가한다.
//
// 추가한 함수
// - getSelectedSubject(), setSelectedSubject(id): 로비에서 마지막으로 고른 과목
// - getPlan(), togglePlanItem(id): 진도 계획의 '오늘 할 일'. 날짜가 바뀌면 체크가 모두 풀린다
// - getMockLesson(mockId): 모의고사 회차의 문항(과목을 섞은 묶음). 회차는 언제든 바로 응시할 수 있다
// - saveMockResult(mockId, { correct, total }): 모의고사 회차 점수 저장(마지막 점수)
//
// 과목
// - 과목 이름, 순서, 묶음(직업윤리, 실무역량)은 config.js의 SUBJECT_GROUPS가 정한다. data/lobby.json은 id로 단원과 단계를 붙인다
// - data에 단계가 없는 과목도 getSubjects()와 getProgress()에 나오고 ready: false('준비 중')다. 그 과목은 단계 학습이 열리지 않는다
// - source: 과목 문항의 출처 표기(있는 과목만). 문항 해설 아래에 보여 준다
//
// 규칙
// - 처음 접속하면 data/lobby.json의 seed(디자인과 같은 값: 연속 12일, 과목별 2/5, 오답 2개, 오늘 할 일 2/3)를 넣는다.
//   시연용 예시 기록이다. 예시 오답과 예시 점수에는 sample: true를 붙여 화면에 '예시'로 표시한다
// - 단계마다 자기 문항만 쓴다. 문항이 없는 단계는 count가 0이고 열리지 않는다('문항 준비 중')
// - 한 과목은 하루에 새 단계 하나만 연다. 끝내면 다음 단계는 '내일 학습 오픈'이 된다
// - 이미 끝낸 단계는 언제든 다시 풀 수 있다(복습). 복습은 진도를 올리지 않는다
// - 연속 학습일은 단계 학습(복습 포함)을 끝낸 날 하루 한 번만 오른다. 하루를 건너뛰면 0으로 보이고 다음 학습 때 1부터 다시 센다
// - 오늘 할 일: lesson 항목은 그 과목 단계를 끝내면, wrongReview 항목은 오답노트에서 정한 수만큼 '복습 완료'하면
//   (남은 오답이 더 없으면 그때) 자동으로 체크된다. tab 항목(다른 탭에서 할 일)은 직접 체크한다
// - 모의고사는 오픈 시각·알림 없이 언제든 응시한다. 회차마다 과목별 단계에서 1문항씩(회차끼리 겹치지 않게, 지금 20문항) 낸다
// - 모의고사도 틀린 문항은 오답노트에 남는다. 진도와 연속 학습일은 바꾸지 않고, 회차 점수(마지막 점수)만 저장한다
//
// 저장 키(모두 'lobby.'로 시작)
// - lobby.seeded: 시작 값을 넣었는지
// - lobby.progress: 과목별로 끝낸 단계 수. 예: { fin: 2, audit: 2, tax: 2 }
// - lobby.streak: 연속 학습일. { count, last: 마지막으로 학습한 날짜 'YYYY-MM-DD' }
// - lobby.today: 오늘 새 단계를 끝낸 과목. { date, subjects: { fin: true } }
// - lobby.wrongNotes: 오답노트(최근 것이 앞)
// - lobby.plan: 오늘 할 일. { date, done: [항목 id], reviewed: 오늘 '복습 완료'한 오답 수 }
// - lobby.subject: 마지막으로 고른 과목 id
// - lobby.mockScores: 모의고사 회차별 마지막 점수. { m1: { score, correct, total, at } }
import { read, write } from './storage.js'
import { DEFAULT_SUBJECT_ID, SUBJECTS as SUBJECT_LIST, TABS, currentSubjectName } from '../config.js'
import data from '../data/lobby.json'

const K = {
  seeded: 'lobby.seeded',
  progress: 'lobby.progress',
  streak: 'lobby.streak',
  today: 'lobby.today',
  wrongNotes: 'lobby.wrongNotes',
  plan: 'lobby.plan',
  subject: 'lobby.subject',
  mockScores: 'lobby.mockScores',
}

// 문항이 있는 과목만(config.js 순서). 이름과 묶음은 config.js 값을 쓴다
const DATA_SUBJECTS = new Map((Array.isArray(data.subjects) ? data.subjects : []).map((s) => [s.id, s]))
const SUBJECTS = SUBJECT_LIST.flatMap((c) => {
  const d = DATA_SUBJECTS.get(c.id)
  if (!d || !Array.isArray(d.nodes) || d.nodes.length === 0) return []
  return [{ ...d, id: c.id, name: c.name, group: c.group, groupLabel: c.groupLabel }]
})
const PLAN_ITEMS = Array.isArray(data.plan) ? data.plan : []
const MOCK_EXAMS = Array.isArray(data.mockExams) ? data.mockExams : []
const SEED = data.seed || {}
const SEED_NOTES = Array.isArray(SEED.wrongNotes) ? SEED.wrongNotes : []
// 시작 값으로 넣은 예시 오답의 id. 사용자가 틀려서 생긴 오답은 다른 id를 받는다
const SAMPLE_NOTE_IDS = new Set(SEED_NOTES.map((w) => w.id))


// ---------- 날짜 ----------

function dateKey(d = new Date()) {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

function daysFromNow(n) {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
}

// from에서 to까지 며칠인지(날짜 키 'YYYY-MM-DD' 기준)
function daysBetween(from, to) {
  const a = new Date(`${from}T00:00:00`)
  const b = new Date(`${to}T00:00:00`)
  return Math.round((b - a) / 86400000)
}


// ---------- 시작 값 ----------

function ensureSeeded() {
  if (read(K.seeded, false)) return
  write(K.progress, { ...(SEED.progress || {}) })
  // 어제까지 연속으로 공부한 상태로 시작한다. 오늘 단계 하나를 끝내면 하루가 오른다.
  write(K.streak, { count: Number(SEED.streak) || 0, last: dateKey(daysFromNow(-1)) })
  write(
    K.wrongNotes,
    SEED_NOTES.map((w, i) => ({ ...w, addedAt: daysFromNow(-(i + 1)).toISOString() })),
  )
  write(K.plan, { date: dateKey(), done: Array.isArray(SEED.planDone) ? [...SEED.planDone] : [], reviewed: 0 })
  write(K.seeded, true)
}

// ---------- 내부 도우미 ----------

function findSubject(id) {
  return SUBJECTS.find((s) => s.id === id) || null
}

function tabLabel(id) {
  return TABS.find((t) => t.id === id)?.label || ''
}

function progressMap() {
  ensureSeeded()
  const map = read(K.progress, {})
  return map && typeof map === 'object' ? map : {}
}

// 과목에서 끝낸 단계 수(0 ~ 단계 수)
function doneCount(subject, map = progressMap()) {
  const stored = Number(map[subject.id])
  const fallback = Number(SEED.progress?.[subject.id]) || 0
  const n = Number.isFinite(stored) ? stored : fallback
  return Math.max(0, Math.min(subject.nodes.length, Math.floor(n)))
}

function todayState() {
  const key = dateKey()
  const t = read(K.today, null)
  return t && t.date === key && t.subjects ? t : { date: key, subjects: {} }
}

function isDoneToday(subjectId) {
  return Boolean(todayState().subjects[subjectId])
}

// 단계의 문항. 그 단계에 들어 있는 문항만 쓴다(다른 단계의 문항을 빌려 쓰지 않는다).
function questionsFor(subject, index) {
  const own = subject.nodes[index]?.questions
  return Array.isArray(own) ? own : []
}

function copyQuestion(q, subject) {
  return { q: q.q, o: [...q.o], a: q.a, ex: q.ex, subject: subject.name, source: subject.source || '' }
}

function streakState() {
  ensureSeeded()
  const s = read(K.streak, null)
  return s && Number.isFinite(s.count) ? s : { count: 0, last: null }
}

// 화면에 보이는 연속 학습일. 어제나 오늘 공부했으면 이어지고, 하루라도 비면 0이다.
function currentStreak() {
  const s = streakState()
  if (!s.last) return 0
  return daysBetween(s.last, dateKey()) <= 1 ? s.count : 0
}

// 오늘 처음 학습을 끝냈을 때만 하루 오른다.
function bumpStreak() {
  const s = streakState()
  const today = dateKey()
  if (s.last) {
    const gap = daysBetween(s.last, today)
    if (gap <= 0) return s.count
    if (gap === 1) return write(K.streak, { count: s.count + 1, last: today }).count
  }
  return write(K.streak, { count: 1, last: today }).count
}

// ---------- 오늘 할 일(진도 계획) 도우미 ----------

function planState() {
  ensureSeeded()
  const key = dateKey()
  const p = read(K.plan, null)
  if (!p || p.date !== key || !Array.isArray(p.done)) return { date: key, done: [], reviewed: 0 }
  return { date: p.date, done: p.done, reviewed: Math.max(0, Math.floor(Number(p.reviewed) || 0)) }
}

function writePlan(p) {
  write(K.plan, { date: p.date, done: [...new Set(p.done)], reviewed: p.reviewed })
}

// 오답 복습 항목의 오늘 목표 수. 남은 오답이 목표보다 적으면 할 수 있는 만큼으로 줄인다.
// 오답이 하나도 없으면 data의 목표 수를 그대로 보여 준다(직접 체크할 수 있다).
function reviewGoal(item, plan, remaining) {
  const target = Math.max(1, Math.floor(Number(item.count) || 1))
  const possible = plan.reviewed + remaining
  return possible > 0 ? Math.min(target, possible) : target
}

// 'lesson' 항목은 그 과목의 지금 단계 이름을 따라간다. 오늘 끝냈으면 끝낸 단계 이름을 보여 준다.
function planText(item, plan, remaining) {
  if (item.kind === 'lesson') {
    const subject = findSubject(item.subjectId)
    if (!subject) return String(item.text || '')
    const done = doneCount(subject)
    const node = subject.nodes[isDoneToday(subject.id) ? done - 1 : done]
    return node ? `${subject.name} · ${node.label} 학습` : `${subject.name} · ${subject.unit.title} 복습`
  }
  if (item.kind === 'wrongReview') return `오답노트 · ${reviewGoal(item, plan, remaining)}문항 복습`
  if (item.kind === 'tab') {
    const label = tabLabel(item.tab)
    return label ? `${label} · ${String(item.text || '')}` : String(item.text || '')
  }
  return String(item.text || '')
}

// ---------- 과목과 단계 ----------

/** 과목 목록(config.js의 모든 과목, 그 순서대로). unit.short는 MY의 과목별 진도에 쓰는 짧은 단원 이름(추가 필드)
 * ready: 문항이 있는 과목인지. false면 '준비 중'이고 unit은 비어 있으며 nodes는 빈 배열이다(추가 필드)
 * group, groupLabel: 과목 묶음(예: 'practice', '실무역량'), source: 문항 출처 표기(추가 필드)
 * @returns {Array<{ id: string, name: string, group: string, groupLabel: string, ready: boolean,
 *   year: number|null, yearLabel: string, source: string,
 *   unit: { label: string, title: string, sub: string, short: string }, nodes: string[] }>} */
export function getSubjects() {
  return SUBJECT_LIST.map((c) => {
    const s = findSubject(c.id)
    return {
      id: c.id,
      name: c.name,
      group: c.group,
      groupLabel: c.groupLabel,
      ready: Boolean(s),
      year: s ? s.year : null,
      yearLabel: s?.yearLabel || '',
      source: s?.source || '',
      unit: {
        label: s?.unit?.label || '',
        title: s?.unit?.title || '',
        sub: s?.unit?.sub || '',
        short: s?.unit?.short || s?.unit?.title || '',
      },
      nodes: s ? s.nodes.map((n) => n.label) : [],
    }
  })
}

/** 과목의 학습 단계.
 * waiting: 지금 단계지만 오늘 이 과목을 이미 끝내서 내일 열린다(추가 필드)
 * count: 이 단계에 들어 있는 문항 수. 0이면 문항 준비 중이라 열리지 않는다(추가 필드)
 * @param {string} subjectId
 * @returns {Array<{ index: number, label: string, status: 'done'|'current'|'locked',
 *   waiting: boolean, count: number }>} */
export function getUnits(subjectId) {
  const subject = findSubject(subjectId)
  if (!subject) return []
  const done = doneCount(subject)
  const waitingToday = isDoneToday(subject.id)
  return subject.nodes.map((n, index) => {
    const status = index < done ? 'done' : index === done ? 'current' : 'locked'
    return {
      index,
      label: n.label,
      status,
      waiting: status === 'current' && waitingToday,
      count: questionsFor(subject, index).length,
    }
  })
}

/** 단계 학습 문제. nodeIndex를 빼면 지금 단계. 잠긴 단계, 내일 열리는 단계, 문항이 없는 단계는 null.
 * kind: 'lesson'(추가 필드), review: 이미 끝낸 단계를 다시 푸는지(추가 필드), subjectName: 과목 이름(추가 필드)
 * questions[].subject: 문항의 과목 이름(추가 필드, 오답노트에 쓴다)
 * @param {string} subjectId @param {number} [nodeIndex]
 * @returns {{ kind: 'lesson', subjectId: string, subjectName: string, nodeIndex: number, nodeLabel: string,
 *   review: boolean, questions: Array<{ q: string, o: string[], a: number, ex: string, subject: string }> } | null} */
export function getLesson(subjectId, nodeIndex) {
  const subject = findSubject(subjectId)
  if (!subject) return null
  const done = doneCount(subject)
  const index = Number.isInteger(nodeIndex) ? nodeIndex : done
  if (index < 0 || index >= subject.nodes.length || index > done) return null
  const review = index < done
  if (!review && isDoneToday(subject.id)) return null
  const questions = questionsFor(subject, index)
  if (questions.length === 0) return null
  return {
    kind: 'lesson',
    subjectId: subject.id,
    subjectName: subject.name,
    nodeIndex: index,
    nodeLabel: subject.nodes[index].label,
    review,
    questions: questions.map((q) => copyQuestion(q, subject)),
  }
}

/** 단계 학습 결과 저장. 지금 단계면 진도를 하나 올리고, 연속 학습일을 갱신한다.
 * nodeIndex를 빼면 지금 단계로 본다. 이미 끝낸 단계(복습)는 진도를 올리지 않는다.
 * @param {string} subjectId @param {{ correct: number, total: number, nodeIndex?: number }} result
 * @returns {{ advanced: boolean, done: number, total: number, streak: number } | null} */
export function saveLessonResult(subjectId, result = {}) {
  const subject = findSubject(subjectId)
  if (!subject) return null
  const map = progressMap()
  const done = doneCount(subject, map)
  const index = Number.isInteger(result.nodeIndex) ? result.nodeIndex : done
  let advanced = false
  if (index === done && done < subject.nodes.length && !isDoneToday(subject.id)) {
    write(K.progress, { ...map, [subject.id]: done + 1 })
    const t = todayState()
    write(K.today, { date: t.date, subjects: { ...t.subjects, [subject.id]: true } })
    // 진도 계획에서 이 과목의 학습 항목을 체크한다
    const ids = PLAN_ITEMS.filter((p) => p.kind === 'lesson' && p.subjectId === subject.id).map((p) => p.id)
    if (ids.length > 0) {
      const plan = planState()
      writePlan({ ...plan, done: [...plan.done, ...ids] })
    }
    advanced = true
  }
  const streak = bumpStreak()
  return { advanced, done: advanced ? done + 1 : done, total: subject.nodes.length, streak }
}

// ---------- 오답노트 ----------

function readNotes() {
  ensureSeeded()
  const list = read(K.wrongNotes, [])
  return Array.isArray(list) ? list.filter((w) => w && typeof w === 'object') : []
}

/** 오답노트(최근 것이 앞). sample: 처음 접속할 때 넣은 시연용 예시 오답인지(추가 필드)
 * @returns {Array<{ id: string, subject: string, q: string, mine: string, ans: string, ex: string,
 *   addedAt: string, sample: boolean }>} */
export function getWrongNotes() {
  // 예전 과목 이름(재무회계 등)으로 저장된 오답도 지금 과목 이름으로 보여 준다
  return readNotes().map((w) => ({ ...w, subject: currentSubjectName(w.subject), sample: SAMPLE_NOTE_IDS.has(w.id) }))
}

/** 오답 추가. 같은 과목의 같은 문항이 있으면 지우고 맨 앞에 새로 넣는다.
 * @param {{ subject: string, q: string, mine: string, ans: string, ex: string }} note
 * @returns {{ id: string, subject: string, q: string, mine: string, ans: string, ex: string, addedAt: string }} */
export function addWrongNote(note) {
  const entry = {
    id: `w${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    subject: String(note?.subject || ''),
    q: String(note?.q || ''),
    mine: String(note?.mine || ''),
    ans: String(note?.ans || ''),
    ex: String(note?.ex || ''),
    addedAt: new Date().toISOString(),
  }
  const rest = readNotes().filter((w) => !(currentSubjectName(w.subject) === entry.subject && w.q === entry.q))
  write(K.wrongNotes, [entry, ...rest])
  return entry
}

/** 오답 지우기('복습 완료'). 오늘 복습한 수를 세고, 목표를 채우면 진도 계획의 오답 복습 항목을 체크한다.
 * @param {string} id @returns {Array<object>} 남은 오답노트 */
export function removeWrongNote(id) {
  const before = readNotes()
  const list = before.filter((w) => w.id !== id)
  if (list.length === before.length) return getWrongNotes()
  write(K.wrongNotes, list)

  const plan = planState()
  const next = { ...plan, reviewed: plan.reviewed + 1 }
  const reached = PLAN_ITEMS.filter(
    (p) => p.kind === 'wrongReview' && next.reviewed >= reviewGoal(p, next, list.length),
  ).map((p) => p.id)
  writePlan({ ...next, done: [...next.done, ...reached] })
  return getWrongNotes()
}

// ---------- 진도 요약 ----------

/** 진도 요약(MY에서도 씀). 전체 진도는 문항이 있는 과목만 센다.
 * todayDone: 오늘 단계 학습(복습 포함)을 하나 이상 끝냈는지
 * bySubject: config.js의 모든 과목. unitLabel: 'UNIT 3 수익인식'처럼 MY에 보여 줄 단원 이름(추가 필드)
 *   ready: 문항이 있는 과목인지(false면 done, total이 0인 '준비 중'), group, groupLabel: 과목 묶음(추가 필드)
 * @returns {{ overallPct: number, streak: number, todayDone: boolean,
 *   bySubject: Array<{ subjectId: string, name: string, done: number, total: number, pct: number, unitLabel: string,
 *     ready: boolean, group: string, groupLabel: string }> }} */
export function getProgress() {
  const map = progressMap()
  let doneSum = 0
  let totalSum = 0
  const bySubject = SUBJECT_LIST.map((c) => {
    const s = findSubject(c.id)
    const done = s ? doneCount(s, map) : 0
    const total = s ? s.nodes.length : 0
    doneSum += done
    totalSum += total
    return {
      subjectId: c.id,
      name: c.name,
      done,
      total,
      pct: total > 0 ? Math.round((done / total) * 100) : 0,
      unitLabel: s ? `${s.unit?.label || ''} ${s.unit?.short || s.unit?.title || ''}`.trim() : '',
      ready: Boolean(s),
      group: c.group,
      groupLabel: c.groupLabel,
    }
  })
  return {
    overallPct: totalSum > 0 ? Math.round((doneSum / totalSum) * 100) : 0,
    streak: currentStreak(),
    todayDone: streakState().last === dateKey(),
    bySubject,
  }
}

// ---------- 진도 계획 ----------

/** 진도 계획의 오늘 할 일
 * @returns {{ items: Array<{ id: string, text: string, done: boolean }>, done: number, total: number }} */
export function getPlan() {
  const p = planState()
  const remaining = readNotes().length
  const items = PLAN_ITEMS.map((item) => ({
    id: item.id,
    text: planText(item, p, remaining),
    done: p.done.includes(item.id),
  }))
  return { items, done: items.filter((i) => i.done).length, total: items.length }
}

/** 오늘 할 일 체크 켜고 끄기 @param {string} id */
export function togglePlanItem(id) {
  const p = planState()
  const done = p.done.includes(id) ? p.done.filter((x) => x !== id) : [...p.done, id]
  writePlan({ ...p, done })
  return getPlan()
}

// ---------- 모의고사 ----------

function mockScores() {
  const v = read(K.mockScores, {})
  return v && typeof v === 'object' ? v : {}
}

// 회차 문항: 문항이 있는 과목마다 단계별로 1문항씩 고른다(과목 4개면 20문항).
// 회차 번호에 따라 단계 안의 몇 번째 문항인지가 달라서(1회차 1번, 2회차 2번, 3회차 3번) 회차끼리 겹치지 않고,
// 세 회차를 합치면 준비된 문항(60개)을 모두 한 번씩 푼다. 과목을 번갈아 섞는다.
const MOCK_PER_NODE = 1

function pickMockQuestions(round) {
  const first = Math.max(0, Math.floor(Number(round) || 1) - 1)
  const perSubject = SUBJECTS.map((s) =>
    s.nodes
      .flatMap((n) => {
        const qs = Array.isArray(n.questions) ? n.questions : []
        const count = Math.min(MOCK_PER_NODE, qs.length)
        return Array.from({ length: count }, (_, i) => qs[(first + i) % qs.length])
      })
      .map((q) => copyQuestion(q, s)),
  )
  const longest = Math.max(0, ...perSubject.map((list) => list.length))
  const out = []
  for (let i = 0; i < longest; i++) {
    perSubject.forEach((list) => {
      if (list[i]) out.push(list[i])
    })
  }
  return out
}

/** 모의고사 회차(MY에서도 씀). 언제든 바로 응시할 수 있다(오픈 시각, 알림 없음).
 * questions: 이 회차에서 실제로 푸는 문항 수, minutes: 안내용 시험 시간(타이머는 없다),
 * score: 마지막 점수(응시한 적 없으면 data의 seedScore, 그것도 없으면 null), done: 점수가 있는지
 * @returns {Array<{ id: string, round: number, title: string, questions: number, minutes: number,
 *   score: number|null, done: boolean, status: 'done'|'open' }>} */
export function getMockExams() {
  const saved = mockScores()
  return MOCK_EXAMS.map((m) => {
    const mine = saved[m.id]
    const seed = Number.isFinite(m.seedScore) ? m.seedScore : null
    const score = mine && Number.isFinite(mine.score) ? mine.score : seed
    const done = score !== null
    return {
      id: m.id,
      round: m.round,
      title: `${m.round}회차`,
      questions: pickMockQuestions(m.round).length,
      minutes: Math.max(0, Math.floor(Number(m.minutes) || 0)),
      score,
      done,
      status: done ? 'done' : 'open',
    }
  })
}

/** 모의고사 회차 문항. 과목을 섞은 묶음이고 LessonSheet로 푼다. 회차가 없거나 문항이 없으면 null
 * @param {string} mockId
 * @returns {{ kind: 'mock', mockId: string, subjectId: string, subjectName: string, nodeIndex: number,
 *   nodeLabel: string, review: boolean,
 *   questions: Array<{ q: string, o: string[], a: number, ex: string, subject: string }> } | null} */
export function getMockLesson(mockId) {
  const m = MOCK_EXAMS.find((x) => x.id === mockId)
  if (!m) return null
  const questions = pickMockQuestions(m.round)
  if (questions.length === 0) return null
  return {
    kind: 'mock',
    mockId: m.id,
    subjectId: '',
    subjectName: '모의고사',
    nodeIndex: -1,
    nodeLabel: `${m.round}회차 모의고사`,
    review: false,
    questions,
  }
}

/** 모의고사 회차 점수 저장(마지막 점수만 남긴다). 점수는 100점 만점으로 반올림
 * @param {string} mockId @param {{ correct: number, total: number }} result
 * @returns {{ score: number } | null} */
export function saveMockResult(mockId, result = {}) {
  if (!MOCK_EXAMS.some((x) => x.id === mockId)) return null
  const total = Math.max(1, Math.floor(Number(result.total) || 0))
  const correct = Math.min(total, Math.max(0, Math.floor(Number(result.correct) || 0)))
  const score = Math.round((correct / total) * 100)
  write(K.mockScores, { ...mockScores(), [mockId]: { score, correct, total, at: new Date().toISOString() } })
  return { score }
}

// ---------- 고른 과목 ----------

/** 로비에서 마지막으로 고른 과목 id. 준비 중인 과목도 고를 수 있다.
 * 고른 적이 없으면 config.js의 DEFAULT_SUBJECT_ID(정보기술), 그 과목에 문항이 없으면 문항이 있는 첫 과목 @returns {string|null} */
export function getSelectedSubject() {
  const id = read(K.subject, null)
  if (SUBJECT_LIST.some((c) => c.id === id)) return id
  if (findSubject(DEFAULT_SUBJECT_ID)) return DEFAULT_SUBJECT_ID
  return SUBJECTS[0]?.id ?? SUBJECT_LIST[0]?.id ?? null
}

/** @param {string} id */
export function setSelectedSubject(id) {
  if (SUBJECT_LIST.some((c) => c.id === id)) write(K.subject, id)
}
