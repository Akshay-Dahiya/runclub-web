import React from 'react'

export default function ProfileCard({ user }: { user: any }) {
  return (
    <div className="p-4 rounded bg-white dark:bg-gray-800">
      <div className="flex items-center gap-3">
        <img src={user?.image || '/avatar.png'} alt="avatar" className="w-12 h-12 rounded-full" />
        <div>
          <div className="font-semibold">{user?.name || user?.email}</div>
          <div className="text-sm text-gray-500">Goal: {user?.runningGoal || '—'}</div>
        </div>
      </div>
    </div>
  )
}
