// 화면에 보이는 이름은 여기 한 곳에서 바꾼다.
// 앱 이름을 바꾸면 index.html의 <title>도 같이 바꾼다.
export const APP_NAME = '삼일 끝내기'

// 하단 탭 순서와 표시 이름. id(코드 식별자)는 바꾸지 않는다.
export const TABS = [
  { id: 'lobby', label: '삼일 끝내기' },
  { id: 'samchocut', label: '삼초컷' },
  { id: 'asurajang', label: '아수(습)라장' },
  { id: 'dongi', label: '동기들' },
  { id: 'my', label: 'MY' },
]

// 하단 탭 없이 전체 화면으로 여는 탭
export const FULLSCREEN_TABS = ['asurajang']

// 바탕이 흰색이 아닌 탭. 맨 위 로고 줄도 같은 색으로 맞춘다.
export const TAB_SURFACE = { dongi: 'bg', my: 'bg' }

// 과목 구성(종합평가 과목 체계). 화면에 보이는 과목 이름과 순서는 여기 한 곳에서 바꾼다.
// id는 코드 식별자라 바꾸지 않는다. 문항이 아직 없는 과목도 목록에 보이고 눌리며 '준비 중'으로 표시한다.
// data 파일의 과목은 이 이름(삼초컷, 아수(습)라장) 또는 id(삼일 끝내기)로 연결한다.
export const SUBJECT_GROUPS = [
  { id: 'ethics', label: '직업윤리', subjects: [{ id: 'ethics', name: '직업윤리' }] },
  {
    id: 'practice',
    label: '실무역량',
    subjects: [
      { id: 'fin', name: '회계' },
      { id: 'audit', name: '감사' },
      { id: 'tax', name: '세무' },
      { id: 'consult', name: '경영자문' },
      { id: 'it', name: '정보기술' },
      { id: 'esg', name: 'ESG' },
    ],
  },
]

// 위 과목을 한 줄로 편 목록. group은 묶음 id, groupLabel은 묶음 이름
export const SUBJECTS = SUBJECT_GROUPS.flatMap((g) =>
  g.subjects.map((x) => ({ ...x, group: g.id, groupLabel: g.label })),
)

// 처음 접속했을 때(과목을 고른 적이 없을 때) 삼일 끝내기에서 먼저 보여 주는 과목 id. 시연 과목인 정보기술.
// 한 번 고른 과목은 다음 접속에도 그대로 유지된다.
export const DEFAULT_SUBJECT_ID = 'it'

// 예전 과목 이름(10/04 이전). 이 기기에 이미 저장된 기록을 새 이름으로 바꿔 보여 줄 때 쓴다.
const OLD_SUBJECT_NAMES = { 재무회계: '회계', 회계감사: '감사', 세법: '세무' }

/** 저장된 과목 이름을 지금 이름으로. 예전 이름이 아니면 그대로 돌려준다 @param {string} name */
export function currentSubjectName(name) {
  return OLD_SUBJECT_NAMES[name] ?? name
}

// 시험 일정은 시연용 가상 날짜다. 실제 시험 일정이 아니다.
// 날짜는 접속한 날을 기준으로 daysFromToday일 뒤로 정한다. 언제 열어도 1년차는 D-1(시험 전날 여는 아수(습)라장과 맞춤),
// 2년차는 D-366으로 보인다.
export const EXAMS = {
  1: { name: '기본실무과정 종합평가', short: '1년차 기본실무', daysFromToday: 1 },
  2: { name: '외부감사실무과정 종합평가', short: '2년차 외부감사실무', daysFromToday: 366 },
}

// 안드로이드 삼성 인터넷의 PwC 마크 확인 화면(components/BrowserGuide.jsx)을 접속할 때마다 보여 줄지.
// true: 접속할 때마다 보여 준다(시험용, 10/06). false: '잘 보여요'를 고르면 이 기기에서 기억해 다음부터 바로 앱을 연다.
// 어느 쪽이든 '잘 보여요'를 고른 기기에는 처음부터 설치 정보를 붙여 삼성 인터넷에서도 설치할 수 있다.
export const SAMSUNG_GUIDE_EVERY_VISIT = true
