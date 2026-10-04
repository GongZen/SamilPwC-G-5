import Sheet from '../../components/Sheet.jsx'
import { TopCard } from './PostCards.jsx'
import s from './PostSheet.module.css'

// 목록의 글을 눌렀을 때 아래에서 올라오는 크게 보기. 맨 위 1위 카드와 같은 큰 카드에 추천·저장 버튼이 있다.
// badge: 추천순이면 '추천순 3위'처럼 순위, 최신순이면 비운다
export default function PostSheet({ post, badge, onClose, onLike, onSave }) {
  return (
    <Sheet open={Boolean(post)} onClose={onClose} ariaLabel={post ? `${post.title} 암기법` : undefined}>
      {post && (
        <div className={s.body}>
          <TopCard post={post} badge={badge} crown={false} onLike={onLike} onSave={onSave} />
        </div>
      )}
    </Sheet>
  )
}
