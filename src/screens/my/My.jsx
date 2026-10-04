import { useEffect, useReducer, useRef, useState } from 'react'
import {
  ChevronRight,
  FileText,
  Flame,
  NotebookPen,
  PenLine,
  Settings,
  Swords,
  UserRound,
} from 'lucide-react'
import { EXAMS, SUBJECT_GROUPS, TABS } from '../../config.js'
import { useUser } from '../../store/UserContext.jsx'
import { getExam, getSettings, setSetting } from '../../store/user.js'
import Button3D from '../../components/Button3D.jsx'
import MascotTalk from '../../components/MascotTalk.jsx'
import { getMockExams, getMockLesson, getWrongNotes, removeWrongNote } from '../../store/lobby.js'
import MockSheet from '../lobby/MockSheet.jsx'
import WrongNoteSheet from '../lobby/WrongNoteSheet.jsx'
import LessonSheet from '../lobby/LessonSheet.jsx'
import ScheduleSheet from './ScheduleSheet.jsx'
import NoticeSheet from './NoticeSheet.jsx'
import { bestValue, dateText, readMyData, splitSchedule } from './myData.js'
import s from './My.module.css'

// 화면 제목과 다른 탭 이름은 config.js에서 가져온다
const tabLabel = (id) => TABS.find((t) => t.id === id)?.label ?? ''
const TITLE = tabLabel('my')
const ARENA = tabLabel('asurajang')
const SAMCHOCUT = tabLabel('samchocut')
const YEARS = Object.keys(EXAMS)
  .map(Number)
  .sort((a, b) => a - b)
// MY에 바로 보여 줄 저장한 암기법 수(디자인은 2개. 더 많으면 삼초컷에서 본다)
const SAVED_PREVIEW = 3

// 마마쉘을 누르면 하는 말(누를 때마다 차례로). 로그인 전후로 첫 마디가 다르다
function mascotLines(user, exam) {
  const lines = [user ? `${user.name}님! 어서 오세요!` : '누구세요?']
  if (exam.daysLeft > 0) lines.push(`${exam.name}까지 ${exam.daysLeft}일 남았어요...`)
  else if (exam.daysLeft === 0) lines.push(`오늘이 ${exam.name} 날이에요`)
  return lines
}

// 과목별 진도를 묶음(직업윤리, 실무역량)으로 나눈다. 묶음 이름과 과목 이름이 같으면(직업윤리) 묶음 이름은 쓰지 않는다
function groupSubjects(subjects) {
  const groups = SUBJECT_GROUPS.map((g) => {
    const items = subjects.filter((x) => x.group === g.id)
    const named = !(items.length === 1 && items[0].name === g.label)
    return { id: g.id, label: named ? g.label : '', items }
  }).filter((g) => g.items.length > 0)
  const rest = subjects.filter((x) => !SUBJECT_GROUPS.some((g) => g.id === x.group))
  return rest.length > 0 ? [...groups, { id: 'rest', label: '', items: rest }] : groups
}

// 움직임 줄이기를 켠 기기에서는 부드러운 스크롤 대신 바로 이동한다
function scrollBehavior() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
}

// MY: 프로필(간편 로그인), 시험 구분과 D-day, 진도, 내 활동, 저장한 암기법, 알림 설정.
// 다른 기능의 값은 myData.js가 store에서 읽어 다듬는다. 설정을 바꾸면 refresh()로 다시 그린다.
export default function My({ goTo }) {
  const { user, requireLogin, logout } = useUser()
  const [sheet, setSheet] = useState(null) // 'schedule' | 'notice' | 'mock' | 'wrong'(오답노트도 MY 위에서 연다)
  // MY에서 바로 푸는 모의고사(삼일 끝내기와 같은 시트를 MY 위에 연다). 열 때마다 새로 그리려고 run을 올린다
  const [lesson, setLesson] = useState(null)
  const [lessonRun, setLessonRun] = useState(0)
  const [, refresh] = useReducer((n) => n + 1, 0)
  const scrollRef = useRef(null)
  const settingsRef = useRef(null)
  const loginRef = useRef(null)
  const justLoggedOut = useRef(false)

  // 로그아웃하면 맨 위로 올라가 로그인 버튼을 보여 준다(로그아웃 버튼은 화면 아래에 있어서)
  useEffect(() => {
    if (user || !justLoggedOut.current) return
    justLoggedOut.current = false
    scrollRef.current?.scrollTo({ top: 0, behavior: scrollBehavior() })
    loginRef.current?.focus({ preventScroll: true })
  }, [user])

  const settings = getSettings()
  const year = EXAMS[settings.year] ? Number(settings.year) : YEARS[0]
  const exam = getExam(year)
  const data = readMyData()

  const examLabel = exam.daysLeft >= 0 ? `${exam.name}까지` : `${exam.name} 이후`
  // 올해가 아닌 시험일(2년차 D-366 등)은 연도를 붙여 내일 날짜로 오해하지 않게 한다
  const examDay = dateText(exam.date)
  const examDate = examDay && !exam.sameYear ? `${String(exam.date).slice(0, 4)}년 ${examDay}` : examDay
  const [arenaValue, arenaUnit] = data.arena?.schedule ? splitSchedule(data.arena.schedule) : ['준비 중', '']
  const best = bestValue(data.best)
  const saved = data.saved.slice(0, SAVED_PREVIEW)

  const go = (id, options) => goTo?.(id, options)
  const subjectGroups = groupSubjects(data.subjects)

  const pickYear = (y) => {
    if (y === year) return
    setSetting('year', y)
    refresh()
  }

  // 알림 토글은 설정만 저장한다. 실제 알림은 보내지 않는다.
  const toggle = (name) => {
    setSetting(name, !getSettings()[name])
    refresh()
  }

  // 머리의 설정 버튼: 화면 아래 설정 묶음으로 내려간다
  const showSettings = () => {
    const box = scrollRef.current
    const el = settingsRef.current
    if (!box || !el) return
    box.scrollTo({ top: Math.max(0, el.offsetTop - 12), behavior: scrollBehavior() })
    el.focus({ preventScroll: true })
  }

  // 모의고사 회차를 누르면 시트를 닫고 바로 문제를 연다. 끝나면 MY 값(응시 횟수 등)을 다시 읽는다
  const startMock = (mockId) => {
    const next = getMockLesson(mockId)
    if (!next) return
    setSheet(null)
    setLessonRun((n) => n + 1)
    setLesson(next)
  }

  const closeLesson = () => {
    setLesson(null)
    refresh()
  }

  // 오답노트에서 '복습 완료'를 누르면 지우고 MY 값(오답 수)을 다시 읽는다
  const clearWrong = (id) => {
    removeWrongNote(id)
    refresh()
  }

  const onLogout = () => {
    justLoggedOut.current = true
    logout()
  }

  return (
    <div className={s.screen}>
      <div ref={scrollRef} className={s.scroll}>
        <header className={s.head}>
          <div className={s.titleRow}>
            <h1 className={s.title}>{TITLE}</h1>
            <MascotTalk
              name="mamashell"
              size={52}
              lines={mascotLines(user, exam)}
              side="right"
              className={s.mascot}
            />
          </div>
          <button type="button" className={s.iconBtn} aria-label="설정으로 이동" onClick={showSettings}>
            <Settings size={24} strokeWidth={2} aria-hidden="true" />
          </button>
        </header>

        {user ? (
          <section className={s.profile} aria-label="내 정보">
            <div className={s.profileRow}>
              <span className={s.avatar} aria-hidden="true">
                <UserRound size={28} strokeWidth={2} />
              </span>
              <div className={s.who}>
                <p className={s.name}>{user.name}</p>
                <p className={s.role}>
                  {user.dept && (
                    <>
                      <span className={s.dept}>{user.dept}</span>
                      <span className={s.dot} aria-hidden="true">
                        ·
                      </span>
                    </>
                  )}
                  <span className={s.year}>{year}년차</span>
                </p>
              </div>
              <p className={s.streak}>
                <Flame size={16} strokeWidth={1.5} className={s.flame} aria-hidden="true" />
                {data.streak}일 연속
              </p>
            </div>
          </section>
        ) : (
          <section className={s.profile} aria-label="로그인">
            <div className={s.profileRow}>
              <span className={s.avatar} aria-hidden="true">
                <UserRound size={28} strokeWidth={2} />
              </span>
              <Button3D ref={loginRef} tone="soft" className={s.loginBtn} onClick={() => requireLogin()}>
                간편 로그인
              </Button3D>
            </div>
          </section>
        )}

        <div className={s.seg} role="group" aria-label="시험 구분">
          {YEARS.map((y) => (
            <button
              key={y}
              type="button"
              className={y === year ? `${s.segBtn} ${s.segOn}` : s.segBtn}
              aria-pressed={y === year}
              onClick={() => pickYear(y)}
            >
              {EXAMS[y].short}
            </button>
          ))}
        </div>

        <section className={s.exam} aria-label="시험까지 남은 날과 전체 진도">
          <div className={s.examTop}>
            <div className={s.examText}>
              <p className={s.examName}>{examLabel}</p>
              <p className={s.dday}>{exam.dday}</p>
            </div>
            {examDate && <p className={s.examDate}>시험일 {examDate}</p>}
          </div>
          <div className={s.overall}>
            <p className={s.overallRow}>
              <span>전체 진도</span>
              <span>{data.overallPct}%</span>
            </p>
            <div className={s.overallTrack} aria-hidden="true">
              <div className={s.overallFill} style={{ width: `${data.overallPct}%` }} />
            </div>
          </div>
        </section>

        <section className={s.card}>
          <h2 className={s.cardTitle}>과목별 진도</h2>
          {data.subjects.length > 0 ? (
            subjectGroups.map((g) => (
              <div key={g.id} className={s.subjectGroup} role="group" aria-label={g.label || undefined}>
                {g.label && <p className={s.groupLabel}>{g.label}</p>}
                {g.items.map((x) =>
                  x.ready ? (
                    <div key={x.id} className={s.subject}>
                      <div className={s.subjectRow}>
                        <span className={s.subjectName}>{x.name}</span>
                        <span className={s.subjectMeta}>
                          {x.unit && (
                            <>
                              <span className={s.subjectUnit}>{x.unit}</span>
                              <span className={s.dot} aria-hidden="true">
                                ·
                              </span>
                            </>
                          )}
                          <span className={s.subjectCount}>
                            {x.done}/{x.total} 단계
                          </span>
                        </span>
                      </div>
                      <div className={s.bar} aria-hidden="true">
                        <div className={s.barFill} style={{ width: `${x.pct}%` }} />
                      </div>
                    </div>
                  ) : (
                    <div key={x.id} className={`${s.subject} ${s.subjectSoon}`}>
                      <div className={s.subjectRow}>
                        <span className={s.subjectName}>{x.name}</span>
                        <span className={s.soonTag}>준비 중</span>
                      </div>
                    </div>
                  ),
                )}
              </div>
            ))
          ) : (
            <p className={s.muted}>학습할 과목을 준비하고 있어요</p>
          )}
        </section>

        <section className={s.section}>
          <h2 className={s.sectionTitle}>내 활동</h2>
          <div className={s.grid}>
            <button type="button" className={s.tile} onClick={() => setSheet('wrong')}>
              <NotebookPen size={22} strokeWidth={2} className={s.tileIcon} aria-hidden="true" />
              <span className={s.tileLabel}>오답노트</span>
              <span className={s.tileValue}>
                {data.wrongCount}
                <span className={s.tileUnit}> 문항</span>
              </span>
            </button>
            <button type="button" className={s.tile} onClick={() => setSheet('mock')}>
              <FileText size={22} strokeWidth={2} className={s.tileIcon} aria-hidden="true" />
              <span className={s.tileLabel}>모의고사</span>
              <span className={s.tileValue}>
                {data.mockDone}
                <span className={s.tileUnit}> 회 응시</span>
              </span>
            </button>
            <button type="button" className={s.tile} onClick={() => go('asurajang')}>
              <Swords size={22} strokeWidth={2} className={s.tileIcon} aria-hidden="true" />
              <span className={s.tileLabel}>{ARENA}</span>
              <span className={s.tileValue}>
                {arenaValue}
                {arenaUnit && <span className={s.tileUnit}> {arenaUnit}</span>}
              </span>
              <span className={s.tileMeta}>
                {best ? (
                  <>
                    최고 기록 <b className={s.tileBest}>{best}</b>
                  </>
                ) : (
                  '아직 기록이 없어요'
                )}
              </span>
            </button>
            <button type="button" className={s.tile} onClick={() => go('samchocut')}>
              <PenLine size={22} strokeWidth={2} className={s.tileIcon} aria-hidden="true" />
              <span className={s.tileLabel}>공유한 암기법</span>
              <span className={s.tileValue}>
                {data.postCount}
                <span className={s.tileUnit}> 개</span>
              </span>
            </button>
          </div>
        </section>

        <section className={`${s.card} ${s.savedCard}`}>
          <div className={s.cardHead}>
            <h2 className={s.cardTitle}>저장한 암기법</h2>
            <button type="button" className={s.more} onClick={() => go('samchocut')}>
              {saved.length > 0 ? '전체 보기' : '둘러보기'}
            </button>
          </div>
          {saved.length > 0 ? (
            <ul className={s.savedList}>
              {saved.map((p) => (
                <li key={p.id}>
                  <button type="button" className={s.savedItem} onClick={() => go('samchocut', { post: p.id })}>
                    {p.keys && <span className={s.keyChip}>{p.keys}</span>}
                    <span className={s.savedText}>
                      <span className={s.savedTitle}>{p.title}</span>
                      {p.subject && <span className={s.savedSubject}>{p.subject}</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className={s.savedEmpty}>
              <p className={s.emptyTitle}>아직 저장한 암기법이 없어요</p>
              <p className={s.muted}>{SAMCHOCUT}에서 마음에 드는 암기법을 저장해 보세요</p>
            </div>
          )}
        </section>

        <section ref={settingsRef} className={s.settings} aria-label="설정" tabIndex={-1}>
          <Toggle
            title="학습 리마인드"
            sub="매일 21:00"
            on={Boolean(settings.studyRemind)}
            onToggle={() => toggle('studyRemind')}
          />
          <Toggle
            title={`${ARENA} 오픈 알림`}
            sub="시험 D-1 서바이벌 시작 10분 전"
            on={Boolean(settings.asurajangAlert)}
            onToggle={() => toggle('asurajangAlert')}
          />
          <button type="button" className={s.link} onClick={() => setSheet('schedule')}>
            시험 일정 관리
            <ChevronRight size={18} strokeWidth={2.2} className={s.chevron} aria-hidden="true" />
          </button>
          <button type="button" className={s.link} onClick={() => setSheet('notice')}>
            공지사항
            <ChevronRight size={18} strokeWidth={2.2} className={s.chevron} aria-hidden="true" />
          </button>
          {user && (
            <button type="button" className={s.logout} onClick={onLogout}>
              로그아웃
            </button>
          )}
        </section>
      </div>

      {sheet === 'schedule' && (
        <ScheduleSheet
          exams={YEARS.map((y) => getExam(y))}
          year={year}
          onPickYear={pickYear}
          onClose={() => setSheet(null)}
        />
      )}

      {sheet === 'notice' && <NoticeSheet onClose={() => setSheet(null)} />}

      {sheet === 'mock' && <MockSheet exams={getMockExams()} onStart={startMock} onClose={() => setSheet(null)} />}

      {sheet === 'wrong' && <WrongNoteSheet notes={getWrongNotes()} onClear={clearWrong} onClose={() => setSheet(null)} />}

      {lesson && (
        <LessonSheet
          key={lessonRun}
          lesson={lesson}
          backLabel={`${TITLE}로 돌아가기`}
          onClose={closeLesson}
          onChange={refresh}
        />
      )}
    </div>
  )
}

// 알림 켜고 끄기 한 줄
function Toggle({ title, sub, on, onToggle }) {
  return (
    <button type="button" className={s.toggle} role="switch" aria-checked={on} onClick={onToggle}>
      <span className={s.rowText}>
        <span className={s.rowTitle}>{title}</span>
        <span className={s.rowSub}>{sub}</span>
      </span>
      <span className={on ? `${s.track} ${s.trackOn}` : s.track} aria-hidden="true">
        <span className={s.knob} />
      </span>
    </button>
  )
}
