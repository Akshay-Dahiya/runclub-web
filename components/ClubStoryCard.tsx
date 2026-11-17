"use client"

import { useState, useEffect } from 'react'
import type { ClubStory } from '../lib/club-stories'

type ClubStoryCardProps = {
  story: ClubStory
  onDeleted?: (storyId: string) => void
  onUpdated?: (updatedStory: ClubStory) => void
}

export default function ClubStoryCard({ story, onDeleted, onUpdated }: ClubStoryCardProps) {
  const [likes, setLikes] = useState(story.likesCount || 0)
  const [hasLiked, setHasLiked] = useState(false)
  const [isAuthor, setIsAuthor] = useState(story.isMine)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(story.content)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [reported, setReported] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(`story_token_${story.id}`)
      if (token) {
        setIsAuthor(true)
      }
      const likedState = localStorage.getItem(`story_liked_${story.id}`)
      if (likedState === 'true') {
        setHasLiked(true)
      }
    }
  }, [story.id, story.isMine])

  const date = new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(story.createdAt))

  const handleLike = async () => {
    if (hasLiked) return
    setLikes((prev) => prev + 1)
    setHasLiked(true)
    if (typeof window !== 'undefined') {
      localStorage.setItem(`story_liked_${story.id}`, 'true')
    }
    try {
      await fetch(`/api/stories/${story.id}/like`, { method: 'POST' })
    } catch {
      // optimistic
    }
  }

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return
    setIsSaving(true)
    try {
      const storedToken = typeof window !== 'undefined' ? localStorage.getItem(`story_token_${story.id}`) : null
      const res = await fetch(`/api/stories/${story.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-story-token': storedToken || '',
        },
        body: JSON.stringify({ content: editContent.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.story) {
        setIsEditing(false)
        onUpdated?.(data.story)
      } else {
        alert(data.error || 'Failed to update story.')
      }
    } catch {
      alert('Error updating story.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const storedToken = typeof window !== 'undefined' ? localStorage.getItem(`story_token_${story.id}`) : null
      const res = await fetch(`/api/stories/${story.id}`, {
        method: 'DELETE',
        headers: {
          'x-story-token': storedToken || '',
        },
      })
      if (res.ok) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(`story_token_${story.id}`)
        }
        onDeleted?.(story.id)
      } else {
        const data = await res.json().catch(() => ({}))
        alert(data.error || 'Failed to delete story.')
      }
    } catch {
      alert('Error deleting story.')
    } finally {
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  const handleReport = async () => {
    if (reported) return
    if (!confirm('Would you like to flag this story for community moderation?')) return
    try {
      const res = await fetch(`/api/stories/${story.id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Flagged by user' }),
      })
      if (res.ok) {
        setReported(true)
        alert('Thank you. This story was flagged for review.')
      }
    } catch {
      alert('Error reporting story.')
    }
  }

  return (
    <article
      className="club-story-card"
      aria-labelledby={`club-story-${story.id}`}
      style={{
        background: '#FFFFFF',
        borderRadius: '18px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
    >
      {story.photoUrl && (
        <div style={{ width: '100%', height: '200px', background: '#F1F5F9', overflow: 'hidden' }}>
          <img
            src={story.photoUrl}
            alt={`Photo by ${story.authorName}`}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      )}

      <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <div
            aria-hidden="true"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #FFF1E8 0%, #FFEBE0 100%)',
              color: '#C2410C',
              fontSize: '13px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {story.authorInitials}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h3
              id={`club-story-${story.id}`}
              style={{
                margin: '0 0 2px 0',
                fontSize: '14px',
                fontWeight: 800,
                color: '#0F172A',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {story.authorName}
            </h3>
            <time dateTime={story.createdAt} style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>
              {date}
            </time>
          </div>

          {isAuthor && (
            <span
              style={{
                padding: '4px 8px',
                borderRadius: '8px',
                background: '#FFF7ED',
                color: '#C2410C',
                border: '1px solid #FED7AA',
                fontSize: '11px',
                fontWeight: 700,
              }}
            >
              YOU
            </span>
          )}
        </div>

        {/* Content or Edit Form */}
        {isEditing ? (
          <div style={{ marginBottom: '14px' }}>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={3}
              maxLength={2000}
              style={{
                boxSizing: 'border-box',
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1.5px solid #FC4C02',
                fontSize: '14px',
                color: '#0F172A',
                outline: 'none',
                font: 'inherit',
              }}
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSaving}
                style={{
                  background: '#FC4C02',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditContent(story.content)
                  setIsEditing(false)
                }}
                style={{
                  background: '#F1F5F9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p
            style={{
              margin: '0 0 16px 0',
              fontSize: '14px',
              color: '#334155',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              flex: 1,
            }}
          >
            {story.content}
          </p>
        )}

        {/* Actions Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '12px',
            borderTop: '1px solid #F1F5F9',
            fontSize: '12px',
          }}
        >
          <button
            type="button"
            onClick={handleLike}
            style={{
              background: hasLiked ? '#FFF1F2' : '#F8FAFC',
              border: hasLiked ? '1px solid #FECDD3' : '1px solid #E2E8F0',
              color: hasLiked ? '#E11D48' : '#475569',
              borderRadius: '20px',
              padding: '4px 12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 700,
              cursor: hasLiked ? 'default' : 'pointer',
            }}
          >
            <span>{hasLiked ? '❤️' : '🤍'}</span>
            <span>{likes > 0 ? `${likes} Kudos` : 'Kudos'}</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isAuthor ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748B',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '4px 8px',
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirm(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#EF4444',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '4px 8px',
                  }}
                >
                  Delete
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleReport}
                disabled={reported}
                title="Flag story for moderation"
                style={{
                  background: 'none',
                  border: 'none',
                  color: reported ? '#16A34A' : '#94A3B8',
                  fontSize: '12px',
                  cursor: reported ? 'default' : 'pointer',
                  padding: '4px 8px',
                }}
              >
                {reported ? 'Flagged ✓' : '🚩 Report'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(3px)',
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '380px',
              width: '100%',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            }}
          >
            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>
              Delete this story?
            </h4>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748B', lineHeight: 1.5 }}>
              This cannot be undone. Your story and photo will be permanently removed.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={isDeleting}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                  background: '#FFFFFF',
                  color: '#475569',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#DC2626',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                }}
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  )
}
