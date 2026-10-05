import Sheet from '../../components/Sheet.jsx'
import Button3D from '../../components/Button3D.jsx'
import Avatar from './Avatar.jsx'
import s from './Sheets.module.css'

// 찌르기: 접속하지 않은 동기를 누르면 열린다. '푹 찌르기'를 누르면 onPoke(이번 접속에서 이미 찔렀으면 막힘)
export default function PokeSheet({ person, poke, done, onPoke, onClose }) {
  return (
    <Sheet open onClose={onClose} title={person.name}>
      <div className={s.poke}>
        <Avatar person={person} size={64} />
        <p className={s.pokeMsg}>{poke.message}</p>
      </div>
      <Button3D disabled={done} onClick={onPoke}>
        {done ? '이미 찔렀어요' : poke.button}
      </Button3D>
    </Sheet>
  )
}
