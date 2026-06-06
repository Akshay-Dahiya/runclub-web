'use client'
import React, { useEffect, useState } from 'react'

export default function RunList() {
  const [runs, setRuns] = useState<any[]>([])
  useEffect(() => {
    fetch('/api/runs')
      .then(r => r.json())
      .then(setRuns)
      .catch(() => setRuns([]))
  }, [])

  return (
    <div className="space-y-3">
      {runs.length === 0 && <div className="text-sm text-gray-500">No runs yet.</div>}
      {runs.map(r => (
        <div key={r.id} className="p-3 border rounded">
          <div className="font-medium">{new Date(r.date).toLocaleDateString()}</div>
          <div className="text-sm">{r.distanceKm} km • {Math.round(r.paceSecPerKm / 60)}:{String(r.paceSecPerKm % 60).padStart(2,'0')} /km</div>
        </div>
      ))}
    </div>
  )
}
