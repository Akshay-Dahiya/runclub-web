"use client"

import Link from 'next/link'
import useSWR from 'swr'
import ClubStoryCard from './ClubStoryCard'
import ClubStoryComposer from './ClubStoryComposer'
import type { ClubStoriesResponse } from '../lib/club-stories'

type ClubStoriesProps = {
  viewerRunnerId: string | null
  variant?: 'preview' | 'full'
}

async function fetchStories(url: string): Promise<ClubStoriesResponse> {
  const response = await fetch(url, { cache: 'no-store' })
  const result = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(result?.error || 'The story board could not be loaded.')
  }

  return result as ClubStoriesResponse
}

export default function ClubStories({ viewerRunnerId, variant = 'preview' }: ClubStoriesProps) {
  const isFullPage = variant === 'full'
  const storyLimit = isFullPage ? 50 : 3
  const storiesKey = viewerRunnerId ? `/api/stories?limit=${storyLimit}` : null
  const { data, error, isLoading, mutate } = useSWR<ClubStoriesResponse>(storiesKey, fetchStories)
  const stories = data?.stories ?? []

  return (
    <section
      id={isFullPage ? 'club-stories-feed' : undefined}
      aria-labelledby={isFullPage ? 'club-stories-feed-heading' : 'club-stories-heading'}
      className={isFullPage ? 'club-stories club-stories--full' : 'club-stories club-stories--preview'}
    >
      <div className={isFullPage ? 'club-stories__inner' : 'club-stories__preview-inner'}>
        {!isFullPage && (
          <div className="club-stories__preview-heading">
            <div>
              <span className="section-tag">// From the club</span>
              <h2 id="club-stories-heading" className="section-title">Club stories</h2>
              <p className="section-sub">Run moments, race days, and wins worth sharing.</p>
            </div>
            <Link href="/stories" className="club-stories__view-all">
              View all <span aria-hidden="true">→</span>
            </Link>
          </div>
        )}

        {isFullPage && (
          <div className="club-stories__feed-heading">
            <div>
              <p className="club-stories__feed-kicker">The group journal</p>
              <h2 id="club-stories-feed-heading">Latest from the crew</h2>
            </div>
            <span className="club-stories__feed-note">Shared by runners, for runners</span>
          </div>
        )}

        {isFullPage && viewerRunnerId && (
          <ClubStoryComposer onPosted={() => mutate()} />
        )}

        {!viewerRunnerId ? (
          <div className="club-stories__signin">
            <h3>Stories are better together</h3>
            <p>Connect with Strava to read and share moments with your running crew.</p>
            <Link href="/login" className="club-stories__signin-link">
              Connect with Strava
            </Link>
          </div>
        ) : (
          <>
            {isLoading && <p role="status" className="club-stories__status">Loading club stories…</p>}
            {error && (
              <div role="alert" className="club-stories__error">
                The story board is unavailable. Please try again later.
              </div>
            )}
            {!isLoading && !error && stories.length === 0 && (
              <div className="club-stories__empty">
                <strong>No stories yet</strong>
                <span>Share a run moment or race memory to get the journal started.</span>
              </div>
            )}
            {stories.length > 0 && (
              <div className="club-stories__grid">
                {stories.map(story => <ClubStoryCard key={story.id} story={story} />)}
              </div>
            )}
            {isFullPage && stories.length >= storyLimit && (
              <p className="club-stories__limit">Showing the latest {storyLimit} stories</p>
            )}
          </>
        )}
      </div>
    </section>
  )
}
