import s from './Button3D.module.css'

// 입체 버튼. 누르면 아래 면만큼 내려간다.
// tone: 'primary'(오렌지) | 'soft'(옅은 오렌지)
export default function Button3D({
  children,
  onClick,
  disabled = false,
  type = 'button',
  tone = 'primary',
  className = '',
  ...rest
}) {
  const cls = [s.btn, s[tone], className].filter(Boolean).join(' ')
  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled} {...rest}>
      {children}
    </button>
  )
}
