import s from './RollingNumber.module.css'

const DIGITS = '0123456789'.split('')

// 숫자가 바뀔 때 자리마다 위아래로 굴러가며 바뀐다(움직임 줄이기 설정이면 바로 바뀐다).
// 화면 읽기 프로그램은 label(없으면 숫자)을 읽는다.
export default function RollingNumber({ value, label }) {
  const digits = String(Math.max(0, Math.round(value))).split('')
  return (
    <span className={s.roll} role="img" aria-label={label ?? String(value)}>
      {digits.map((d, i) => (
        // 오른쪽 자리부터 같은 key를 써서 자릿수가 바뀌어도 일의 자리는 그대로 굴러간다
        <span key={digits.length - i} className={s.digit} aria-hidden="true">
          <span className={s.strip} style={{ transform: `translateY(${-Number(d) * 10}%)` }}>
            {DIGITS.map((n) => (
              <span key={n} className={s.cell}>
                {n}
              </span>
            ))}
          </span>
        </span>
      ))}
    </span>
  )
}
