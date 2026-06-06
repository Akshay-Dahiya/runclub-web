import React from 'react'
import RunList from './RunList'
import Leaderboard from './Leaderboard'
import Feed from './Feed'

export default function Dashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <section className="md:col-span-2 space-y-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
          <h2 className="text-xl font-semibold">Recent Activities</h2>
          <RunList />
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
          <h2 className="text-xl font-semibold">Club Feed</h2>
          <Feed />
        </div>
      </section>
      <aside className="space-y-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Leaderboards</h3>
          <Leaderboard />
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">AI Coach widget (coming)</div>
      </aside>
    </div>
  )
}
