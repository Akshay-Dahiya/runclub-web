'use client'

import { useSession, signIn, signOut } from 'next-auth/react'

export default function AuthHeader() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <div className="text-sm text-slate-500">Loading auth...</div>
  }

  if (!session) {
    return (
      <button
        onClick={() => signIn()}
        className="rounded-full bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Sign in
      </button>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <div>
        <div className="text-sm text-slate-500">Signed in as</div>
        <div className="font-semibold">{session.user?.name || session.user?.email}</div>
      </div>
      <button
        onClick={() => signOut()}
        className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        Sign out
      </button>
    </div>
  )
}
