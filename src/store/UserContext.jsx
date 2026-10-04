import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import * as userStore from './user.js'

// 로그인 정보를 어느 화면에서든 꺼내 쓰는 통로.
// 사용 예: const { user, requireLogin } = useUser()
//          requireLogin(() => 글쓰기 시트 열기)  // 로그인이 안 돼 있으면 로그인 시트를 먼저 띄운다
const UserContext = createContext(null)

export function UserProvider({ children }) {
  const [user, setUser] = useState(() => userStore.getUser())
  const [loginOpen, setLoginOpen] = useState(false)
  const pending = useRef(null)

  const login = useCallback((name, dept) => {
    const u = userStore.login(name, dept)
    setUser(u)
    setLoginOpen(false)
    const next = pending.current
    pending.current = null
    if (next) next(u)
  }, [])

  const logout = useCallback(() => {
    userStore.logout()
    setUser(null)
  }, [])

  // 로그인이 필요한 동작 앞에 쓴다. 로그인 돼 있으면 바로 then을 실행한다.
  const requireLogin = useCallback(
    (then) => {
      if (user) {
        then?.(user)
        return
      }
      pending.current = then || null
      setLoginOpen(true)
    },
    [user],
  )

  const closeLogin = useCallback(() => {
    pending.current = null
    setLoginOpen(false)
  }, [])

  const value = useMemo(
    () => ({ user, login, logout, requireLogin, loginOpen, closeLogin }),
    [user, login, logout, requireLogin, loginOpen, closeLogin],
  )

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

// oxlint-disable-next-line react/only-export-components
export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser는 UserProvider 안에서만 쓸 수 있다')
  return ctx
}
