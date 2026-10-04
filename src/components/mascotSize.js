// 마스코트 그림 원본의 가로:세로(px). 높이를 정하면 폭을 미리 계산하는 데 쓴다.
const RATIO = { mamashell: 418 / 360, joy: 347 / 360 }

/** 높이 size일 때 마스코트 그림의 폭(px) */
export function mascotWidth(name, size) {
  return Math.round((RATIO[name] ?? 1) * size)
}
