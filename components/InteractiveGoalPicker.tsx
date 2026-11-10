"use client"

import React, { useState } from 'react'
import MicroGoalsWidget from './MicroGoalsWidget'

export interface GoalCategory {
  id: string
  title: string
  tagline: string
  description: string
  icon: string
  accentColor: string
  sampleKm: number
}

const CATEGORIES: GoalCategory[] = [
  {
    id: 'consistency',
    title: 'Build Consistency',
    tagline: 'Run 3 days a week',
    description: 'Perfect for building a lifelong habit. No pace pressure, no distance stress.',
    icon: '🌱',
    accentColor: '#16A34A',
    sampleKm: 10
  },
  {
    id: 'distance',
    title: 'Distance Builder',
    tagline: 'Step up to 15–20 km / wk',
    description: 'Safely increase your weekly volume with progressive +10% increments.',
    icon: '📈',
    accentColor: '#0284C7',
    sampleKm: 18
  },
  {
    id: 'speed',
    title: 'Speed & Fitness',
    tagline: 'Sharpen your 5K/10K best',
    description: 'Add strides and tempo runs while keeping 80% of your mileage easy and relaxed.',
    icon: '⚡',
    accentColor: '#FC4C02',
    sampleKm: 28
  },
  {
    id: 'race',
    title: 'Race Prep (Any Event)',
    tagline: '5K · 10K · Half · Marathon',
    description: 'Personalized pacing, taper weeks, and periodized workouts for your chosen race date.',
    icon: '🏁',
    accentColor: '#8B5CF6',
    sampleKm: 35
  },
  {
    id: 'fun',
    title: 'Running for Pure Fun',
    tagline: 'No goals, just enjoy the miles',
    description: 'Celebrate fresh air, clear your mind, explore scenic routes, and collect high-fives.',
    icon: '😊',
    accentColor: '#F59E0B',
    sampleKm: 12
  }
]

export default function InteractiveGoalPicker() {
  const [selectedId, setSelectedId] = useState<string>('consistency')

  const selectedCategory = CATEGORIES.find(c => c.id === selectedId) || CATEGORIES[0]

  return (
    <div style={{ marginTop: '20px' }}>
      {/* Category Selection Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '14px',
        marginBottom: '28px'
      }}>
        {CATEGORIES.map(cat => {
          const isSelected = selectedId === cat.id
          return (
            <div
              key={cat.id}
              onClick={() => setSelectedId(cat.id)}
              style={{
                background: isSelected ? '#FFFFFF' : '#F8FAFC',
                border: `2px solid ${isSelected ? cat.accentColor : '#E2E8F0'}`,
                borderRadius: '16px',
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isSelected ? '0 8px 24px rgba(0,0,0,0.06)' : 'none',
                transform: isSelected ? 'translateY(-2px)' : 'none',
                position: 'relative'
              }}
            >
              <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>{cat.icon}</div>
              <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: '0 0 4px 0' }}>
                {cat.title}
              </h4>
              <div style={{
                fontSize: '12px',
                fontWeight: 700,
                color: cat.accentColor,
                fontFamily: 'monospace',
                marginBottom: '8px'
              }}>
                {cat.tagline}
              </div>
              <p style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.4, margin: 0 }}>
                {cat.description}
              </p>
            </div>
          )
        })}
      </div>

      {/* Dynamic Micro-Goals Preview Card */}
      <div style={{ marginBottom: '24px' }}>
        <MicroGoalsWidget
          selectedCategory={selectedId}
          runs={[
            { distanceKm: selectedCategory.sampleKm / 3, durationSec: 1800, paceSecPerKm: 360, date: new Date() }
          ]}
        />
      </div>

      {/* 1-Click Strava CTA for this goal */}
      <div style={{
        background: 'linear-gradient(135deg, #FFF7ED 0%, #FEF3C7 100%)',
        border: '1.5px solid #FDBA74',
        borderRadius: '16px',
        padding: '24px 28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 700, color: '#C2410C', textTransform: 'uppercase' }}>
            Ready to track your &ldquo;{selectedCategory.title}&rdquo; journey?
          </div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#9A3412', marginTop: '2px' }}>
            Connect Strava to automatically sync your runs and track these micro-goals.
          </div>
        </div>

        <a
          href="/api/strava"
          style={{
            background: '#FC4C02',
            color: '#FFFFFF',
            textDecoration: 'none',
            padding: '14px 28px',
            borderRadius: '12px',
            fontWeight: 800,
            fontSize: '14px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 6px 20px rgba(252,76,2,0.3)',
            transition: 'transform 0.15s'
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          <span>Connect Strava to Track This</span>
          <span>→</span>
        </a>
      </div>
    </div>
  )
}
