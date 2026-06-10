"use client"
import React, { useState, useEffect, useCallback } from 'react'
import { PARTICIPANTS, PLAN_10K, PLAN_HM_INT, PLAN_HM_BEG } from '../../lib/planData'

const PLANS = ['10K', 'HM_INT', 'HM_BEG']
const PLAN_LABELS: Record<string, string> = { '10K': '10K Run', 'HM_INT': 'Half Marathon (Int)', 'HM_BEG': 'Half Marathon (Beg)' }

const s = {
  page: { minHeight: '100vh', background: '#0a0a0a', color: '#e8e8e8', fontFamily: "'Space Grotesk', system-ui, sans-serif", padding: '0' },
  header: { background: '#111', borderBottom: '1px solid #222', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky' as const, top: 0, zIndex: 100 },
  badge: { background: '#FC4C02', color: '#000', fontFamily: 'monospace', fontSize: '10px', fontWeight: 700, padding: '4px 8px', borderRadius: '4px', letterSpacing: '0.15em' },
  tabs: { display: 'flex', gap: '0', borderBottom: '1px solid #222', padding: '0 32px', background: '#0f0f0f' },
  tab: (active: boolean): React.CSSProperties => ({ padding: '14px 20px', cursor: 'pointer', fontFamily: 'monospace', fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase' as const, border: 'none', background: 'none', color: active ? '#FC4C02' : '#666', borderBottom: active ? '2px solid #FC4C02' : '2px solid transparent', transition: 'all 0.2s' }),
  body: { padding: '32px', maxWidth: '1200px', margin: '0 auto' },
  statGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '32px' },
  statCard: { background: '#111', border: '1px solid #222', borderRadius: '8px', padding: '20px', textAlign: 'center' as const },
  statVal: { fontFamily: 'monospace', fontSize: '2rem', fontWeight: 700, color: '#FC4C02', lineHeight: 1 },
  statLabel: { fontFamily: 'monospace', fontSize: '10px', color: '#555', marginTop: '6px', letterSpacing: '0.1em', textTransform: 'uppercase' as const },
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: '13px' },
  th: { textAlign: 'left' as const, fontFamily: 'monospace', fontSize: '10px', color: '#555', padding: '8px 12px', borderBottom: '1px solid #222', letterSpacing: '0.1em', textTransform: 'uppercase' as const },
  td: { padding: '10px 12px', borderBottom: '1px solid #1a1a1a', verticalAlign: 'middle' as const },
  btn: (color = '#FC4C02'): React.CSSProperties => ({ background: color, color: color === '#FC4C02' ? '#000' : '#fff', border: 'none', borderRadius: '4px', padding: '6px 12px', fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.05em' }),
  input: { background: '#1a1a1a', border: '1px solid #333', borderRadius: '4px', color: '#e8e8e8', padding: '8px 12px', fontFamily: 'monospace', fontSize: '13px', width: '100%', boxSizing: 'border-box' as const },
  select: { background: '#1a1a1a', border: '1px solid #333', borderRadius: '4px', color: '#e8e8e8', padding: '8px 12px', fontFamily: 'monospace', fontSize: '13px', width: '100%' },
  modal: { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  modalBox: { background: '#111', border: '1px solid #333', borderRadius: '8px', padding: '28px', width: '90%', maxWidth: '480px' },
  label: { fontFamily: 'monospace', fontSize: '10px', color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '4px', display: 'block' },
  formGroup: { marginBottom: '16px' },
  section: { background: '#111', border: '1px solid #1e1e1e', borderRadius: '8px', padding: '24px', marginBottom: '24px' },
  sectionTitle: { fontFamily: 'monospace', fontSize: '11px', color: '#FC4C02', letterSpacing: '0.2em', textTransform: 'uppercase' as const, marginBottom: '16px' },
  alertBox: { background: '#1a1000', border: '1px solid #663300', borderRadius: '6px', padding: '12px 16px', marginTop: '12px', fontSize: '12px', color: '#ffbb55' },
}

// ─── Quick Stats Tab ──────────────────────────────────────────────────────────
function StatsTab() {
  const [data, setData] = useState<any>(null)
  useEffect(() => { fetch('/api/admin?action=stats').then(r => r.json()).then(setData) }, [])
  if (!data) return <div style={{ color: '#555', fontFamily: 'monospace', padding: '32px' }}>Loading stats...</div>
  return (
    <div>
      <div style={s.statGrid}>
        {[
          { label: 'Total Runners', val: data.totalRunners },
          { label: 'Total Runs', val: data.totalRuns },
          { label: 'Total KM', val: `${data.totalKm} km` },
          { label: 'Runs This Week', val: data.runsThisWeek },
          { label: 'KM This Week', val: `${data.kmThisWeek} km` },
        ].map(s2 => (
          <div key={s2.label} style={s.statCard}>
            <div style={s.statVal}>{s2.val}</div>
            <div style={s.statLabel}>{s2.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div style={s.section}>
          <div style={s.sectionTitle}>😴 Not Run This Week ({data.notRunThisWeek.length})</div>
          {data.notRunThisWeek.length === 0
            ? <p style={{ color: '#4ade80', fontFamily: 'monospace', fontSize: '12px' }}>✓ Everyone ran this week!</p>
            : data.notRunThisWeek.map((name: string) => <div key={name} style={{ fontFamily: 'monospace', fontSize: '13px', padding: '4px 0', borderBottom: '1px solid #1a1a1a', color: '#ffbb55' }}>{name}</div>)
          }
        </div>
        <div style={s.section}>
          <div style={s.sectionTitle}>⚠️ 20%+ Behind Plan ({data.behindRunners.length})</div>
          {data.behindRunners.length === 0
            ? <p style={{ color: '#4ade80', fontFamily: 'monospace', fontSize: '12px' }}>✓ No one critically behind!</p>
            : data.behindRunners.map((r: any) => (
              <div key={r.name} style={{ fontFamily: 'monospace', fontSize: '13px', padding: '6px 0', borderBottom: '1px solid #1a1a1a' }}>
                <span style={{ color: '#ef4444' }}>{r.name}</span>
                <span style={{ color: '#555', fontSize: '11px', marginLeft: '8px' }}>{r.pct}% · {r.gap} km behind</span>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}

// ─── Runner Management Tab ────────────────────────────────────────────────────
function RunnersTab() {
  const [runners, setRunners] = useState<any[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [editRunner, setEditRunner] = useState<any>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null)
  const [form, setForm] = useState({ name: '', plan: '10K', initials: '' })
  const [loading, setLoading] = useState(false)

  const load = () => fetch('/api/admin?action=allRunners').then(r => r.json()).then(setRunners)
  useEffect(() => { load() }, [])

  const adminCall = async (action: string, extra: any) => {
    const res = await fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...extra }) })
    return res.json()
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    await adminCall('addRunner', form)
    setShowAdd(false); setForm({ name: '', plan: '10K', initials: '' }); load(); setLoading(false)
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    await adminCall('editRunner', { userId: editRunner.id, name: form.name, plan: form.plan, initials: form.initials })
    setEditRunner(null); load(); setLoading(false)
  }

  const handleDelete = async () => {
    setLoading(true)
    await adminCall('deleteRunner', { userId: deleteConfirm.id })
    setDeleteConfirm(null); load(); setLoading(false)
  }

  const openEdit = (r: any) => { setEditRunner(r); setForm({ name: r.name || '', plan: r.runningGoal || '10K', initials: r.initials || '' }) }

  const RunnerForm = ({ onSubmit, title }: { onSubmit: (e: React.FormEvent) => void; title: string }) => (
    <div style={s.modal}><div style={s.modalBox}>
      <h3 style={{ margin: '0 0 20px 0', fontSize: '1rem', fontWeight: 700 }}>{title}</h3>
      <form onSubmit={onSubmit}>
        <div style={s.formGroup}><label style={s.label}>Name</label><input style={s.input} value={form.name} onChange={e => { const n = e.target.value; setForm(f => ({ ...f, name: n, initials: f.initials || n.split(' ').map((w: string) => w[0]).join('').toUpperCase() })) }} required /></div>
        <div style={s.formGroup}><label style={s.label}>Plan</label><select style={s.select} value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}>{PLANS.map(p => <option key={p} value={p}>{PLAN_LABELS[p]}</option>)}</select></div>
        <div style={s.formGroup}><label style={s.label}>Initials (auto-suggested)</label><input style={s.input} value={form.initials} onChange={e => setForm(f => ({ ...f, initials: e.target.value.toUpperCase() }))} maxLength={4} /></div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={() => { setShowAdd(false); setEditRunner(null) }} style={{ ...s.btn('#333'), padding: '8px 16px' }}>Cancel</button>
          <button type="submit" disabled={loading} style={{ ...s.btn(), padding: '8px 16px' }}>Save</button>
        </div>
      </form>
    </div></div>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Runners ({runners.length})</h2>
        <button style={s.btn()} onClick={() => { setShowAdd(true); setForm({ name: '', plan: '10K', initials: '' }) }}>+ Add Runner</button>
      </div>
      {showAdd && <RunnerForm onSubmit={handleAdd} title="Add Runner" />}
      {editRunner && <RunnerForm onSubmit={handleEdit} title={`Edit ${editRunner.name}`} />}
      {deleteConfirm && (
        <div style={s.modal}><div style={s.modalBox}>
          <h3 style={{ margin: '0 0 12px 0', color: '#ef4444' }}>Remove {deleteConfirm.name}?</h3>
          <p style={{ fontSize: '13px', color: '#888', marginBottom: '20px' }}>Their run history will also be deleted. This cannot be undone.</p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button onClick={() => setDeleteConfirm(null)} style={{ ...s.btn('#333'), padding: '8px 16px' }}>Cancel</button>
            <button onClick={handleDelete} disabled={loading} style={{ ...s.btn('#ef4444'), padding: '8px 16px' }}>Yes, Remove</button>
          </div>
        </div></div>
      )}
      <div style={{ overflowX: 'auto' }}>
        <table style={s.table}>
          <thead><tr>
            {['Name', 'Plan', 'Total KM', 'Runs', 'Status', 'Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}
          </tr></thead>
          <tbody>
            {runners.map((r: any) => {
              const totalKm = r.runs?.reduce((s: number, run: any) => s + run.distanceKm, 0) || 0
              const p = PARTICIPANTS.find(p => p.email === r.email)
              return (
                <tr key={r.id} style={{ transition: 'background 0.15s' }}>
                  <td style={s.td}><span style={{ fontWeight: 600 }}>{r.name}</span><br /><span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#555' }}>{r.initials}</span></td>
                  <td style={s.td}><span style={{ fontFamily: 'monospace', fontSize: '11px', background: '#1a1a1a', padding: '2px 8px', borderRadius: '4px' }}>{PLAN_LABELS[r.runningGoal || '10K'] || r.runningGoal}</span></td>
                  <td style={s.td}><span style={{ fontFamily: 'monospace', color: '#FC4C02', fontWeight: 700 }}>{totalKm.toFixed(1)} km</span></td>
                  <td style={s.td}><span style={{ fontFamily: 'monospace' }}>{r.runs?.length || 0}</span></td>
                  <td style={s.td}><span style={{ fontFamily: 'monospace', fontSize: '10px' }}>{r.email}</span></td>
                  <td style={s.td}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button style={{ ...s.btn('#333'), padding: '4px 10px' }} onClick={() => openEdit(r)}>Edit</button>
                      <button style={{ ...s.btn('#3a0000'), color: '#ef4444', padding: '4px 10px' }} onClick={() => setDeleteConfirm(r)}>Remove</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Run Log Tab ──────────────────────────────────────────────────────────────
function RunLogTab() {
  const [runs, setRuns] = useState<any[]>([])
  const [runners, setRunners] = useState<any[]>([])
  const [filterRunner, setFilterRunner] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({ userId: '', date: new Date().toISOString().split('T')[0], distanceKm: '', pace: '', duration: '', notes: '' })
  const [loading, setLoading] = useState(false)

  const load = () => {
    fetch('/api/admin?action=allRuns').then(r => r.json()).then(setRuns)
    fetch('/api/admin?action=allRunners').then(r => r.json()).then(setRunners)
  }
  useEffect(() => { load() }, [])

  const adminCall = async (action: string, extra: any) => {
    const res = await fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...extra }) })
    return res.json()
  }

  const filtered = runs.filter(r => {
    if (filterRunner && r.userId !== filterRunner) return false
    if (filterFrom && new Date(r.date) < new Date(filterFrom)) return false
    if (filterTo && new Date(r.date) > new Date(filterTo + 'T23:59:59')) return false
    return true
  })

  const parsePace = (s: string) => { const [m, sec] = s.split(':').map(Number); return m * 60 + (sec || 0) }
  const parseDuration = (s: string) => { const p = s.split(':').map(Number); return p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p[0] * 3600 + (p[1] || 0) * 60 }

  const handleAddRun = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    const dist = parseFloat(addForm.distanceKm)
    const paceSecPerKm = addForm.pace ? parsePace(addForm.pace) : 0
    const durationSec = addForm.duration ? parseDuration(addForm.duration) : Math.round(dist * (paceSecPerKm || 360))
    await adminCall('addRun', { userId: addForm.userId, date: addForm.date, distanceKm: dist, paceSecPerKm: paceSecPerKm || Math.round(durationSec / dist), durationSec, notes: addForm.notes })
    setShowAdd(false); load(); setLoading(false)
  }

  return (
    <div>
      {showAdd && (
        <div style={s.modal}><div style={s.modalBox}>
          <h3 style={{ margin: '0 0 20px 0' }}>Log Run for Runner</h3>
          <form onSubmit={handleAddRun}>
            <div style={s.formGroup}><label style={s.label}>Runner</label>
              <select style={s.select} value={addForm.userId} onChange={e => setAddForm(f => ({ ...f, userId: e.target.value }))} required>
                <option value="">Select runner...</option>
                {runners.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={s.formGroup}><label style={s.label}>Date</label><input type="date" style={s.input} value={addForm.date} onChange={e => setAddForm(f => ({ ...f, date: e.target.value }))} required /></div>
              <div style={s.formGroup}><label style={s.label}>Distance (km)</label><input type="number" step="0.01" style={s.input} value={addForm.distanceKm} onChange={e => setAddForm(f => ({ ...f, distanceKm: e.target.value }))} required /></div>
              <div style={s.formGroup}><label style={s.label}>Pace (MM:SS)</label><input style={s.input} placeholder="5:30" value={addForm.pace} onChange={e => setAddForm(f => ({ ...f, pace: e.target.value }))} /></div>
              <div style={s.formGroup}><label style={s.label}>Duration (HH:MM:SS)</label><input style={s.input} placeholder="45:00" value={addForm.duration} onChange={e => setAddForm(f => ({ ...f, duration: e.target.value }))} /></div>
            </div>
            <div style={s.formGroup}><label style={s.label}>Notes</label><input style={s.input} value={addForm.notes} onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))} /></div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowAdd(false)} style={{ ...s.btn('#333'), padding: '8px 16px' }}>Cancel</button>
              <button type="submit" disabled={loading} style={{ ...s.btn(), padding: '8px 16px' }}>Log Run</button>
            </div>
          </form>
        </div></div>
      )}
      {deleteConfirm && (
        <div style={s.modal}><div style={s.modalBox}>
          <h3 style={{ margin: '0 0 12px 0', color: '#ef4444' }}>Delete Run?</h3>
          <p style={{ fontSize: '13px', color: '#888' }}>{deleteConfirm.user?.name} · {new Date(deleteConfirm.date).toLocaleDateString()} · {deleteConfirm.distanceKm} km</p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button onClick={() => setDeleteConfirm(null)} style={{ ...s.btn('#333'), padding: '8px 16px' }}>Cancel</button>
            <button onClick={async () => { await adminCall('deleteRun', { runId: deleteConfirm.id }); setDeleteConfirm(null); load() }} style={{ ...s.btn('#ef4444'), padding: '8px 16px' }}>Delete</button>
          </div>
        </div></div>
      )}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px', alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: '160px' }}>
          <label style={s.label}>Filter by Runner</label>
          <select style={s.select} value={filterRunner} onChange={e => setFilterRunner(e.target.value)}>
            <option value="">All runners</option>
            {runners.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <div><label style={s.label}>From</label><input type="date" style={s.input} value={filterFrom} onChange={e => setFilterFrom(e.target.value)} /></div>
        <div><label style={s.label}>To</label><input type="date" style={s.input} value={filterTo} onChange={e => setFilterTo(e.target.value)} /></div>
        <button style={s.btn()} onClick={() => setShowAdd(true)}>+ Add Run</button>
      </div>
      <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#555', marginBottom: '12px' }}>{filtered.length} runs shown</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={s.table}>
          <thead><tr>{['Date', 'Runner', 'Distance', 'Pace', 'Duration', 'HR', 'Notes', ''].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
          <tbody>
            {filtered.map((r: any) => {
              const paceMin = Math.floor(r.paceSecPerKm / 60); const paceSec = String(r.paceSecPerKm % 60).padStart(2, '0')
              const hrs = Math.floor(r.durationSec / 3600); const mins = Math.floor((r.durationSec % 3600) / 60); const secs = String(r.durationSec % 60).padStart(2, '0')
              return (
                <tr key={r.id}>
                  <td style={s.td}><span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{new Date(r.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span></td>
                  <td style={s.td}><span style={{ fontWeight: 600 }}>{r.user?.name}</span></td>
                  <td style={s.td}><span style={{ color: '#FC4C02', fontFamily: 'monospace', fontWeight: 700 }}>{r.distanceKm.toFixed(2)} km</span></td>
                  <td style={s.td}><span style={{ fontFamily: 'monospace' }}>{paceMin}:{paceSec}/km</span></td>
                  <td style={s.td}><span style={{ fontFamily: 'monospace' }}>{hrs > 0 ? `${hrs}:` : ''}{String(mins).padStart(2, '0')}:{secs}</span></td>
                  <td style={s.td}><span style={{ fontFamily: 'monospace', color: '#888' }}>{r.avgHeartRate || '—'}</span></td>
                  <td style={s.td}><span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#666', maxWidth: '120px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.notes || ''}</span></td>
                  <td style={s.td}><button style={{ ...s.btn('#3a0000'), color: '#ef4444', padding: '4px 10px' }} onClick={() => setDeleteConfirm(r)}>Delete</button></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Plan Management Tab ──────────────────────────────────────────────────────
function PlansTab() {
  const [overrides, setOverrides] = useState<any[]>([])
  const [saving, setSaving] = useState<string | null>(null)
  const [localVals, setLocalVals] = useState<Record<string, string>>({})

  const loadOverrides = () => fetch('/api/admin?action=planOverrides').then(r => r.json()).then(setOverrides)
  useEffect(() => { loadOverrides() }, [])

  const getVal = (plan: string, week: number, day: string, defaultKm: number) => {
    const key = `${plan}_${week}_${day}`
    if (localVals[key] !== undefined) return localVals[key]
    const override = overrides.find(o => o.plan === plan && o.week === week && o.day === day)
    return override ? String(override.km) : String(defaultKm)
  }

  const save = async (plan: string, week: number, day: string, km: number) => {
    const key = `${plan}_${week}_${day}`; setSaving(key)
    await fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'setPlanOverride', plan, week, day, km }) })
    await loadOverrides(); setSaving(null)
  }

  const plans: Array<{ key: string; data: any[] }> = [
    { key: '10K', data: PLAN_10K },
    { key: 'HM_INT', data: PLAN_HM_INT },
    { key: 'HM_BEG', data: PLAN_HM_BEG },
  ]

  return (
    <div>
      <p style={{ fontFamily: 'monospace', fontSize: '12px', color: '#555', marginBottom: '24px' }}>Edit weekly km targets. Changes propagate immediately to all KM Due calculations. Orange = overridden from default.</p>
      {plans.map(({ key, data }) => (
        <div key={key} style={{ ...s.section, marginBottom: '24px' }}>
          <div style={s.sectionTitle}>{PLAN_LABELS[key]}</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead><tr><th style={s.th}>Week</th><th style={s.th}>Dates</th>{['tue', 'thu', 'sat', 'sun', 'total'].map(d => <th key={d} style={s.th}>{d.toUpperCase()}</th>)}</tr></thead>
              <tbody>
                {data.map((w: any) => {
                  const wi = w.week - 1
                  return (
                    <tr key={w.week}>
                      <td style={{ ...s.td, fontFamily: 'monospace', color: '#555' }}>W{w.week}</td>
                      <td style={{ ...s.td, fontFamily: 'monospace', fontSize: '11px', color: '#555' }}>{w.label}</td>
                      {(['tue', 'thu', 'sat', 'sun'] as const).map(day => {
                        const fieldKey = `${key}_${wi}_${day}`
                        const isOverridden = overrides.some(o => o.plan === key && o.week === wi && o.day === day)
                        const val = getVal(key, wi, day, w[day])
                        return (
                          <td key={day} style={s.td}>
                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                              <input
                                type="number" step="0.5" min="0"
                                style={{ ...s.input, width: '60px', padding: '4px 8px', color: isOverridden ? '#FC4C02' : '#e8e8e8' }}
                                value={val}
                                onChange={e => setLocalVals(v => ({ ...v, [fieldKey]: e.target.value }))}
                              />
                              <button
                                style={{ ...s.btn('#333'), padding: '4px 6px', fontSize: '10px' }}
                                disabled={saving === fieldKey}
                                onClick={() => save(key, wi, day, parseFloat(val))}
                              >
                                {saving === fieldKey ? '...' : '✓'}
                              </button>
                            </div>
                          </td>
                        )
                      })}
                      <td style={{ ...s.td, fontFamily: 'monospace', fontWeight: 700, color: '#FC4C02' }}>{w.total}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Admin Notes Tab ──────────────────────────────────────────────────────────
function NotesTab() {
  const [content, setContent] = useState('')
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/admin?action=note').then(r => r.json()).then(d => setContent(d.content || ''))
  }, [])

  const save = async () => {
    setLoading(true)
    await fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'saveNote', content }) })
    setSaved(true); setLoading(false); setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={s.section}>
      <div style={s.sectionTitle}>Private Admin Notes</div>
      <p style={{ fontFamily: 'monospace', fontSize: '11px', color: '#555', marginBottom: '16px' }}>Not visible to any runner. Use for injury notes, leave reminders, etc.</p>
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        rows={14}
        style={{ ...s.input, resize: 'vertical', lineHeight: 1.7, padding: '16px' }}
        placeholder="e.g. Vikram on injury break until Jul 15&#10;Aditya travelling Jul 10-20&#10;..."
      />
      <div style={{ marginTop: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button onClick={save} disabled={loading} style={{ ...s.btn(), padding: '10px 24px' }}>
          {loading ? 'Saving...' : 'Save Notes'}
        </button>
        {saved && <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#4ade80' }}>✓ Saved</span>}
      </div>
    </div>
  )
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────
export default function AdminPage() {
  const [tab, setTab] = useState('stats')

  const logout = async () => {
    // You'd want to call a logout API if you implement true iron-session logout. 
    // For now we can just clear cookies or rely on manual session expiry.
    // As a simple client side redirect to /admin/login which will clear the scope conceptually or just stay there.
    window.location.href = '/admin/login'
  }

  const tabs = [
    { key: 'stats', label: '📊 Quick Stats' },
    { key: 'runners', label: '👥 Runners' },
    { key: 'runs', label: '🏃 Run Log' },
    { key: 'plans', label: '📋 Plans' },
    { key: 'notes', label: '📝 Notes' },
  ]

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={s.badge}>ADMIN</span>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.01em' }}>RunClub Admin Panel</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <a href="/" style={{ fontFamily: 'monospace', fontSize: '11px', color: '#555', textDecoration: 'none' }}>← Back to Site</a>
          <button onClick={logout} style={{ ...s.btn('#222'), color: '#888', padding: '6px 12px' }}>Logout</button>
        </div>
      </header>

      <nav style={s.tabs}>
        {tabs.map(t => (
          <button key={t.key} style={s.tab(tab === t.key)} onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </nav>

      <div style={s.body}>
        {tab === 'stats' && <StatsTab />}
        {tab === 'runners' && <RunnersTab />}
        {tab === 'runs' && <RunLogTab />}
        {tab === 'plans' && <PlansTab />}
        {tab === 'notes' && <NotesTab />}
      </div>
    </div>
  )
}
