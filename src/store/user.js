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
// studyRemind, asurajangAlert, mockAlert: 알림 설정 토글. 실제 알림은 보내지 않는다(설정만 저장).
const DEFAULT_SETTINGS = { year: 1, studyRemind: true, asurajangAlert: true, mockAlert: false }

export function getSettings() {
  return { ...DEFAULT_SETTINGS, ...read(SETTINGS_KEY, {}) }
}

export function setSetting(name, value) {
  return write(SETTINGS_KEY, { ...getSettings(), [name]: value })
}

// 선택한 연차의 시험 정보와 D-day. 날짜는 시연용 가상 값이다.
export function getExam(year = getSettings().year) {
  const exam = EXAMS[year] || EXAMS[1]
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const day = new Date(exam.date + 'T00:00:00')
  const diff = Math.round((day - today) / 86400000)
  const dday = diff > 0 ? `D-${diff}` : diff === 0 ? 'D-DAY' : `D+${-diff}`
  return { ...exam, year, daysLeft: diff, dday }
}
