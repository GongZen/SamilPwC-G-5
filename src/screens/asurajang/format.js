// 아수(습)라장 화면에서 쓰는 글자 다듬기

/** 숫자에 천 단위 쉼표. 예: 1203 > 1,203 */
export function fmt(n) {
  return Number(n).toLocaleString('ko-KR')
}

/** 받침에 맞춰 '로' 또는 '으로'를 붙인다. 예: 삼일 끝내기 > 삼일 끝내기로 */
export function withRo(word) {
  const code = word.charCodeAt(word.length - 1) - 0xac00
  if (!(code >= 0 && code <= 11171)) return `${word}로`
  const last = code % 28 // 0: 받침 없음, 8: ㄹ 받침
  return last === 0 || last === 8 ? `${word}로` : `${word}으로`
}

/** '아수(습)라장'처럼 괄호가 든 이름을 [앞, 괄호 속, 뒤]로 나눈다. 괄호가 없으면 null */
export function splitMark(label) {
  const m = /^(.*)\((.+?)\)(.*)$/.exec(label)
  return m ? [m[1], m[2], m[3]] : null
}
