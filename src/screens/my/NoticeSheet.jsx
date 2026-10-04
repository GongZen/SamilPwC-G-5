import { TABS } from '../../config.js'
import Sheet from '../../components/Sheet.jsx'
import s from './NoticeSheet.module.css'

const ARENA = TABS.find((t) => t.id === 'asurajang')?.label ?? ''

// 공지사항: 시연용 앱이라는 사실과 기록이 저장되는 방식을 알린다.
// 디자인에는 이 시트가 없어서 임시 문구로 만들었다. 문구는 콘텐츠팀이 확정한다.
const NOTICES = [
  {
    id: 'demo',
    title: '시연용 앱이에요',
    body: '문항과 암기법은 공개 기준서를 바탕으로 팀이 직접 만든 샘플이고, 추천 수는 가상 값이에요. 실제 시험 문제나 사내 자료가 아니에요.',
  },
  {
    id: 'source',
    title: '정보기술 문항 출처',
    body: '회계감사기준서 315와 일반 IT',
  },
  {
    id: 'dates',
    title: '시험 일정은 가상 날짜예요',
    body: `시험일과 ${ARENA} 일정은 시연을 위해 정한 날짜예요.`,
  },
  {
    id: 'arena',
    title: `${ARENA} 참가자 안내`,
    body: '함께 겨루는 참가자, 대기실 입장 알림에 나오는 이름과 Los, 생존자 수는 모두 가상으로 만든 시뮬레이션이에요.',
  },
  {
    id: 'alert',
    title: '알림은 설정만 저장돼요',
    body: '학습 리마인드와 오픈 알림은 켜고 끈 상태만 저장하고, 실제 알림은 보내지 않아요.',
  },
  {
    id: 'storage',
    title: '기록은 이 기기에만 남아요',
    body: '이름, Los, 학습 기록, 공유한 암기법은 이 브라우저에만 저장되고 어디에도 보내지 않아요. 다른 기기에서는 이어지지 않아요.',
  },
]

export default function NoticeSheet({ onClose }) {
  return (
    <Sheet open onClose={onClose} title="공지사항">
      <ul className={s.list}>
        {NOTICES.map((n) => (
          <li key={n.id} className={s.item}>
            <h3 className={s.title}>{n.title}</h3>
            <p className={s.body}>{n.body}</p>
          </li>
        ))}
      </ul>
    </Sheet>
  )
}
