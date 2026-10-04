// localStorage 읽기·쓰기는 이 파일에서만 한다. 다른 파일은 read, write, remove만 부른다.
// 저장이 막힌 브라우저(일부 앱 안 브라우저, 사생활 보호 모드)에서는 이번 접속 동안만 메모리에 보관한다.

const PREFIX = 'samil-kkeutnaegi:'
const memory = new Map()

export function read(key, fallback) {
  const k = PREFIX + key
  if (memory.has(k)) return memory.get(k)
  try {
    const raw = window.localStorage.getItem(k)
    if (raw === null) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function write(key, value) {
  const k = PREFIX + key
  try {
    window.localStorage.setItem(k, JSON.stringify(value))
    memory.delete(k)
  } catch {
    memory.set(k, value)
  }
  return value
}

export function remove(key) {
  const k = PREFIX + key
  memory.delete(k)
  try {
    window.localStorage.removeItem(k)
  } catch {
    // 저장소를 쓸 수 없으면 메모리에서만 지운다
  }
}
