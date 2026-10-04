// 대기실 입장 인원 시뮬레이션(가상 참가자). 화면은 이 함수들의 결과만 받아 그린다.
// 사람들이 시간이 갈수록 천천히 차오르고(가끔 몇 명은 나간다), 상한(cap)을 넘지 않는다.
// 185명에서 시작하면 입장 알림까지 합쳐 약 3분 뒤에 상한 근처에 닿는다.
// 무작위 값(Math.random)은 모두 여기서만 만든다.

const randInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1))
const pick = (list) => list[Math.floor(Math.random() * list.length)]

/** 처음 보이는 대기 인원. crowd.start = [최소, 최대] */
export function startCount(crowd, cap) {
  const [min, max] = crowd.start
  return Math.min(cap, randInt(min, max))
}

/** 숫자가 다음에 바뀔 때까지 기다리는 시간(ms) */
export function nextStepDelay() {
  return randInt(1800, 3200)
}

/** 숫자 한 번 바뀜: 대부분 1~3명이 더 들어오고, 가끔 1~2명이 나간다. 꽉 차면 몇 명이 나간다 */
export function step(count, cap) {
  if (count >= cap) return Math.max(1, cap - randInt(1, 2))
  const delta = Math.random() < 0.3 ? -randInt(1, 2) : randInt(1, 3)
  return Math.max(1, Math.min(cap, count + delta))
}

/** 다음 입장 알림까지 기다리는 시간(ms): 3~4초 */
export function nextNoticeDelay() {
  return randInt(3000, 4000)
}

/** 입장 알림 문구. 예: 'Assurance Los 김도윤 님 입장' */
export function entrantText(crowd) {
  return `${pick(crowd.los)} Los ${pick(crowd.names)} 님 입장`
}
