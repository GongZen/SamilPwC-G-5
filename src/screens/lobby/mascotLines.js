// 삼일 끝내기 마마쉘이 누를 때마다 차례로 하는 말. 지금 단계는 앱의 실제 값을 넣는다.
// 한 줄은 글자이거나 { parts, ms }다. parts는 글자, '\n'(줄바꿈), { image, text, imageLeft }(글자 위에 그림을 얹은 칸)를
// 섞은 목록이고, ms는 그 대사만 따로 떠 있는 시간이다(MascotTalk.jsx).
import moneyBag from '../../assets/emoji/money-bag.png'
import airplane from '../../assets/emoji/airplane.png'

// 받침이 있으면 '이에요', 없으면 '예요'. 한글이 아니면 '이에요'
function withIeyo(word) {
  const code = word.charCodeAt(word.length - 1) - 0xac00
  if (!(code >= 0 && code <= 11171)) return `${word}이에요`
  return code % 28 === 0 ? `${word}예요` : `${word}이에요`
}

// 시험 우수자 혜택(시연용 예시, MY 공지사항에 밝힌다). 그림은 Microsoft Fluent Emoji 3D(MIT, src/assets/emoji/LICENSE).
// 세 줄로 나누고, 두 그림을 같은 세로선에 놓는다: 그림 왼쪽 끝이 줄 시작에서 STACK_X만큼이라 그림 가운데가 '만원' 가운데(약 37px)에 온다.
// 문장이 길어 4.5초 동안 띄운다(다른 대사는 2.8초)
const STACK_X = 21
const REWARD = {
  ms: 4500,
  parts: [
    '수습 시험 우수자에게는',
    '\n',
    { image: moneyBag, text: '100만원 상당의 마일리지', imageLeft: STACK_X },
    '와',
    '\n',
    { image: airplane, text: '해외 연수 기회', imageLeft: STACK_X },
    '까지 줄 생각이에요!',
  ],
}

/**
 * @param {{ subject: { name: string, ready: boolean }, units: Array<{ status: string, waiting: boolean, label: string }> }} v
 * @returns {Array<string | { ms?: number, parts: Array<string | { image: string, text: string, imageLeft?: number }> }>}
 */
export function lobbyLines({ subject, units }) {
  const lines = ['오늘도 오셨군요!', REWARD]

  const current = units.find((u) => u.status === 'current')
  if (!subject.ready) lines.push(`${subject.name} 문항은 준비하고 있어요`)
  else if (current?.waiting) lines.push('오늘 단계는 끝냈어요. 다음 단계는 내일 열려요')
  else if (current) lines.push(`오늘 배울 단계는 ${withIeyo(current.label)}`)
  else lines.push(`${subject.name} 단계를 모두 끝냈어요`)
  return lines
}
