import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import s from './Sheet.module.css'

// 시트 안에서 Tab으로 옮겨 다닐 수 있는 것들
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// 아래에서 올라오는 시트. 앱 틀 전체(하단 탭 포함)를 덮는다.
// title이 있으면 제목과 닫기 버튼을 그린다. 직접 머리 부분을 그리려면 title을 비우고 showClose={false}.
// 제목을 직접 그릴 때는 ariaLabel로 화면 읽기 프로그램이 읽을 시트 이름을 준다.
// 열리면 시트 안으로 초점을 옮기고(안에 autoFocus 입력란이 있으면 그대로 둔다), Tab은 시트 안에서만 돈다.
// 닫히면 열기 전에 누른 버튼으로 초점을 돌려준다. 단, autoFocus 입력란이 있는 시트는 열 때 이미 초점이
// 시트 안에 있어 누른 버튼을 알 수 없으므로 돌려주지 않는다(지금 그런 시트는 없다).
// surface: 'white' | 'bg'(옅은 회색)
export default function Sheet({
  open,
  onClose,
  title,
  ariaLabel,
  children,
  surface = 'white',
  showClose = true,
  closeOnDim = true,
  className = '',
}) {
  const sheetRef = useRef(null)

  // Esc로 닫기. Tab은 시트 안에서만 돌게 한다.
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') {
        onClose?.()
        return
      }
      if (e.key !== 'Tab') return
      const box = sheetRef.current
      if (!box) return
      const items = [...box.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null)
      if (items.length === 0) {
        e.preventDefault()
        box.focus()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      if (e.shiftKey && (active === first || active === box || !box.contains(active))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (active === last || !box.contains(active))) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // 열릴 때 초점을 시트로 옮기고, 닫힐 때 원래 자리로 돌려준다
  useEffect(() => {
    if (!open) return undefined
    const before = document.activeElement
    const box = sheetRef.current
    if (box && !box.contains(document.activeElement)) box.focus({ preventScroll: true })
    return () => {
      if (before instanceof HTMLElement && before.isConnected) before.focus({ preventScroll: true })
    }
  }, [open])

  // 시트가 그려질 층은 앱 틀(App.jsx)에 있다
  const root = open ? document.getElementById('sheet-root') : null
  if (!root) return null

  const sheetCls = [s.sheet, surface === 'bg' ? s.bg : '', className].filter(Boolean).join(' ')

  return createPortal(
    <div className={s.dim} onClick={closeOnDim ? onClose : undefined}>
      <div
        ref={sheetRef}
        className={sheetCls}
        role="dialog"
        aria-modal="true"
        aria-label={title || ariaLabel || undefined}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || showClose) && (
          <div className={s.head}>
            {title ? <h2 className={s.title}>{title}</h2> : <span />}
            {showClose && (
              <button type="button" className={s.close} onClick={onClose} aria-label="닫기">
                <X size={22} strokeWidth={2.2} aria-hidden="true" />
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>,
    root,
  )
}
