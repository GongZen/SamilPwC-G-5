// 스피드 퀴즈 계산(화면과 따로 둔 함수). 상대(가상 동기)의 답도 여기서 정한다.

/** 점수: 맞히면 100점에 빠를수록 최대 50점(남은 시간 비율만큼), 틀리거나 시간 초과면 0점 */
export function points(correct, t, limit) {
  return correct ? 100 + Math.round(50 * Math.max(0, 1 - t / limit)) : 0
}

/** 가상 동기의 답. 진도가 높을수록 잘 맞히고 조금 더 빠르다. 시간 안에 못 고르면 pick이 null
 * @returns {{ pick: number|null, t: number, correct: boolean }} */
export function botAnswer(person, question, limit) {
  const p = (Number(person.pct) || 0) / 100
  const correct = Math.random() < 0.45 + p * 0.45
  const t = Math.round((1.6 + Math.random() * 6.4 - p * 1.2) * 10) / 10
  if (t > limit - 0.3 && Math.random() < 0.5) return { pick: null, t: limit, correct: false }
  const wrong = question.o.map((_, i) => i).filter((i) => i !== question.a)
  const pick = correct ? question.a : wrong[Math.floor(Math.random() * wrong.length)]
  return { pick, t: Math.min(limit, Math.max(0.8, t)), correct }
}

/** 순위: 총점이 높은 순, 같으면 많이 맞힌 순, 그것도 같으면 정답에 걸린 시간 합이 짧은 순 */
export function rankPlayers(players, totals) {
  return [...players].sort((a, b) => {
    const A = totals[a.id]
    const B = totals[b.id]
    return B.pts - A.pts || B.ok - A.ok || A.time - B.time
  })
}
