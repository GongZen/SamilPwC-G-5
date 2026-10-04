import { Check, ChevronRight } from 'lucide-react'
import Sheet from '../../components/Sheet.jsx'
import { dateText } from './myData.js'
import s from './ScheduleSheet.module.css'

// 시험 일정 관리: 내 시험(연차) 고르기, 모의고사 회차, 아수(습)라장 일정을 한곳에서 본다.
// 디자인에는 이 시트가 없어서 MY 시안의 카드 모양에 맞춰 임시로 만들었다.
// 날짜와 회차는 시연용 가상 값이다(config.js의 EXAMS, 각 기능의 data 파일).
// onStartMock(회차 id): 아직 안 푼 회차 줄('응시하기 >')을 누르면 이 시트를 닫고 바로 모의고사를 연다
export default function ScheduleSheet({ exams, year, onPickYear, mocks, arena, arenaLabel, onStartMock, onClose }) {
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
              const status = m.score !== null ? `응시 완료 · ${m.score}점` : '응시 완료'
              const text = (
                <span className={s.text}>
                  <span className={s.title}>{m.title}</span>
                  {info && <span className={s.sub}>{info}</span>}
                </span>
              )
              if (m.done) {
                return (
                  <li key={m.id} className={s.row}>
                    {text}
                    <span className={`${s.status} ${s.statusDone}`}>{status}</span>
                  </li>
                )
              }
              // 안 푼 회차: 모의고사 시트처럼 '응시하기 >' 글자만 두고 줄 전체를 누르면 바로 시작
              return (
                <li key={m.id}>
                  <button type="button" className={`${s.row} ${s.rowBtn}`} onClick={() => onStartMock?.(m.id)}>
                    {text}
                    <span className={s.start}>응시하기</span>
                    <ChevronRight size={18} strokeWidth={2.2} className={s.chev} aria-hidden="true" />
                  </button>
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
