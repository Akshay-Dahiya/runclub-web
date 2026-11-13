import type { ClubStory } from '../lib/club-stories'

export default function ClubStoryCard({ story }: { story: ClubStory }) {
  const date = new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(story.createdAt))

  return (
    <article
      aria-labelledby={`club-story-${story.id}`}
      style={{
        overflow: 'hidden',
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '18px',
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.04)',
      }}
    >
      {story.photoUrl && (
        <img
          src={story.photoUrl}
          alt={story.content}
          loading="lazy"
          style={{
            display: 'block',
            width: '100%',
            height: '220px',
            objectFit: 'cover',
            background: '#F1F5F9',
          }}
        />
      )}
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div
            aria-hidden="true"
            style={{
              display: 'grid',
              placeItems: 'center',
              width: '38px',
              height: '38px',
              flex: '0 0 38px',
              borderRadius: '50%',
              background: '#FFF1E8',
              color: '#C2410C',
              fontSize: '12px',
              fontWeight: 800,
            }}
          >
            {story.authorInitials}
          </div>
          <div style={{ minWidth: 0 }}>
            <h3
              id={`club-story-${story.id}`}
              style={{ margin: 0, color: '#0F172A', fontSize: '14px', fontWeight: 800 }}
            >
              {story.authorName}
            </h3>
            <time dateTime={story.createdAt} style={{ color: '#64748B', fontSize: '12px' }}>
              {date}
            </time>
          </div>
          {story.isMine && (
            <span
              style={{
                marginLeft: 'auto',
                padding: '5px 8px',
                borderRadius: '999px',
                background: '#F1F5F9',
                color: '#475569',
                fontSize: '10px',
                fontWeight: 700,
                whiteSpace: 'nowrap',
              }}
            >
              Your story
            </span>
          )}
        </div>
        <p
          style={{
            margin: 0,
            color: '#334155',
            fontSize: '15px',
            lineHeight: 1.65,
            whiteSpace: 'pre-wrap',
            overflowWrap: 'anywhere',
          }}
        >
          {story.content}
        </p>
      </div>
    </article>
  )
}
