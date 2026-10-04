import { Check } from 'lucide-react'
import Sheet from '../../components/Sheet.jsx'
import { dateText } from './myData.js'
import s from './ScheduleSheet.module.css'

// 시험 일정 관리: 내가 준비하는 종합평가(1년차, 2년차)만 고른다. 고른 시험으로 D-day를 계산한다.
// 모의고사와 아수(습)라장은 이 시트에 넣지 않는다(각자 자기 화면과 MY 내 활동에서 연다).
// 디자인에는 이 시트가 없어서 MY 시안의 카드 모양에 맞춰 임시로 만들었다.
// 날짜는 시연용 가상 값이다(config.js의 EXAMS).
export default function ScheduleSheet({ exams, year, onPickYear, onClose }) {
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
    </Sheet>
  )
}
