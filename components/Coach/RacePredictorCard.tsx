"use client"

import React, { useState } from 'react'
import { PredictionSet, fmtTime, fmtPace } from '../../lib/race-predictor'

interface RacePredictorCardProps {
  predictionSet: PredictionSet
}

export default function RacePredictorCard({ predictionSet }: RacePredictorCardProps) {
  const [selectedRace, setSelectedRace] = useState<string>('10K')

  const currentPred = predictionSet.predictions[selectedRace] || Object.values(predictionSet.predictions)[0]

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '16px',
      padding: '28px',
      marginBottom: '32px'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div>
          <span style={{ fontFamily: 'monospace', fontSize: '10px', color: 'var(--accent)', letterSpacing: '2px', textTransform: 'uppercase' }}>
            // Module 1 · Race Prediction Engine
          </span>
          <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.6rem', letterSpacing: '1px', margin: '4px 0 0 0' }}>
            Predicted Race Performances
          </h3>
          <p style={{ color: 'var(--muted)', fontSize: '12px', margin: '4px 0 0 0' }}>
            Calculated via Pete Riegel formula with cross-distance aerobic endurance adjustments.
          </p>
        </div>

        <div style={{
          fontFamily: 'monospace',
          fontSize: '10px',
          color: 'var(--muted)',
          background: 'var(--bg)',
          padding: '6px 12px',
          borderRadius: '6px',
          border: '1px solid var(--border)'
        }}>
          Anchor: <strong style={{ color: 'var(--text)' }}>{predictionSet.bestSourceLabel}</strong>
        </div>
      </div>

      {/* Distance Selector Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {Object.keys(predictionSet.predictions).map(race => {
          const pred = predictionSet.predictions[race]
          const isSelected = selectedRace === race
          return (
            <button
              key={race}
              onClick={() => setSelectedRace(race)}
              style={{
                flex: 1,
                minWidth: '100px',
                padding: '14px',
                borderRadius: '8px',
                border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                background: isSelected ? 'rgba(252,76,2,0.12)' : 'var(--bg)',
                color: isSelected ? 'var(--accent)' : 'var(--text)',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.3rem', lineHeight: 1 }}>{race}</div>
              <div style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, margin: '4px 0 2px 0' }}>
                {fmtTime(pred.predictedSec)}
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: 'var(--muted)' }}>
                {fmtPace(pred.paceSecPerKm)}
              </div>
            </button>
          )
        })}
      </div>

      {/* Selected Prediction Detail Card */}
      {currentPred && (
        <div style={{
          background: 'var(--bg)',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid var(--border)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', color: 'var(--muted)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              PREDICTED {currentPred.raceName} FINISH
            </div>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '3.2rem',
              color: 'var(--accent)',
              lineHeight: 1,
              margin: '6px 0'
            }}>
              {fmtTime(currentPred.predictedSec)}
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--muted)' }}>
              Target race pace: <strong style={{ color: 'var(--text)' }}>{fmtPace(currentPred.paceSecPerKm)}</strong>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: currentPred.confidence === 'high' ? '#4ade80' : currentPred.confidence === 'medium' ? '#facc15' : '#fb923c'
              }} />
              <span style={{
                fontFamily: 'monospace',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: currentPred.confidence === 'high' ? '#4ade80' : currentPred.confidence === 'medium' ? '#facc15' : '#fb923c'
              }}>
                {currentPred.confidence} Confidence
              </span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--muted)', lineHeight: 1.5, margin: 0 }}>
              {currentPred.confidenceTip}
            </p>
            <div style={{ marginTop: '12px', fontFamily: 'monospace', fontSize: '10px', color: 'var(--muted)' }}>
              Source: {currentPred.sourceLabel}
            </div>
          </div>
        </div>
      )}

      {/* Riegel Formula Explanation */}
      <div style={{
        marginTop: '16px',
        paddingTop: '16px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px',
        fontFamily: 'monospace',
        fontSize: '10px',
        color: 'var(--muted)'
      }}>
        <span>Formula: T₂ = T₁ × (D₂ / D₁)^1.06 (Riegel)</span>
        <span>Includes aerobic fatigue factor for large distance leaps</span>
      </div>
    </div>
  )
}
