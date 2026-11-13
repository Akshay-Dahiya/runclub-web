import type { Metadata } from 'next'
import Link from 'next/link'
import ClubStories from '../../components/ClubStories'
import Footer from '../../components/Footer'
import Navbar from '../../components/Navbar'
import { getCurrentRunner } from '../../lib/auth/runner'
import { hasDatabaseConfig } from '../../lib/prisma'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Club Stories | Joyville Road Runners',
  description: 'Stories and photos shared by the Joyville Road Runners community.',
}

export default async function StoriesPage() {
  let viewerRunnerId: string | null = null

  if (hasDatabaseConfig()) {
    try {
      viewerRunnerId = (await getCurrentRunner())?.id ?? null
    } catch {
      viewerRunnerId = null
    }
  }

  return (
    <>
      <Navbar />
      <main style={{ minHeight: '70vh', padding: '112px 20px 76px', background: '#FFFFFF' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <Link href="/" style={{ color: '#C2410C', fontSize: '13px', fontWeight: 800, textDecoration: 'none' }}>
            ← Back to RunClub
          </Link>
          <div style={{ margin: '26px 0 30px' }}>
            <p style={{ margin: '0 0 12px', color: '#C2410C', fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
              RunClub / Group journal
            </p>
            <h1 id="club-stories-page-heading" style={{ margin: '0 0 12px', color: '#0F172A', fontSize: 'clamp(2.5rem, 10vw, 4.25rem)', fontWeight: 900, letterSpacing: '-0.06em', lineHeight: 0.98 }}>
              Club stories
            </h1>
            <p style={{ maxWidth: '600px', margin: 0, color: '#64748B', fontSize: '16px', lineHeight: 1.65 }}>
              A shared place for the miles, moments, and photos our runners want the whole group to remember.
            </p>
          </div>
          <ClubStories viewerRunnerId={viewerRunnerId} variant="full" />
        </div>
      </main>
      <Footer />
    </>
  )
}
