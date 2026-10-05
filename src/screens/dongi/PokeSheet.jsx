import Sheet from '../../components/Sheet.jsx'
import Button3D from '../../components/Button3D.jsx'
import Avatar from './Avatar.jsx'
import s from './Sheets.module.css'

// 찌르기: 접속하지 않은 동기를 누르면 열린다. '푹 찌르기'를 누르면 onPoke(횟수 제한 없음)
export default function PokeSheet({ person, poke, onPoke, onClose }) {
  return (
    <Sheet open onClose={onClose} title={person.name}>
      <div className={s.poke}>
        <Avatar person={person} size={64} />
        <p className={s.pokeMsg}>{poke.message}</p>
      </div>
      <Button3D onClick={onPoke}>{poke.button}</Button3D>
    </Sheet>
  )
}
