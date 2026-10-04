// 간편 로그인, 사용자 설정, 시험 일정(D-day). 화면에서 로그인 정보를 쓸 때는 useUser()를 쓴다.
import { read, remove, write } from './storage.js'
import { EXAMS } from '../config.js'

const USER_KEY = 'user'
const SETTINGS_KEY = 'settings'

/** @returns {{ name: string, dept: string, since: string } | null} */
export function getUser() {
  const u = read(USER_KEY, null)
  return u && typeof u.name === 'string' && typeof u.dept === 'string' ? u : null
}

export function login(name, dept) {
  const user = {
    name: String(name).trim().slice(0, 20),
    dept: String(dept).trim().slice(0, 30),
    since: new Date().toISOString(),
  }
  return write(USER_KEY, user)
}

export function logout() {
  remove(USER_KEY)
}

// 다른 사람에게 보이는 이름은 가린다. 예: 김삼일 → 김OO
export function maskName(name) {
  const n = String(name || '').trim()
  if (!n) return '익명'
  return n[0] + 'OO'
}

// year: 1(기본실무과정) | 2(외부감사실무과정)
// studyRemind, asurajangAlert: 알림 설정 토글. 실제 알림은 보내지 않는다(설정만 저장). 모의고사는 언제든 응시해서 알림이 없다.
const DEFAULT_SETTINGS = { year: 1, studyRemind: true, asurajangAlert: true }

export function getSettings() {
  return { ...DEFAULT_SETTINGS, ...read(SETTINGS_KEY, {}) }
}

export function setSetting(name, value) {
  return write(SETTINGS_KEY, { ...getSettings(), [name]: value })
}

// 선택한 연차의 시험 정보와 D-day. 날짜는 시연용 가상 값으로, 오늘부터 config.js의 daysFromToday일 뒤다.
// date는 'YYYY-MM-DD'(MY의 시험일 표시에 쓴다), sameYear는 시험일이 올해인지(아니면 MY가 연도를 붙인다).
export function getExam(year = getSettings().year) {
  const exam = EXAMS[year] || EXAMS[1]
  const days = Math.round(Number(exam.daysFromToday) || 0)
  const now = new Date()
  const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days)
  const date = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`
  const dday = days > 0 ? `D-${days}` : days === 0 ? 'D-DAY' : `D+${-days}`
  return { ...exam, year, date, sameYear: day.getFullYear() === now.getFullYear(), daysLeft: days, dday }
}
