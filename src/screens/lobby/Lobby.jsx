import { useEffect, useRef, useState } from 'react'
import { BookOpen, CalendarCheck, Check, ChevronDown, FileText, Flame, List, NotebookPen } from 'lucide-react'
import {
  getLesson,
  getMockExams,
  getMockLesson,
  getPlan,
  getProgress,
  getSelectedSubject,
  getSubjects,
  getUnits,
  getWrongNotes,
  hasSampleStart,
  removeWrongNote,
  setSelectedSubject,
  togglePlanItem,
} from '../../store/lobby.js'
import { getExam, getSettings, setSetting } from '../../store/user.js'
import { EXAMS, SUBJECT_GROUPS } from '../../config.js'
import { lobbyLines } from './mascotLines.js'
import LearningPath from './LearningPath.jsx'
import LessonSheet from './LessonSheet.jsx'
import WrongNoteSheet from './WrongNoteSheet.jsx'
import PlanSheet from './PlanSheet.jsx'
import MockSheet from './MockSheet.jsx'
import s from './Lobby.module.css'

// 토스트를 보여 주는 시간(ms)
const TOAST_MS = 2600

// 다른 탭에서 바로 열 수 있는 시트(MY의 오답노트·모의고사 칸)
const SHEETS = ['wrong', 'plan', 'mock']

// 삼일 끝내기(로비). 과목 선택, 단원 카드, 징검다리 학습 경로, 모의고사·오답노트·진도 계획.
// 데이터는 모두 store/lobby.js 함수로 읽고 쓴다. 바꾼 뒤에는 refresh()로 다시 그린다.
// entry.sheet가 있으면 그 시트를 연 채로 시작한다(예: MY에서 오답노트를 눌렀을 때).
export default function Lobby({ entry }) {
  const [subjectId, setSubjectId] = useState(getSelectedSubject)
  const [menuOpen, setMenuOpen] = useState(false)
  const [sheet, setSheet] = useState(() => (SHEETS.includes(entry?.sheet) ? entry.sheet : null))
  const [lesson, setLesson] = useState(null) // getLesson() 또는 getMockLesson() 결과
  const [lessonRun, setLessonRun] = useState(0)
  const [toast, setToast] = useState(null) // { id, text }. 같은 말을 다시 띄워도 id가 바뀌어 시간이 새로 잡힌다
  const subjectBtnRef = useRef(null)
  const [, setVersion] = useState(0)
  const refresh = () => setVersion((v) => v + 1)

  // 과목 메뉴는 Esc로도 닫는다. 닫으면 과목 버튼으로 초점을 돌려준다
  useEffect(() => {
    if (!menuOpen) return undefined
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      setMenuOpen(false)
      subjectBtnRef.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  // 토스트는 잠깐 보여 주고 사라진다. 화면을 떠나면 타이머를 정리한다.
  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(null), TOAST_MS)
    return () => clearTimeout(timer)
  }, [toast])

  const subjects = getSubjects()
  const subject = subjects.find((x) => x.id === subjectId) || subjects[0]

  if (!subject) {
    return (
      <div className={s.screen}>
        <p className={s.empty}>학습할 과목을 준비하고 있어요</p>
      </div>
    )
  }

  const units = getUnits(subject.id)
  const doneUnits = units.filter((u) => u.status === 'done').length
  const progress = getProgress()
  const exam = getExam()
  const wrongNotes = getWrongNotes()
  const plan = getPlan()
  const mocks = getMockExams()
  const nextMock =
    mocks.find((m) => m.status === 'today') ||
    mocks.find((m) => m.status === 'upcoming') ||
    mocks[mocks.length - 1] ||
    null
  const settings = getSettings()
  // MY에서 고른 연차의 과목이 아직 없으면(예: 2년차) 과목 메뉴 아래에 준비 중이라고 알린다
  const year = EXAMS[exam.year] ? Number(exam.year) : 1
  const hasYearSubjects = subjects.some((x) => x.ready && Number(x.year) === year)
  const mascotLines = lobbyLines({
    subject,
    units,
    streak: progress.streak,
    exam,
    wrongCount: wrongNotes.length,
  })

  const showToast = (text) => setToast((t) => ({ id: (t ? t.id : 0) + 1, text }))

  const pickSubject = (id) => {
    setSelectedSubject(id)
    setSubjectId(id)
    setMenuOpen(false)
  }

  const openSheet = (name) => {
    setMenuOpen(false)
    setSheet(name)
  }

  const startLesson = (next) => {
    setMenuOpen(false)
    setSheet(null)
    setToast(null)
    setLessonRun((n) => n + 1)
    setLesson(next)
  }

  const openLesson = (nodeIndex) => {
    const next = getLesson(subject.id, nodeIndex)
    if (next) startLesson(next)
  }

  const openMockPreview = (mockId) => {
    const next = getMockLesson(mockId)
    if (next) startLesson(next)
  }

  const closeLesson = () => {
    setLesson(null)
    refresh()
  }

  const clearWrong = (id) => {
    removeWrongNote(id)
    refresh()
  }

  const togglePlan = (id) => {
    togglePlanItem(id)
    refresh()
  }

  const toggleSetting = (name) => {
    setSetting(name, !getSettings()[name])
    refresh()
  }

  return (
    <div className={s.screen}>
      <header className={s.head}>
        <button
          ref={subjectBtnRef}
          type="button"
          className={s.subjectBtn}
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls={menuOpen ? 'lobby-subject-menu' : undefined}
        >
          <BookOpen size={20} strokeWidth={2} className={s.bookIcon} aria-hidden="true" />
          <span className={s.subjectName}>{subject.name}</span>
          <ChevronDown size={18} strokeWidth={2} className={s.chev} aria-hidden="true" />
        </button>

        <div className={s.stats}>
          <p className={s.streak}>
            <Flame size={20} strokeWidth={1.5} className={s.flame} aria-hidden="true" />
            <span className={s.srOnly}>연속 학습 </span>
            <span>{progress.streak}</span>
            <span className={s.srOnly}>일</span>
          </p>
          {/* 어떤 시험의 D-day인지 함께 보여 준다. 폭이 모자라면(2년차 등) 시험 이름 끝을 줄인다 */}
          <p className={s.examName}>{exam.name}까지</p>
          <p className={s.dday}>{exam.dday}</p>
        </div>

        {/* 과목 메뉴: 묶음(직업윤리, 실무역량)별로 보여 준다. 문항이 없는 과목도 고를 수 있고 '준비 중'으로 표시한다.
            묶음 이름과 과목 이름이 같으면(직업윤리) 묶음 이름은 따로 쓰지 않는다. */}
        {menuOpen && (
          <div id="lobby-subject-menu" className={s.menu}>
            {SUBJECT_GROUPS.map((g) => {
              const items = subjects.filter((x) => x.group === g.id)
              if (items.length === 0) return null
              const named = !(items.length === 1 && items[0].name === g.label)
              return (
                <div key={g.id} className={s.menuGroup} role="group" aria-label={g.label}>
                  {named && (
                    <p className={s.menuGroupLabel} aria-hidden="true">
                      {g.label}
                    </p>
                  )}
                  {items.map((x) => {
                    const on = x.id === subject.id
                    return (
                      <button
                        key={x.id}
                        type="button"
                        className={on ? `${s.menuItem} ${s.menuItemOn}` : s.menuItem}
                        aria-current={on ? 'true' : undefined}
                        onClick={() => pickSubject(x.id)}
                      >
                        <span className={x.ready ? s.menuName : `${s.menuName} ${s.menuNameSoon}`}>{x.name}</span>
                        {!x.ready && <span className={s.menuSoon}>준비 중</span>}
                        {on && <Check size={18} strokeWidth={2.5} className={s.menuCheck} aria-hidden="true" />}
                      </button>
                    )
                  })}
                </div>
              )
            })}
            {!hasYearSubjects && <p className={s.menuNote}>{exam.short} 과목은 준비 중이에요</p>}
          </div>
        )}
      </header>

      {/* 메뉴 바깥을 누르면 닫힌다 */}
      {menuOpen && <div className={s.menuDim} onClick={() => setMenuOpen(false)} aria-hidden="true" />}

      {subject.ready ? (
        <section className={s.unit} aria-label="지금 학습 중인 단원">
          <div className={s.unitText}>
            <p className={s.unitLabel}>{subject.unit.label}</p>
            <h1 className={s.unitTitle}>{subject.unit.title}</h1>
            <p className={s.unitSub}>{subject.unit.sub}</p>
          </div>
          <div className={s.unitProg}>
            <List size={20} strokeWidth={2} aria-hidden="true" />
            <span>
              <span className={s.srOnly}>진도 </span>
              {doneUnits}/{units.length}
            </span>
          </div>
        </section>
      ) : (
        <section className={s.unit} aria-label="준비 중인 과목">
          <div className={s.unitText}>
            {subject.groupLabel !== subject.name && <p className={s.unitLabel}>{subject.groupLabel}</p>}
            <h1 className={s.unitTitle}>{subject.name}</h1>
            <p className={s.unitSub}>문항을 준비하고 있어요</p>
          </div>
          <div className={`${s.unitProg} ${s.unitSoon}`}>준비 중</div>
        </section>
      )}

      <LearningPath
        subject={subject}
        units={units}
        mascotLines={mascotLines}
        onOpen={openLesson}
        onHint={showToast}
      />

      <nav className={s.quick} aria-label="학습 도구">
        <button type="button" className={s.qcard} onClick={() => openSheet('mock')}>
          <FileText size={22} strokeWidth={2} className={s.qicon} aria-hidden="true" />
          <span className={s.qtitle}>모의고사</span>
          {nextMock && (
            <span className={s.qsub}>
              <b>{nextMock.title}</b> {nextMock.openShort}
            </span>
          )}
        </button>
        <button type="button" className={s.qcard} onClick={() => openSheet('wrong')}>
          <NotebookPen size={22} strokeWidth={2} className={s.qicon} aria-hidden="true" />
          <span className={s.qtitle}>오답노트</span>
          <span className={s.qsub}>
            복습할 문항 <b>{wrongNotes.length}</b>
          </span>
        </button>
        <button type="button" className={s.qcard} onClick={() => openSheet('plan')}>
          <CalendarCheck size={22} strokeWidth={2} className={s.qicon} aria-hidden="true" />
          <span className={s.qtitle}>진도 계획</span>
          <span className={s.qsub}>
            오늘{' '}
            <b>
              {plan.done}/{plan.total}
            </b>{' '}
            완료
          </span>
        </button>
      </nav>

      {/* 열 수 없는 단계를 눌렀을 때 이유를 잠깐 알려 준다. 아래 카드 위에 겹치지만 누르는 것은 막지 않는다. */}
      <div className={s.toastLayer} role="status" aria-live="polite">
        {toast && (
          <p key={toast.id} className={s.toast}>
            {toast.text}
          </p>
        )}
      </div>

      {lesson && <LessonSheet key={lessonRun} lesson={lesson} onClose={closeLesson} onChange={refresh} />}

      {sheet === 'wrong' && (
        <WrongNoteSheet notes={wrongNotes} onClear={clearWrong} onClose={() => setSheet(null)} />
      )}

      {sheet === 'plan' && (
        <PlanSheet
          exam={exam}
          overallPct={progress.overallPct}
          plan={plan}
          remind={Boolean(settings.studyRemind)}
          sampleNote={hasSampleStart()}
          onToggle={togglePlan}
          onToggleRemind={() => toggleSetting('studyRemind')}
          onClose={() => setSheet(null)}
        />
      )}

      {sheet === 'mock' && (
        <MockSheet
          exams={mocks}
          alertOn={Boolean(settings.mockAlert)}
          onToggleAlert={() => toggleSetting('mockAlert')}
          onPreview={openMockPreview}
          onClose={() => setSheet(null)}
        />
      )}
    </div>
  )
}
