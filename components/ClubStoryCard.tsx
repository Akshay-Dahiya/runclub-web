import type { ClubStory } from '../lib/club-stories'

export default function ClubStoryCard({ story }: { story: ClubStory }) {
  const date = new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(story.createdAt))

  return (
    <article
      className="club-story-card"
      aria-labelledby={`club-story-${story.id}`}
    >
      {story.photoUrl && (
        <img
          src={story.photoUrl}
          alt={`Photo shared by ${story.authorName}`}
          loading="lazy"
          style={{
            display: 'block',
            width: '100%',
            height: '200px',
            objectFit: 'cover',
            background: '#F1F5F9',
          }}
        />
      )}
      <div style={{ padding: '18px 18px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '11px', marginBottom: '14px' }}>
          <div
            aria-hidden="true"
            style={{
              display: 'grid',
              placeItems: 'center',
              width: '40px',
              height: '40px',
              flex: '0 0 40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #FFF1E8 0%, #FFEBE0 100%)',
              color: '#C2410C',
              fontSize: '13px',
              fontWeight: 900,
              boxShadow: '0 2px 8px rgba(252, 76, 2, 0.1)',
            }}
          >
            {story.authorInitials}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3
              id={`club-story-${story.id}`}
              style={{ margin: '0 0 2px 0', color: '#0F172A', fontSize: '14px', fontWeight: 800, letterSpacing: '-0.3px' }}
            >
              {story.authorName}
            </h3>
            <time dateTime={story.createdAt} style={{ color: '#94A3B8', fontSize: '12px', fontWeight: 500 }}>
              {date}
            </time>
          </div>
          {story.isMine && (
            <span
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                background: 'rgba(252, 76, 2, 0.1)',
                color: '#C2410C',
                fontSize: '11px',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                letterSpacing: '0.5px',
              }}
            >
              YOU
            </span>
          )}
        </div>
        <p
          style={{
            margin: 0,
            color: '#334155',
            fontSize: '14px',
            lineHeight: 1.62,
            whiteSpace: 'pre-wrap',
            overflowWrap: 'anywhere',
            flex: 1,
          }}
        >
          {story.content}
        </p>
      </div>
    </article>
  )
}
