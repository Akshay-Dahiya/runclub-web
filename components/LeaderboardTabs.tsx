'use client'
import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

type Entry = any

function formatPace(sec:number|null){
  if (!sec) return '—'
  const m = Math.floor(sec/60)
  const s = sec%60
  return `${m}:${String(s).padStart(2,'0')}/km`
}

export default function LeaderboardTabs(){
  const tabs = ['weekly','10k','21k','improvement']
  const [active, setActive] = useState('weekly')
  const [data, setData] = useState<{entries:Entry[]}|null>(null)

  useEffect(()=>{
    setData(null)
    fetch(`/api/leaderboards?type=${active}`).then(r=>r.json()).then(setData).catch(()=>setData({entries:[]}))
  },[active])

  const { data: session } = useSession()

  async function toggleLike(targetUserId:string){
    const userId = (session as any)?.user?.id as string | undefined
    if (!userId) {
      alert('Please sign in to give kudos')
      return
    }
    await fetch('/api/leaderboards/like', { method: 'POST', body: JSON.stringify({ leaderboardType: active, targetUserId }), headers: { 'Content-Type':'application/json' }, credentials: 'include' })
    fetch(`/api/leaderboards?type=${active}`).then(r=>r.json()).then(setData)
  }

  return (
    <div>
      <div className="flex gap-2 mb-3">
        {tabs.map(t=> (
          <button key={t} onClick={()=>setActive(t)} className={`px-2 py-1 rounded ${active===t?'bg-blue-600 text-white':'bg-gray-100 dark:bg-gray-700'}`}>{t.toUpperCase()}</button>
        ))}
      </div>
      {!data && <div>Loading...</div>}
      {data && (
        <ol className="space-y-2">
          {data.entries.map((e:any)=> (
            <li key={e.userId} className="flex items-center justify-between p-2 border rounded">
              <div className="flex items-center gap-3">
                <div className="font-semibold">#{e.rank}</div>
                <div>
                  <div className="font-medium">{e.name || e.userId}</div>
                  {e.distanceKm != null && <div className="text-sm text-gray-500">{e.distanceKm.toFixed(1)} km</div>}
                  {e.bestPaceSec != null && <div className="text-sm text-gray-500">Best pace: {formatPace(e.bestPaceSec)}</div>}
                  {e.improvement != null && <div className="text-sm text-gray-500">Improvement: {e.improvement.toFixed(1)}%</div>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm">{e.likes || 0} kudos</div>
                <button onClick={()=>toggleLike(e.userId)} className="px-2 py-1 bg-green-500 text-white rounded">Kudos</button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
