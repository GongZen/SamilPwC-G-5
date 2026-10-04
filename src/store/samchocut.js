// 삼초컷 데이터 창구. 담당: 삼초컷 담당자.
// MY 화면이 쓰는 getMyPosts, getSavedPosts는 이름과 돌려주는 모양을 바꾸지 않는다.
// 함수는 더 만들어도 된다. 만들면 이 파일 맨 위 설명에 한 줄 추가한다.
// 더한 것: getSubjects(과목 칩 목록), parseKeys(키워드 입력값을 칸으로 나눔), LIMITS(입력란 글자 수 상한), getPost(글 하나)
// 과목 이름은 config.js의 SUBJECT_GROUPS를 따른다. 예전 이름(재무회계 등)으로 저장된 내 글도 지금 이름으로 보여 준다.
// 저장 키: samchocut.myPosts(내가 쓴 글), samchocut.liked(추천한 글 id), samchocut.saved(저장한 글 id, 저장한 순서)
// 샘플 글은 data/samchocut.json에 있고 고치지 않는다. 내 추천·저장은 샘플 수치에 1을 더해 보여 준다.
import { read, write } from './storage.js'
import { getSettings, maskName } from './user.js'
import { SUBJECTS, currentSubjectName } from '../config.js'
import data from '../data/samchocut.json'

const MY_POSTS_KEY = 'samchocut.myPosts'
const LIKED_KEY = 'samchocut.liked'
const SAVED_KEY = 'samchocut.saved'

const KEY_CHARS = 2 // 키워드 한 칸에 보이는 글자 수(디자인 기준)
const MAX_KEYS = 10 // 키워드 칸 수 상한(디자인에 없어 임시로 정함)

/** 공유 양식 입력란의 글자 수 상한(디자인에 없어 임시로 정함) */
export const LIMITS = { title: 30, keys: 40, line: 60 }

/** @typedef {{ id: string, subject: string, title: string, line: string, keys: string[],
 *   author: string, likes: number, liked: boolean, saved: boolean, mine: boolean, createdAt: string,
 *   desc: string, caps: string[], saves: number }} Post
 * 첫 두 줄의 칸은 MY와 약속한 모양이라 바꾸지 않는다.
 * 마지막 줄은 삼초컷 화면용으로 더한 칸이다. desc(카드 부제), caps(키워드 칸 아래 풀이, keys와 같은 길이, 없으면 ''),
 * saves(저장 수). likes와 saves는 내 추천·저장을 더한 값이다. */

/** 과목 칩 목록(config.js의 과목 이름, 그 순서대로)
 * @returns {string[]} */
export function getSubjects() {
  return SUBJECTS.map((x) => x.name)
}

/** 키워드 입력값을 칸으로 나눈다. 띄어쓰기로 구분하고, 한 칸은 앞 2글자만 쓴다.
 * 공유 양식의 미리보기와 addPost가 같은 규칙을 쓰도록 여기에 둔다.
 * @param {string} text @returns {string[]} */
export function parseKeys(text) {
  return String(text ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((k) => Array.from(k).slice(0, KEY_CHARS).join(''))
    .slice(0, MAX_KEYS)
}

/** 암기법 목록
 * @param {{ sort?: 'recommend'|'latest', subject?: string, query?: string }} [opts]
 * @returns {Post[]} */
export function listPosts({ sort = 'recommend', subject = '', query = '' } = {}) {
  const marks = readMarks()
  const q = String(query ?? '').trim().toLowerCase()
  const list = rawPosts()
    .map((p) => decorate(p, marks))
    .filter((p) => !subject || p.subject === subject)
    .filter((p) => !q || searchText(p).includes(q))
  return list.sort(sort === 'latest' ? byLatest : byRecommend)
}

/** 내 암기법 공유. user는 useUser()의 user({ name, dept })
 * 작성자는 '연차 + 가린 이름'(예: 1년차 김OO)으로 남긴다.
 * @param {{ subject: string, title: string, keys: string[], line: string }} post
 * @returns {Post | null} 제목이나 키워드가 비어 있으면 null */
export function addPost(post, user) {
  const title = clip(post?.title, LIMITS.title)
  const keys = parseKeys(Array.isArray(post?.keys) ? post.keys.join(' ') : '')
  if (!title || keys.length === 0) return null

  const subjects = getSubjects()
  const subject = subjects.includes(post?.subject) ? post.subject : (subjects[0] ?? '')
  const line = clip(post?.line, LIMITS.line)
  const year = getSettings().year === 2 ? 2 : 1

  // 한 줄 설명을 비우면 키워드로 부제와 설명을 채운다(디자인 동작)
  const item = {
    id: `u${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    subject,
    title,
    desc: line || keys.join(' · '),
    keys,
    caps: keys.map(() => ''),
    line: line || `“${keys.join('')}”`,
    author: `${year}년차 ${maskName(user?.name)}`,
    likes: 0,
    saves: 0,
    mine: true,
    createdAt: new Date().toISOString(),
  }
  write(MY_POSTS_KEY, [item, ...readMine()])
  return decorate(item, readMarks())
}

/** 글 하나(크게 보기 시트용). 없으면 null @param {string} id @returns {Post | null} */
export function getPost(id) {
  const raw = rawPosts().find((p) => p.id === id)
  return raw ? decorate(raw, readMarks()) : null
}

/** 추천 누르기·취소 @param {string} id @returns {Post | null} */
export function toggleLike(id) {
  return toggleMark(LIKED_KEY, id)
}

/** 저장 누르기·취소 @param {string} id @returns {Post | null} */
export function toggleSave(id) {
  return toggleMark(SAVED_KEY, id)
}

/** 내가 공유한 암기법(MY에서 씀). 최근에 쓴 글이 먼저 @returns {Post[]} */
export function getMyPosts() {
  const marks = readMarks()
  return readMine()
    .map((p) => decorate(p, marks))
    .sort(byLatest)
}

/** 저장한 암기법(MY에서 씀). 최근에 저장한 글이 먼저 @returns {Post[]} */
export function getSavedPosts() {
  const marks = readMarks()
  const byId = new Map(rawPosts().map((p) => [p.id, p]))
  return readIds(SAVED_KEY)
    .reverse()
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map((p) => decorate(p, marks))
}

// ---- 아래는 이 파일 안에서만 쓰는 도우미 ----

function readIds(key) {
  const v = read(key, [])
  return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []
}

function readMarks() {
  return { liked: new Set(readIds(LIKED_KEY)), saved: new Set(readIds(SAVED_KEY)) }
}

function isPost(p) {
  return Boolean(p) && typeof p.id === 'string' && typeof p.title === 'string' && Array.isArray(p.keys)
}

function readMine() {
  const v = read(MY_POSTS_KEY, [])
  return Array.isArray(v) ? v.filter(isPost) : []
}

// 내가 쓴 글 + 샘플 글
function rawPosts() {
  const seed = Array.isArray(data.posts) ? data.posts.filter(isPost) : []
  return [...readMine(), ...seed]
}

// 저장된 원본에 내 추천·저장 표시를 더해 화면용 Post로 만든다
function decorate(p, { liked, saved }) {
  const isLiked = liked.has(p.id)
  const isSaved = saved.has(p.id)
  const keys = p.keys.map((k) => String(k))
  const caps = Array.isArray(p.caps) ? p.caps : []
  return {
    id: p.id,
    subject: currentSubjectName(String(p.subject ?? '')),
    title: p.title,
    desc: String(p.desc ?? ''),
    keys,
    caps: keys.map((_, i) => String(caps[i] ?? '')),
    line: String(p.line ?? ''),
    author: String(p.author ?? ''),
    likes: (Number(p.likes) || 0) + (isLiked ? 1 : 0),
    saves: (Number(p.saves) || 0) + (isSaved ? 1 : 0),
    liked: isLiked,
    saved: isSaved,
    mine: p.mine === true,
    createdAt: String(p.createdAt ?? ''),
  }
}

function toggleMark(key, id) {
  const raw = rawPosts().find((p) => p.id === id)
  if (!raw) return null
  const ids = readIds(key)
  write(key, ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id])
  return decorate(raw, readMarks())
}

// 검색 대상: 주제, 부제, 키워드, 키워드 풀이(디자인 기준). 영문은 대소문자를 가리지 않는다.
function searchText(p) {
  return [p.title, p.desc, ...p.keys, ...p.caps].join(' ').toLowerCase()
}

function time(p) {
  return Date.parse(p.createdAt) || 0
}

function byLatest(a, b) {
  return time(b) - time(a)
}

// 추천 수가 같으면 최근 글이 먼저
function byRecommend(a, b) {
  return b.likes - a.likes || byLatest(a, b)
}

// 앞뒤 공백을 지우고 max 글자까지 자른다(이모지가 반으로 잘리지 않게 글자 단위로 자른다)
function clip(v, max) {
  return Array.from(String(v ?? '').trim()).slice(0, max).join('').trim()
}
