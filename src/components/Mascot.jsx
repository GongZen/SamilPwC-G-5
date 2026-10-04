import mamashell from '../assets/mascots/mamashell.png'
import joy from '../assets/mascots/joy.png'
import { mascotWidth } from './mascotSize.js'
import s from './Mascot.module.css'

// 삼일미래재단 마스코트(사용 허락). 마마쉘은 삼일 끝내기·MY·아수(습)라장, 조이는 삼초컷·아수(습)라장.
// 원본 포즈 그대로 이미지만 보여 준다. size는 높이(px)다. 누르면 말하게 하려면 MascotTalk를 쓴다.
const SRC = { mamashell, joy }

export default function Mascot({ name, size = 72, className = '' }) {
  return (
    <img
      src={SRC[name]}
      alt=""
      aria-hidden="true"
      draggable="false"
      className={[s.mascot, className].filter(Boolean).join(' ')}
      style={{ height: size, width: mascotWidth(name, size) }}
    />
  )
}
