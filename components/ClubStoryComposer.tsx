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
        padding: '22px',
        marginBottom: '28px',
        background: '#FFF7F2',
        border: '1px solid #FED7C3',
        borderRadius: '18px',
      }}
    >
      <label htmlFor="club-story-content" style={{ display: 'block', marginBottom: '9px', color: '#0F172A', fontSize: '14px', fontWeight: 800 }}>
        Share a story with your club
      </label>
      <textarea
        id="club-story-content"
        name="content"
        value={content}
        onChange={event => setContent(event.target.value)}
        maxLength={2000}
        required
        rows={4}
        placeholder="A run you enjoyed, a race-day moment, or a small win..."
        style={{
          boxSizing: 'border-box',
          display: 'block',
          width: '100%',
          minHeight: '116px',
          resize: 'vertical',
          padding: '14px 15px',
          border: '1px solid #CBD5E1',
          borderRadius: '12px',
          background: '#FFFFFF',
          color: '#0F172A',
          font: 'inherit',
          lineHeight: 1.55,
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginTop: '7px', color: '#64748B', fontSize: '12px' }}>
        <span>Visible to connected RunClub runners</span>
        <span>{content.length}/2000</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginTop: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <label htmlFor="club-story-photo" style={{ color: '#475569', fontSize: '13px', fontWeight: 700 }}>
            Add a photo (optional)
          </label>
          <input
            ref={photoInput}
            id="club-story-photo"
            name="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={event => setPhotoName(event.target.files?.[0]?.name || '')}
            style={{ maxWidth: '100%', color: '#475569', fontSize: '12px' }}
          />
          {photoName && (
            <button
              type="button"
              onClick={() => {
                if (photoInput.current) photoInput.current.value = ''
                setPhotoName('')
              }}
              style={{ padding: 0, border: 0, background: 'transparent', color: '#C2410C', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
            >
              Remove photo
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={posting}
          style={{
            minHeight: '44px',
            padding: '11px 20px',
            border: 0,
            borderRadius: '999px',
            background: posting ? '#FDBA98' : '#FC4C02',
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: 800,
            cursor: posting ? 'wait' : 'pointer',
          }}
        >
          {posting ? 'Sharing…' : 'Share story'}
        </button>
      </div>
      {error && <p role="alert" style={{ margin: '14px 0 0', color: '#B91C1C', fontSize: '13px' }}>{error}</p>}
      {message && <p role="status" aria-live="polite" style={{ margin: '14px 0 0', color: '#166534', fontSize: '13px' }}>{message}</p>}
    </form>
  )
}
