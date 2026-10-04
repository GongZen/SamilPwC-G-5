import { useEffect, useState } from 'react'
import { CircleX, EyeOff, Gift, Users } from 'lucide-react'
import Button3D from '../../components/Button3D.jsx'
import MascotTalk from '../../components/MascotTalk.jsx'
import RollingNumber from './RollingNumber.jsx'
import { entrantText, nextNoticeDelay, nextStepDelay, startCount, step } from './crowd.js'
import s from './WaitingRoom.module.css'

// 대기실을 연 뒤 첫 입장 알림까지(ms)
const FIRST_NOTICE_MS = 1200

// 마스코트를 누르면 하는 말(누를 때마다 차례로)
const JOY_LINES = ['공부 좀 했어요?']
const MAMASHELL_LINES = ['동기들 이겨 보자고요!']

// 대기실: 회차 소개, 서바이벌 규칙, 입장하기.
// 대기 인원은 가상 참가자로 시간이 갈수록 차오르고(가끔 몇 명은 나감) 숫자가 굴러가며 바뀐다.
// 'N명 대기 중' 오른쪽에 3~4초마다 'Assurance Los 김도윤 님 입장' 같은 알림이 잠깐 뜨고 1명이 늘어난다(상한 config.maxParticipants).
// 입장하기를 누르면 onEnter(인원)로 그 순간 화면에 보이던 인원을 넘겨 퀴즈 시작 인원으로 쓴다(로그인 창을 거쳐도 같은 인원).
export default function WaitingRoom({ round, onEnter, onExit }) {
  const { config, crowd } = round
  const cap = config.maxParticipants
  const [count, setCount] = useState(() => startCount(crowd, cap))
  const [notice, setNotice] = useState(null) // { id, text }. id가 바뀌면 알림 움직임이 처음부터 다시 돈다

  // 인원 변화: 1.8~3.2초마다 몇 명이 들어오거나 나간다
  useEffect(() => {
    let timer
    const tick = () => {
      setCount((c) => step(c, cap))
      timer = setTimeout(tick, nextStepDelay())
    }
    timer = setTimeout(tick, nextStepDelay())
    return () => clearTimeout(timer)
  }, [cap])

  // 입장 알림: 3~4초마다 한 명씩
  useEffect(() => {
    let timer
    let id = 0
    const show = () => {
      id += 1
      setNotice({ id, text: entrantText(crowd) })
      setCount((c) => Math.min(cap, c + 1))
      timer = setTimeout(show, nextNoticeDelay())
    }
    timer = setTimeout(show, FIRST_NOTICE_MS)
    return () => clearTimeout(timer)
  }, [cap, crowd])

  const rules = [
    {
      key: 'time',
      badge: String(config.secondsPerQuestion),
      text: `문제당 ${config.secondsPerQuestion}초, 시간이 끝나면 정답 공개`,
    },
    { key: 'wrong', Icon: CircleX, text: '틀리거나 답을 고르지 못하면 탈락' },
    config.leaveEliminates && { key: 'leave', Icon: EyeOff, text: '화면을 벗어나도 탈락' },
    {
      key: 'prize',
      Icon: Gift,
      text: round.prize ? `최후 1인에게 경품 · ${round.prize}` : '최후 1인에게 경품',
    },
  ].filter(Boolean)

  return (
    <div className={s.wrap}>
      {/* 맨 위 배너 카드는 스크롤하지 않는다. 조이와 마마쉘도 카드 안 제자리에 고정된다(마스코트 배치판에서 정한 자리).
          작은 제목은 카드 왼쪽 맨 위, 큰 제목은 작은 제목과 입장 대기 줄 사이의 세로 가운데에 마스코트에 닿지 않는 크기로 한 줄 */}
      <section className={s.hero}>
        {round.tagline && <span className={s.tagline}>{round.tagline}</span>}
        <div className={s.titleBox}>{round.title && <h2 className={s.heroTitle}>{round.title}</h2>}</div>
        <div className={s.mascots}>
          <MascotTalk name="joy" size={64} lines={JOY_LINES} side="top" align="center" />
          <MascotTalk name="mamashell" size={64} lines={MAMASHELL_LINES} side="top" align="end" />
        </div>
        {/* 한 줄: 왼쪽 'N명 대기 중'(이미 들어와 기다리는 인원), 오른쪽 입장 알림 */}
        <p className={s.waiting}>
          <Users size={18} strokeWidth={2} className={s.waitingIcon} aria-hidden="true" />
          <span className={s.waitingCount}>
            <RollingNumber value={count} />명 대기 중
          </span>
          <span className={s.entrySlot} aria-hidden="true">
            {notice && (
              <span key={notice.id} className={s.entry}>
                {notice.text}
              </span>
            )}
          </span>
        </p>
      </section>

      {/* 낮은 화면에서는 규칙 목록만 스크롤한다 */}
      <div className={s.scroll}>
        {/* 규칙 제목은 화면에 쓰지 않는다(화면 읽기 프로그램용 이름만). 가상 참가자 안내는 MY 공지사항에 있다 */}
        <section className={s.rules} aria-label="서바이벌 규칙">
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
        </section>
      </div>

      <div className={s.footer}>
        <Button3D className={s.footerBtn} onClick={() => onEnter(count)}>
          입장하기
        </Button3D>
        <Button3D tone="plain" className={s.footerBtn} onClick={onExit}>
          나가기
        </Button3D>
      </div>
    </div>
  )
}
