import React from 'react'

const PROMPTS = [
  "Am I on track for my race?",
  "How am I progressing this month?",
  "What should I run tomorrow?",
  "Predict my race finish time.",
  "Compare me to the club average.",
  "How many km behind the leader am I?"
]

export default function SuggestedPrompts({ onSelect }: { onSelect: (p: string) => void }) {
  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      overflowX: 'auto',
      paddingBottom: '8px',
      marginBottom: '8px',
      scrollbarWidth: 'none', // Firefox
      msOverflowStyle: 'none', // IE and Edge
    }}>
      <style>{`
        .suggested-prompts-container::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div className="suggested-prompts-container" style={{ display: 'flex', gap: '8px' }}>
        {PROMPTS.map(p => (
          <button
            key={p}
            onClick={() => onSelect(p)}
            style={{
              background: 'transparent',
              border: '1px solid var(--orange)',
              color: 'var(--orange)',
              padding: '6px 12px',
              borderRadius: '99px',
              fontSize: '12px',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              opacity: 0.8,
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--orange)'
              e.currentTarget.style.color = '#000'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--orange)'
            }}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  )
}
