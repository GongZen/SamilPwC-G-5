import s from './Card.module.css'

// 흰 카드 틀. 안쪽 배치는 쓰는 쪽에서 className으로 더한다.
export default function Card({ as: Tag = 'div', className = '', children, ...rest }) {
  return (
    <Tag className={[s.card, className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </Tag>
  )
}
