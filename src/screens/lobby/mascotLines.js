// 삼일 끝내기 마마쉘이 누를 때마다 차례로 하는 말. 앱의 실제 값(연속 학습일, D-day, 지금 단계, 오답 수)을 넣는다.

// 받침이 있으면 '이에요', 없으면 '예요'. 한글이 아니면 '이에요'
function withIeyo(word) {
  const code = word.charCodeAt(word.length - 1) - 0xac00
  if (!(code >= 0 && code <= 11171)) return `${word}이에요`
  return code % 28 === 0 ? `${word}예요` : `${word}이에요`
}

/**
 * @param {{ subject: { name: string, ready: boolean }, units: Array<{ status: string, waiting: boolean, label: string }>,
 *   streak: number, exam: { name: string, daysLeft: number }, wrongCount: number }} v
 * @returns {string[]}
 */
export function lobbyLines({ subject, units, streak, exam, wrongCount }) {
  const lines = ['오늘도 오셨군요!']

  lines.push(streak > 0 ? `연속 ${streak}일째예요. 오늘도 이어 가요` : '오늘 한 단계만 끝내도 연속 학습이 시작돼요')

  if (exam.daysLeft > 0) lines.push(`${exam.name}까지 ${exam.daysLeft}일 남았어요`)
  else if (exam.daysLeft === 0) lines.push(`오늘이 ${exam.name} 날이에요`)

  const current = units.find((u) => u.status === 'current')
  if (!subject.ready) lines.push(`${subject.name} 문항은 준비하고 있어요`)
  else if (current?.waiting) lines.push('오늘 단계는 끝냈어요. 다음 단계는 내일 열려요')
  else if (current) lines.push(`오늘 배울 단계는 ${withIeyo(current.label)}`)
  else lines.push(`${subject.name} 단계를 모두 끝냈어요`)

  lines.push(wrongCount > 0 ? '틀린 문제는 오답노트에 챙겨뒀어요!' : '틀린 문제는 오답노트에 챙겨 둘게요!')
  return lines
}
