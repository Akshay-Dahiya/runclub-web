import React from 'react'

export default function Hero() {
  return (
    <>
      <div className="hero">
        <div className="hero-bg"></div>
        <div className="hero-lines">
          <svg viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice">
            <ellipse cx="900" cy="350" rx="560" ry="270" fill="none" stroke="white" strokeWidth="1"/>
            <ellipse cx="900" cy="350" rx="460" ry="200" fill="none" stroke="white" strokeWidth="1"/>
            <ellipse cx="900" cy="350" rx="360" ry="130" fill="none" stroke="white" strokeWidth="1"/>
            <line x1="0" y1="350" x2="1200" y2="350" stroke="white" strokeWidth=".5"/>
          </svg>
        </div>
        <div className="hero-eyebrow">▶ Delhi RunClub · Race Day Aug 23, 2026</div>
        <h1 className="hero-title">
          <span style={{ color: 'var(--text)' }}>RUN</span><br/>
          <span className="outline">FASTER</span><br/>
          <span style={{ color: 'var(--text)' }}>TOGETHER</span>
        </h1>
        <p className="hero-sub">
          12 runners. 5 on the Half Marathon. 7 on the 10K. 10 weeks. One finish line. 
          Track every km, hold each other accountable, and cross it on August 23rd.
        </p>
        <div className="hero-ctas">
          <a href="#log" className="btn-primary">Log Today's Run →</a>
          <a href="#members" className="btn-ghost">View The Crew</a>
        </div>
      </div>

      {/* COUNTDOWN */}
      <div className="countdown-strip">
        <span className="countdown-label">⏱ Race Day Countdown</span>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <div className="cd-unit"><span className="cd-num" id="cd-d">00</span><span className="cd-lbl">Days</span></div>
          <div className="cd-sep">:</div>
          <div className="cd-unit"><span className="cd-num" id="cd-h">00</span><span className="cd-lbl">Hours</span></div>
          <div className="cd-sep">:</div>
          <div className="cd-unit"><span className="cd-num" id="cd-m">00</span><span className="cd-lbl">Mins</span></div>
          <div className="cd-sep">:</div>
          <div className="cd-unit"><span className="cd-num" id="cd-s">00</span><span className="cd-lbl">Secs</span></div>
        </div>
      </div>
    </>
  )
}
