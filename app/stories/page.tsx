import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
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

  if (!viewerRunnerId) redirect('/login')

  return (
    <>
      <Navbar />
      <main className="stories-page">
        <div className="stories-shell">
          <Link href="/" className="stories-back">
            <span aria-hidden="true">←</span> Back to RunClub
          </Link>
          <header className="stories-hero">
            <p className="stories-hero__eyebrow">Joyville Road Runners / Club journal</p>
            <h1 id="club-stories-page-heading">Run moments worth remembering.</h1>
            <p className="stories-hero__description">
              A shared place for the miles, race days, and little wins our runners want the whole crew to remember.
            </p>
            <Link href="#club-stories-feed" className="stories-hero__link">
              Read the stories <span aria-hidden="true">↓</span>
            </Link>
          </header>
          <ClubStories viewerRunnerId={viewerRunnerId} variant="full" />
        </div>
      </main>
      <Footer />
    </>
  )
}
