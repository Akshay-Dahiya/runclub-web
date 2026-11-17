"use client"

import { useRef, useState, type FormEvent } from 'react'

const MAX_PHOTO_SIZE = 5 * 1024 * 1024

export default function ClubStoryComposer({
  viewerRunnerId,
  onPosted
}: {
  viewerRunnerId?: string | null
  onPosted: () => Promise<unknown> | void
}) {
  const photoInput = useRef<HTMLInputElement>(null)
  const [posting, setPosting] = useState(false)
  const [authorName, setAuthorName] = useState('')
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

    if (!viewerRunnerId && !authorName.trim()) {
      setError('Please enter your name.')
      return
    }

    if (photo && photo.size > MAX_PHOTO_SIZE) {
      setError('Choose a photo smaller than 5 MB.')
      return
    }

    setPosting(true)

    try {
      const formData = new FormData()
      formData.set('content', trimmedContent)
      if (!viewerRunnerId && authorName.trim()) {
        formData.set('authorName', authorName.trim())
      }
      if (photo) {
        formData.set('photo', photo)
      }

      const response = await fetch('/api/stories', { method: 'POST', body: formData })
      const result = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(result?.error || 'Your story could not be shared.')
      }

      // Store edit token locally for guest / author management
      if (result.story?.id && result.editToken) {
        try {
          localStorage.setItem(`story_token_${result.story.id}`, result.editToken)
        } catch {
          // ignore localStorage limitations
        }
      }

      setContent('')
      setAuthorName('')
      setPhotoName('')
      if (photoInput.current) photoInput.current.value = ''
      setMessage('Your story is now shared with the club!')
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
        padding: '24px',
        marginBottom: '36px',
        background: '#FFFFFF',
        border: '1.5px solid #FFEDD5',
        borderRadius: '20px',
        boxShadow: '0 4px 18px rgba(252, 76, 2, 0.06)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <label htmlFor="club-story-content" style={{ color: '#0F172A', fontSize: '16px', fontWeight: 800, letterSpacing: '-0.3px', margin: 0 }}>
          Share a run story
        </label>
        <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>
          {content.length}/2000
        </span>
      </div>

      {!viewerRunnerId && (
        <div style={{ marginBottom: '14px' }}>
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Your Name (e.g. Rahul Sharma)"
            maxLength={50}
            required
            style={{
              boxSizing: 'border-box',
              width: '100%',
              padding: '10px 14px',
              border: '1.5px solid #E2E8F0',
              borderRadius: '12px',
              fontSize: '14px',
              color: '#0F172A',
              outline: 'none',
              background: '#F8FAFC',
            }}
          />
        </div>
      )}

      <textarea
        id="club-story-content"
        name="content"
        value={content}
        onChange={event => setContent(event.target.value)}
        maxLength={2000}
        required
        rows={3}
        placeholder="A run you loved, weekend long run milestone, or a personal win..."
        style={{
          boxSizing: 'border-box',
          display: 'block',
          width: '100%',
          minHeight: '100px',
          resize: 'vertical',
          padding: '12px 14px',
          border: '1.5px solid #E2E8F0',
          borderRadius: '12px',
          background: '#F8FAFC',
          color: '#0F172A',
          font: 'inherit',
          lineHeight: 1.6,
          fontSize: '14px',
          outline: 'none',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label
            htmlFor="club-story-photo"
            style={{
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '10px',
              background: '#FFF7ED',
              border: '1px solid #FED7AA',
              color: '#C2410C',
              fontSize: '13px',
              fontWeight: 700,
            }}
          >
            📷 {photoName ? 'Change photo' : 'Add photo'}
          </label>
          <input
            ref={photoInput}
            id="club-story-photo"
            name="photo"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            style={{ display: 'none' }}
            onChange={e => setPhotoName(e.target.files?.[0]?.name || '')}
          />
          {photoName && (
            <span style={{ fontSize: '12px', color: '#64748B', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {photoName}
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={posting}
          style={{
            background: posting ? '#94A3B8' : '#FC4C02',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '12px',
            padding: '10px 22px',
            fontSize: '13px',
            fontWeight: 800,
            cursor: posting ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 12px rgba(252, 76, 2, 0.25)',
          }}
        >
          {posting ? 'Sharing...' : 'Share with club'}
        </button>
      </div>

      {error && (
        <div role="alert" style={{ marginTop: '14px', padding: '10px 14px', borderRadius: '10px', background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: '13px', fontWeight: 600 }}>
          {error}
        </div>
      )}

      {message && (
        <div role="status" style={{ marginTop: '14px', padding: '10px 14px', borderRadius: '10px', background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#16A34A', fontSize: '13px', fontWeight: 600 }}>
          {message}
        </div>
      )}
    </form>
  )
}
