import React from 'react'

export default function ChatMessage({
  role,
  content,
  isFallback = false,
}: {
  role: 'user' | 'assistant'
  content: string
  isFallback?: boolean
}) {
  const isUser = role === 'user'

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: isUser ? 'flex-end' : 'flex-start',
      marginBottom: '16px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginBottom: '4px',
        opacity: 0.75,
        fontFamily: 'monospace',
        fontSize: '10px',
        textTransform: 'uppercase',
        letterSpacing: '0.1em'
      }}>
        <span>{isUser ? 'You' : 'Coach Kipchoge'}</span>
        {!isUser && isFallback && (
          <span
            style={{
              background: 'rgba(245, 158, 11, 0.16)',
              color: '#b45309',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              borderRadius: '999px',
              padding: '1px 6px',
              fontSize: '9px',
              fontWeight: 700,
              letterSpacing: '0.06em',
            }}
          >
            Offline coach
          </span>
        )}
      </div>
      <div style={{
        background: isUser ? 'var(--orange)' : 'var(--border)',
        color: isUser ? '#000' : 'var(--text)',
        padding: '12px 16px',
        borderRadius: '8px',
        borderBottomRightRadius: isUser ? '2px' : '8px',
        borderBottomLeftRadius: isUser ? '8px' : '2px',
        maxWidth: '85%',
        fontSize: '14px',
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
        fontWeight: isUser ? 500 : 400
      }}>
        {content}
      </div>
    </div>
  )
}
