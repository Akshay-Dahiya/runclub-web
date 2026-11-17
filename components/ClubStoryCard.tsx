"use client"

import { useState } from 'react'
import type { ClubStory } from '../lib/club-stories'

type ClubStoryCardProps = {
  story: ClubStory
  onEdit?: (story: ClubStory) => void
  onDelete?: (storyId: string) => void
  onReport?: (storyId: string) => void
}

export default function ClubStoryCard({ story, onEdit, onDelete, onReport }: ClubStoryCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [likes, setLikes] = useState(0)
  const [hasLiked, setHasLiked] = useState(false)

  const date = new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(story.createdAt))

  const handleLike = () => {
    if (hasLiked) {
      setLikes((prev) => Math.max(0, prev - 1))
      setHasLiked(false)
    } else {
      setLikes((prev) => prev + 1)
      setHasLiked(true)
    }
  }

  const handleDeleteConfirm = async () => {
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
        onDelete?.(story.id)
      } else {
        const data = await res.json().catch(() => ({}))
        alert(data.error || 'Failed to delete story')
      }
    } catch {
      alert('Error connecting to delete service')
    } finally {
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  return (
    <article
      className="club-story-card bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow duration-200"
      aria-labelledby={`club-story-${story.id}`}
    >
      {story.photoUrl && (
        <div className="relative w-full h-48 bg-slate-100 overflow-hidden">
          <img
            src={story.photoUrl}
            alt={`Photo shared by ${story.authorName}`}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>
      )}

      <div className="p-5 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3.5">
          <div
            aria-hidden="true"
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-gradient-to-br from-orange-100 to-amber-100 text-[#FC4C02] shadow-sm flex-shrink-0"
          >
            {story.authorInitials}
          </div>
          <div className="min-w-0 flex-1">
            <h3
              id={`club-story-${story.id}`}
              className="text-sm font-bold text-slate-900 truncate"
            >
              {story.authorName}
            </h3>
            <time dateTime={story.createdAt} className="text-xs text-slate-500 font-medium">
              {date}
            </time>
          </div>

          {story.isMine && (
            <span className="px-2.5 py-1 rounded-full bg-orange-50 text-[#FC4C02] border border-orange-200 text-xs font-semibold">
              YOU
            </span>
          )}
        </div>

        {/* Content */}
        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap break-words flex-1 mb-4">
          {story.content}
        </p>

        {/* Action controls */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLike}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors ${
                hasLiked
                  ? 'bg-rose-50 border-rose-200 text-rose-600 font-semibold'
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
              aria-label={hasLiked ? 'Unlike story' : 'Like story'}
            >
              <span>{hasLiked ? '❤️' : '🤍'}</span>
              <span>{likes > 0 ? likes : 'Kudos'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {story.isMine ? (
              <>
                <button
                  type="button"
                  onClick={() => onEdit?.(story)}
                  className="px-2 py-1 text-slate-600 hover:text-slate-900 hover:underline font-medium"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirm(true)}
                  className="px-2 py-1 text-rose-600 hover:text-rose-700 hover:underline font-medium"
                >
                  Delete
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => onReport?.(story.id)}
                className="px-2 py-1 text-slate-400 hover:text-slate-600"
                title="Report story"
              >
                🚩
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        >
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200">
            <h4 className="text-base font-bold text-slate-900 mb-2">Delete this story?</h4>
            <p className="text-sm text-slate-600 mb-6">
              This action cannot be undone. Your story and photo will be permanently removed.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700"
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
