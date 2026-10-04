import { CircleX, EyeOff, Gift, Info, Users } from 'lucide-react'
import Button3D from '../../components/Button3D.jsx'
import MascotTalk from '../../components/MascotTalk.jsx'
import { fmt } from './format.js'
import s from './WaitingRoom.module.css'

// 마스코트를 누르면 하는 말(누를 때마다 차례로)
const JOY_LINES = ['공부 좀 했어요?']
const MAMASHELL_LINES = ['동기들 이겨 보자고요!']

// 대기실: 회차 소개, 서바이벌 규칙, 입장하기
export default function WaitingRoom({ round, onEnter }) {
  const { config } = round

  const rules = [
    {
      key: 'time',
      badge: String(config.secondsPerQuestion),
      text: `문제당 ${config.secondsPerQuestion}초, 시간이 끝나면 정답 공개`,
    },
    { key: 'wrong', Icon: CircleX, text: '틀리거나 답을 못 고르면 즉시 탈락' },
    config.leaveEliminates && { key: 'leave', Icon: EyeOff, text: '화면을 벗어나면 탈락 처리' },
    {
      key: 'prize',
      Icon: Gift,
      text: round.prize ? `최후 1인에게 경품 · ${round.prize}` : '최후 1인에게 경품',
    },
  ].filter(Boolean)

  return (
    <div className={s.wrap}>
      <div className={s.scroll}>
        <section className={s.hero}>
          {/* 위 줄은 조이와 마마쉘 자리를 비워 둔다(마스코트는 아래 .mascots에서 스크롤 밖에 고정).
              제목은 그 아래에 카드 폭 전체로 한 줄 */}
          <div className={s.heroTop}>
            {round.tagline && <span className={s.tagline}>{round.tagline}</span>}
          </div>
          {round.title && <h2 className={s.heroTitle}>{round.title}</h2>}
          <p className={s.waiting}>
            <Users size={20} strokeWidth={2} aria-hidden="true" />
            {fmt(config.maxParticipants)}명 입장 대기 중
          </p>
        </section>

        <section className={s.rules}>
          <h2 className={s.rulesTitle}>서바이벌 규칙</h2>
          <ul className={s.ruleList}>
            {rules.map(({ key, badge, Icon, text }) => (
              <li key={key} className={s.rule}>
                <span className={s.ruleIcon} aria-hidden="true">
                  {Icon ? <Icon size={20} strokeWidth={2} /> : badge}
                </span>
                <span className={s.ruleText}>{text}</span>
              </li>
            ))}
          </ul>
          <p className={s.notice}>
            <Info size={15} strokeWidth={2} aria-hidden="true" />
            가상 참가자와 함께 진행하는 시연용 퀴즈예요
          </p>
        </section>
      </div>

      {/* 조이와 마마쉘: 마스코트 배치판에서 정한 자리(393x852 기준 조이 왼쪽 221, 위 130, 마마쉘은 조이 오른쪽).
          스크롤 영역 밖에 두어 낮은 화면에서 카드를 스크롤해도 그 자리에 고정된다 */}
      <div className={s.mascots}>
        <MascotTalk name="joy" size={64} lines={JOY_LINES} side="top" align="center" />
        <MascotTalk name="mamashell" size={64} lines={MAMASHELL_LINES} side="top" align="end" />
      </div>

      <div className={s.footer}>
        <Button3D onClick={onEnter}>입장하기</Button3D>
      </div>
    </div>
  )
}
