import React from 'react'

export default function ChatMessage({ role, content }: { role: 'user' | 'assistant', content: string }) {
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
        opacity: 0.6,
        fontFamily: 'monospace',
        fontSize: '10px',
        textTransform: 'uppercase',
        letterSpacing: '0.1em'
      }}>
        {isUser ? 'You' : 'Coach Kipchoge'}
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
