import { Check } from 'lucide-react'
import Sheet from '../../components/Sheet.jsx'
import { dateText } from './myData.js'
import s from './ScheduleSheet.module.css'

// 시험 일정 관리: 내 시험(연차) 고르기, 모의고사 회차, 아수(습)라장 일정을 한곳에서 본다.
// 디자인에는 이 시트가 없어서 MY 시안의 카드 모양에 맞춰 임시로 만들었다.
// 날짜와 회차는 시연용 가상 값이다(config.js의 EXAMS, 각 기능의 data 파일).
export default function ScheduleSheet({ exams, year, onPickYear, mocks, arena, arenaLabel, onClose }) {
  return (
    <Sheet open onClose={onClose} title="시험 일정 관리">
      <section className={s.group}>
        <h3 className={s.groupTitle}>종합평가</h3>
        <ul className={s.list}>
          {exams.map((e) => {
            const on = e.year === year
            const date = dateText(e.date, true)
            return (
              <li key={e.year}>
                <button
                  type="button"
                  className={on ? `${s.exam} ${s.examOn}` : s.exam}
                  aria-pressed={on}
                  onClick={() => onPickYear(e.year)}
                >
                  <span className={on ? `${s.radio} ${s.radioOn}` : s.radio} aria-hidden="true">
                    {on && <Check size={14} strokeWidth={3.5} />}
                  </span>
                  <span className={s.text}>
                    <span className={s.title}>{e.name}</span>
                    {date && <span className={s.sub}>{date}</span>}
                  </span>
                  <span className={on ? `${s.dday} ${s.ddayOn}` : s.dday}>{e.dday}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <section className={s.group}>
        <h3 className={s.groupTitle}>모의고사</h3>
        {mocks.length > 0 ? (
          <ul className={s.list}>
            {mocks.map((m) => {
              const info = [m.questions > 0 && `${m.questions}문항`, m.minutes > 0 && `${m.minutes}분`]
                .filter(Boolean)
                .join(' · ')
              let status = '언제든 응시'
              if (m.done) status = m.score !== null ? `응시 완료 · ${m.score}점` : '응시 완료'
              return (
                <li key={m.id} className={s.row}>
                  <span className={s.text}>
                    <span className={s.title}>{m.title}</span>
                    {info && <span className={s.sub}>{info}</span>}
                  </span>
                  {status && (
                    <span className={m.done ? `${s.status} ${s.statusDone}` : s.status}>{status}</span>
                  )}
                </li>
              )
            })}
          </ul>
        ) : (
          <p className={s.hint}>예정된 모의고사가 없어요</p>
        )}
      </section>

      {arena && (
        <section className={s.group}>
          <h3 className={s.groupTitle}>{arenaLabel}</h3>
          <div className={s.row}>
            <span className={s.text}>
              <span className={s.title}>{arena.subtitle || arenaLabel}</span>
              {arena.subjects && <span className={s.sub}>{arena.subjects}</span>}
            </span>
            {arena.schedule && <span className={s.status}>{arena.schedule}</span>}
          </div>
        </section>
      )}

    </Sheet>
  )
}
