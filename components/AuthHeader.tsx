import Link from 'next/link'

export default function AuthHeader() {
  return (
    <Link
      href="/api/strava"
      className="rounded-full bg-orange-600 px-4 py-2 text-white hover:bg-orange-700"
    >
      Join with Strava
    </Link>
  )
}
