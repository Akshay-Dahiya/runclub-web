"use client"

import { useRef, useState, type FormEvent } from 'react'

const MAX_PHOTO_SIZE = 5 * 1024 * 1024

export default function ClubStoryComposer({ onPosted }: { onPosted: () => Promise<unknown> | void }) {
  const photoInput = useRef<HTMLInputElement>(null)
  const [posting, setPosting] = useState(false)
  const [content, setContent] = useState('')
  const [photoName, setPhotoName] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedContent = content.trim()
    const photo = photoInput.current?.files?.[0]

    setMessage('')
    setError('')

    if (!trimmedContent) {
      setError('Add a few words about your run before sharing.')
      return
    }

    if (photo && photo.size > MAX_PHOTO_SIZE) {
      setError('Choose a photo smaller than 5 MB.')
      return
    }

    setPosting(true)

    try {
      const formData = new FormData(event.currentTarget)
      formData.set('content', trimmedContent)
      const response = await fetch('/api/stories', { method: 'POST', body: formData })
      const result = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(result?.error || 'Your story could not be shared.')
      }

      setContent('')
      setPhotoName('')
      if (photoInput.current) photoInput.current.value = ''
      setMessage('Your story is now shared with the group.')
      await onPosted()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Your story could not be shared.')
    } finally {
      setPosting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        padding: '20px',
        marginBottom: '32px',
        background: 'linear-gradient(135deg, #FFF7F2 0%, #FFFBF8 100%)',
        border: '2px solid #FED7C3',
        borderRadius: '20px',
        boxShadow: '0 4px 12px rgba(252, 76, 2, 0.08)',
      }}
    >
      <label htmlFor="club-story-content" style={{ display: 'block', marginBottom: '12px', color: '#0F172A', fontSize: '15px', fontWeight: 900, letterSpacing: '-0.3px' }}>
        Share your story
      </label>
      <textarea
        id="club-story-content"
        name="content"
        value={content}
        onChange={event => setContent(event.target.value)}
        maxLength={2000}
        required
        rows={4}
        placeholder="A run you loved, a race moment, a personal win..."
        className="club-story-textarea"
        style={{
          boxSizing: 'border-box',
          display: 'block',
          width: '100%',
          minHeight: '120px',
          resize: 'vertical',
          padding: '14px 15px',
          border: '1.5px solid #E2E8F0',
          borderRadius: '14px',
          background: '#FFFFFF',
          color: '#0F172A',
          font: 'inherit',
          lineHeight: 1.6,
          fontSize: '15px',
          fontWeight: 400,
          transition: 'all 0.2s ease',
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginTop: '10px', color: '#94A3B8', fontSize: '12px', fontWeight: 500 }}>
        <span>Shared with connected runners</span>
        <span>{content.length}/2000</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '18px', borderTop: '1px solid #FED7C3', paddingTop: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <input
            ref={photoInput}
            id="club-story-photo"
            name="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={event => setPhotoName(event.target.files?.[0]?.name || '')}
            className="club-story-photo-input"
          />
          <label htmlFor="club-story-photo" className="club-story-photo-label">
            {photoName ? 'Change photo' : 'Add photo (optional)'}
          </label>
          {photoName && (
            <>
              <span style={{ color: '#64748B', fontSize: '13px', fontWeight: 500 }}>{photoName.substring(0, 20)}{photoName.length > 20 ? '…' : ''}</span>
              <button
                type="button"
                onClick={() => {
                  if (photoInput.current) photoInput.current.value = ''
                  setPhotoName('')
                }}
                style={{
                  padding: '0 8px',
                  border: 0,
                  background: 'transparent',
                  color: '#C2410C',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Remove
              </button>
            </>
          )}
        </div>

        <button
          type="submit"
          disabled={posting || !content.trim()}
          style={{
            width: '100%',
            minHeight: '48px',
            padding: '14px 20px',
            border: 0,
            borderRadius: '12px',
            background: posting || !content.trim() ? '#FDBA98' : '#FC4C02',
            color: '#FFFFFF',
            fontSize: '15px',
            fontWeight: 800,
            cursor: posting || !content.trim() ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: posting || !content.trim() ? 'none' : '0 4px 12px rgba(252, 76, 2, 0.2)',
            opacity: posting || !content.trim() ? 0.7 : 1,
          }}
        >
          {posting ? 'Sharing…' : 'Share story'}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            margin: '16px 0 0',
            padding: '12px 14px',
            background: '#FEE2E2',
            border: '1px solid #FECACA',
            borderRadius: '10px',
            color: '#B91C1C',
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          {error}
        </div>
      )}
      {message && (
        <div
          role="status"
          aria-live="polite"
          style={{
            margin: '16px 0 0',
            padding: '12px 14px',
            background: '#DCFCE7',
            border: '1px solid #BBFAB0',
            borderRadius: '10px',
            color: '#166534',
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          {message}
        </div>
      )}
    </form>
  )
}
