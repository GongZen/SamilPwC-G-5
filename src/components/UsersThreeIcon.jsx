// 동기들 탭 아이콘: 가운데 사람 뒤로 양옆 두 사람이 겹쳐 선 모양.
// lucide에 세 사람 아이콘이 없어 직접 그렸다. lucide 아이콘과 같은 크기(24), 선 굵기, 끝 모양을 쓴다.
export default function UsersThreeIcon({ size = 24, strokeWidth = 2, className, ...rest }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...rest}
    >
      <circle cx="12" cy="7.5" r="3.4" />
      <path d="M6 21v-1a6 6 0 0 1 12 0v1" />
      <circle cx="4.8" cy="9.4" r="2.4" />
      <circle cx="19.2" cy="9.4" r="2.4" />
      <path d="M1 21v-.6a3.8 3.8 0 0 1 5.3-3.5" />
      <path d="M23 21v-.6a3.8 3.8 0 0 0-5.3-3.5" />
    </svg>
  )
}
