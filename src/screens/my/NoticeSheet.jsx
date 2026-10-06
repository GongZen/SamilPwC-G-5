import { TABS } from '../../config.js'
import Sheet from '../../components/Sheet.jsx'
import { readSources } from './myData.js'
import s from './NoticeSheet.module.css'

const ARENA = TABS.find((t) => t.id === 'asurajang')?.label ?? ''
const DONGI = TABS.find((t) => t.id === 'dongi')?.label ?? ''

// 공지사항: 시연용 앱이라는 사실과 기록이 저장되는 방식을 알린다.
// 디자인에는 이 시트가 없어서 임시 문구로 만들었다. 문구는 콘텐츠팀이 확정한다.
// 문항 출처는 과목 데이터(source)에서 읽어, 출처가 있는 과목만 한 줄씩 보여 준다(예: 정보기술 · 회계감사기준서 315와 일반 IT).
// body는 한 문장(글자) 또는 여러 줄(배열)이다.
function notices() {
  const sources = readSources().map((x) => `${x.name} · ${x.source}`)
  return [
    {
      id: 'demo',
      title: '시연용 앱이에요',
      body: '문항과 암기법은 공개 기준서를 바탕으로 팀이 직접 만든 샘플이고, 추천 수는 가상 값이에요. 실제 시험 문제나 사내 자료가 아니에요.',
    },
    ...(sources.length > 0 ? [{ id: 'source', title: '문항 출처', body: sources }] : []),
    {
      id: 'dates',
      title: '시험 일정은 가상 날짜예요',
      body: `시험일과 ${ARENA} 일정은 시연을 위해 정한 날짜예요.`,
    },
    {
      id: 'reward',
      title: '시험 우수자 혜택은 시연용 예시예요',
      body: '마마쉘이 말하는 시험 우수자 혜택(100만원 상당의 마일리지와 해외 연수 기회)은 시연을 위해 정한 예시예요. 실제로 정해진 혜택이 아니에요.',
    },
    {
      id: 'arena',
      title: `${ARENA} 참가자 안내`,
      body: '함께 겨루는 참가자, 대기실 입장 알림에 나오는 이름과 Los, 생존자 수는 모두 가상으로 만든 시뮬레이션이에요.',
    },
    {
      id: 'dongi',
      title: `${DONGI} 안내`,
      body: '동기들의 진도와 접속 표시, 스피드 퀴즈 상대의 답과 속도는 시연용 가상 값이에요. 찌르기를 눌러도 실제 알림은 가지 않아요.',
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
}

export default function NoticeSheet({ onClose }) {
  return (
    <Sheet open onClose={onClose} title="공지사항">
      <ul className={s.list}>
        {notices().map((n) => (
          <li key={n.id} className={s.item}>
            <h3 className={s.title}>{n.title}</h3>
            {Array.isArray(n.body) ? (
              <ul className={s.lines}>
                {n.body.map((line) => (
                  <li key={line} className={s.body}>
                    {line}
                  </li>
                ))}
              </ul>
            ) : (
              <p className={s.body}>{n.body}</p>
            )}
          </li>
        ))}
      </ul>
    </Sheet>
  )
}
