import Sheet from './Sheet.jsx'
import Button3D from './Button3D.jsx'
import { getPlan } from '../store/lobby.js'
import { getExam } from '../store/user.js'
import s from './ExitConfirm.module.css'

// 나가기 확인 창 두 가지. 모양은 아수(습)라장의 '지금 나갈까요?' 창과 같다.
//
// ExitConfirm: 홈 화면에 설치한 앱의 첫 화면에서 뒤로 가기를 누르면 뜬다(App.jsx, backStack.js).
//   한 번 더 뒤로 가면 앱이 닫혀야 하므로 이 창은 뒤로 가기로 닫히지 않는다(backClose={false}).
//   앱을 대신 닫는 버튼은 둘 수 없다(브라우저가 스크립트로 창을 닫지 못하게 한다).
//   덧붙이는 한 줄: 오늘 할 일이 남았으면 그 수, 없거나 다 했으면 MY에서 고른 연차의 시험 D-day.
// QuitConfirm: 학습, 모의고사, 스피드 퀴즈 도중에 나가려 하면 뜬다(X 버튼, 뒤로 가기, Esc 모두).
//   뒤로 가기를 한 번 더 누르면 이 창만 닫히고 계속한다. 그만두기는 버튼으로만 한다.
export default function ExitConfirm({ open, onStay }) {
  let line = ''
  if (open) {
    const plan = getPlan()
    const left = plan.total - plan.done
    const exam = getExam()
    line = left > 0 ? `오늘 할 일 ${left}개가 남았어요!` : `${exam.name}까지 ${exam.dday}`
  }
  return (
    <Sheet
      open={open}
      onClose={onStay}
      title="정말 여기까지만 공부하실 건가요...?"
      showClose={false}
      backClose={false}
    >
      <p className={s.line}>{line}</p>
      <div className={s.actions}>
        <Button3D onClick={onStay}>계속 공부하기</Button3D>
        <p className={s.hint}>한 번 더 뒤로 가면 앱이 닫혀요</p>
      </div>
    </Sheet>
  )
}

// text: 그만두면 무엇이 저장되지 않는지 한두 문장. onStay: 계속하기, onQuit: 그만두고 닫기
export function QuitConfirm({ open, text, onStay, onQuit }) {
  return (
    <Sheet open={open} onClose={onStay} title="그만할까요?" showClose={false}>
      <p className={s.text}>{text}</p>
      <div className={s.actions}>
        <Button3D onClick={onStay}>계속하기</Button3D>
        <button type="button" className={s.quit} onClick={onQuit}>
          그만하기
        </button>
      </div>
    </Sheet>
  )
}
