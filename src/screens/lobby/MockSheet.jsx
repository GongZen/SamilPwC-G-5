import { ChevronRight } from 'lucide-react'
import Sheet from '../../components/Sheet.jsx'
import s from './MockSheet.module.css'

// 모의고사 회차 시트. 오늘 열리는 회차는 오픈 알림을 켜고 끌 수 있다(설정만 저장, 실제 알림은 없다).
// 실제 회차 응시 화면은 디자인에 없어서, 오늘 회차는 과목을 섞은 짧은 '미리 풀어보기'로 언제든 체험하게 한다.
// 회차 상태와 오픈 시각은 시연용 값이다. 오늘 회차는 오픈 시각이 지나면 '내일'로 보인다(store가 계산).
export default function MockSheet({ exams, alertOn, onToggleAlert, onPreview, onClose }) {
  return (
    <Sheet open onClose={onClose} title="모의고사">
      {exams.map((m) => {
        const meta = `${m.questions}문항 · ${m.minutes}분 · ${m.openLabel}`

        if (m.status === 'today') {
          return (
            <div key={m.id} className={s.today}>
              <div className={s.row}>
                <div className={s.col}>
                  <span className={s.title}>{m.title}</span>
                  <span className={s.meta}>{meta}</span>
                </div>
                {m.dayLabel && <span className={s.pill}>{m.dayLabel}</span>}
              </div>
              <button
                type="button"
                className={alertOn ? `${s.alert} ${s.alertOn}` : s.alert}
                onClick={onToggleAlert}
                aria-pressed={alertOn}
              >
                {alertOn ? `알림 예약됨 · ${m.alertTime}에 알려드려요` : '오픈 알림 받기'}
              </button>
              {m.previewCount > 0 && (
                <button type="button" className={s.preview} onClick={() => onPreview(m.id)}>
                  {m.previewCount}문항 미리 풀어보기
                  <ChevronRight size={18} strokeWidth={2.2} aria-hidden="true" />
                </button>
              )}
            </div>
          )
        }

        if (m.status === 'done') {
          return (
            <div key={m.id} className={s.card}>
              <div className={s.col}>
                <span className={s.title}>{m.title}</span>
                <span className={s.meta}>{meta}</span>
              </div>
              {m.score !== null && (
                <span className={s.scoreBox}>
                  {m.sample && <span className={s.sample}>예시</span>}
                  <span className={s.score}>{m.score}점</span>
                </span>
              )}
            </div>
          )
        }

        return (
          <div key={m.id} className={`${s.card} ${s.upcoming}`}>
            <span className={s.title}>{m.title}</span>
            <span className={s.meta}>{meta}</span>
          </div>
        )
      })}
    </Sheet>
  )
}
