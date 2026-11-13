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
      aria-labelledby={isFullPage ? 'club-stories-page-heading' : 'club-stories-heading'}
      style={{
        padding: isFullPage ? '0' : '72px 24px 84px',
        background: isFullPage ? 'transparent' : '#F8FAFC',
        borderTop: isFullPage ? 0 : '1px solid #E2E8F0',
      }}
    >
      <div style={{ maxWidth: isFullPage ? '860px' : '1240px', margin: '0 auto' }}>
        {!isFullPage && (
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '18px', marginBottom: '28px' }}>
            <div>
              <span className="section-tag">// From the club</span>
              <h2 id="club-stories-heading" className="section-title" style={{ marginBottom: '6px' }}>Club stories</h2>
              <p className="section-sub" style={{ margin: 0 }}>Run moments, race days, and wins worth sharing.</p>
            </div>
            <Link href="/stories" style={{ color: '#C2410C', fontSize: '14px', fontWeight: 800, textDecoration: 'none' }}>
              Open story board →
            </Link>
          </div>
        )}

        {isFullPage && viewerRunnerId && (
          <ClubStoryComposer onPosted={() => mutate()} />
        )}

        {!viewerRunnerId ? (
          <div style={{ padding: '22px', border: '1px solid #E2E8F0', borderRadius: '16px', background: '#FFFFFF' }}>
            <h3 style={{ margin: '0 0 7px', color: '#0F172A', fontSize: '17px', fontWeight: 800 }}>
              Stories are for the whole crew
            </h3>
            <p style={{ margin: '0 0 16px', color: '#64748B', fontSize: '14px', lineHeight: 1.6 }}>
              Connect with Strava to view and share the group&apos;s stories.
            </p>
            <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', minHeight: '42px', padding: '0 16px', borderRadius: '999px', background: '#FC4C02', color: '#FFFFFF', fontSize: '13px', fontWeight: 800, textDecoration: 'none' }}>
              Join with Strava
            </Link>
          </div>
        ) : (
          <>
            {isLoading && <p role="status" style={{ color: '#64748B', fontSize: '14px' }}>Loading club stories…</p>}
            {error && <p role="alert" style={{ padding: '16px', border: '1px solid #FECACA', borderRadius: '12px', background: '#FEF2F2', color: '#991B1B', fontSize: '14px' }}>The story board is unavailable right now. Please try again later.</p>}
            {!isLoading && !error && stories.length === 0 && (
              <div style={{ padding: '24px', border: '1px dashed #CBD5E1', borderRadius: '16px', background: '#FFFFFF', color: '#64748B', fontSize: '14px', lineHeight: 1.6 }}>
                No stories yet. Share a run moment or race-day memory to start the group journal.
              </div>
            )}
            {stories.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                {stories.map(story => <ClubStoryCard key={story.id} story={story} />)}
              </div>
            )}
            {isFullPage && stories.length >= storyLimit && (
              <p style={{ margin: '18px 0 0', color: '#64748B', fontSize: '12px' }}>Showing the latest {storyLimit} stories.</p>
            )}
          </>
        )}
      </div>
    </section>
  )
}
