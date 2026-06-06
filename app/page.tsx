import React from 'react'
import Dashboard from '../components/Dashboard'
import AuthHeader from '../components/AuthHeader'

export default async function Page() {
  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">RunClub</p>
          <h1 className="text-3xl font-bold mt-2">Healthy competition for every runner</h1>
        </div>
        <AuthHeader />
      </div>
      <Dashboard />
    </main>
  )
}
