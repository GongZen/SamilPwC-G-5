import { Bookmark, Crown, ThumbsUp } from 'lucide-react'
import s from './PostCards.module.css'

const count = (n) => n.toLocaleString('ko-KR')

// 목록 맨 위의 큰 오렌지 카드. 키워드 칸과 풀이, 한 줄 설명, 추천과 저장 버튼을 보여 준다.
// 목록의 다른 글을 눌렀을 때 여는 크게 보기 시트(PostSheet)도 이 카드를 쓴다.
// badge: 추천순이면 '이번 주 1위', 최신순이면 '최신 암기법'. 비우면 배지를 그리지 않는다. crown: 배지 앞 왕관
export function TopCard({ post, badge, crown = true, onLike, onSave }) {
  // 한 줄 설명을 직접 쓴 내 글은 부제와 설명이 같아서 한 번만 보여 준다
  const showDesc = post.desc && post.desc !== post.line

  return (
    <article className={s.top}>
      <div className={s.topHead}>
        {badge ? (
          <span className={s.badge}>
            {crown && <Crown size={14} strokeWidth={1.6} className={s.crown} aria-hidden="true" />}
            {badge}
          </span>
        ) : (
          <span />
        )}
        <span className={s.topSubject}>{post.subject}</span>
      </div>

      <div className={s.topTitleBox}>
        <h2 className={s.topTitle}>{post.title}</h2>
        {showDesc && <p className={s.topDesc}>{post.desc}</p>}
      </div>

      <ul className={s.keyBoxes} aria-label="암기 키워드">
        {post.keys.map((k, i) => (
          <li key={`${i}-${k}`} className={s.keyItem}>
            <span className={s.keyBox}>{k}</span>
            {post.caps[i] && <span className={s.keyCap}>{post.caps[i]}</span>}
          </li>
        ))}
      </ul>

      {post.line && <p className={s.topLine}>{post.line}</p>}

      <div className={s.topFoot}>
        <span className={s.author}>{post.author}</span>
        <div className={s.actions}>
          <button
            type="button"
            className={post.liked ? `${s.topBtn} ${s.on}` : s.topBtn}
            aria-pressed={post.liked}
            aria-label={`추천 ${count(post.likes)}`}
            onClick={() => onLike(post.id)}
          >
            <ThumbsUp size={18} strokeWidth={2} className={s.topIcon} aria-hidden="true" />
            {count(post.likes)}
          </button>
          <button
            type="button"
            className={post.saved ? `${s.topBtn} ${s.on}` : s.topBtn}
            aria-pressed={post.saved}
            aria-label={`저장 ${count(post.saves)}`}
            onClick={() => onSave(post.id)}
          >
            <Bookmark size={18} strokeWidth={2} className={s.topIcon} aria-hidden="true" />
            {count(post.saves)}
          </button>
        </div>
      </div>
    </article>
  )
}

// 2위부터의 목록 카드. 순위, 주제, 과목, 부제, 키워드 칸, 추천 버튼
// 카드 아무 곳이나 누르면 크게 보기(onOpen)가 열린다. 추천 버튼은 따로 눌린다.
export function RankCard({ post, rank, onLike, onOpen }) {
  return (
    <article className={s.item}>
      {/* 카드 전체를 덮는 투명 버튼. 추천 버튼만 이 위에 올라와 있다 */}
      <button
        type="button"
        className={s.cover}
        onClick={() => onOpen(post.id)}
        aria-label={`${rank}위 ${post.title} 크게 보기`}
      />
      <span className={s.rank}>{rank}</span>
      <div className={s.body}>
        <div className={s.titleRow}>
          <h2 className={s.title}>{post.title}</h2>
          <span className={s.subject}>{post.subject}</span>
        </div>
        {post.desc && <p className={s.desc}>{post.desc}</p>}
        <ul className={s.miniKeys} aria-label="암기 키워드">
          {post.keys.map((k, i) => (
            <li key={`${i}-${k}`} className={s.miniKey}>
              {k}
            </li>
          ))}
        </ul>
      </div>
      <button
        type="button"
        className={post.liked ? `${s.like} ${s.likeOn}` : s.like}
        aria-pressed={post.liked}
        aria-label={`추천 ${count(post.likes)}`}
        onClick={() => onLike(post.id)}
      >
        <ThumbsUp size={22} strokeWidth={2} className={s.likeIcon} aria-hidden="true" />
        {count(post.likes)}
      </button>
    </article>
  )
}
