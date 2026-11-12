export default function GarminSetupPage() {
  return (
    <main className="section" style={{ maxWidth: 900 }}>
      <a href="/" style={{ color: 'var(--muted)' }}>← Back to RunClub</a>
      <p className="section-tag" style={{ marginTop: 32 }}>GARMIN · READ ONLY</p>
      <h1 className="section-title">Connect Garmin recovery</h1>
      <p className="section-sub">Your Garmin password and Garmin login token stay on your computer. The local script only reads Garmin data. To display recovery in RunClub, sign in as the owner of the dashboard, create a one-time token, and explicitly upload over HTTPS.</p>
      <div style={{ display: 'grid', gap: 20 }}>
        <section className="stat-box"><strong>1. Install the local reader</strong><pre style={{ marginTop: 12, overflowX: 'auto' }}><code>cd garmin-sync
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt</code></pre><p style={{ color: 'var(--muted)', marginTop: 10 }}>Requires Python 3.12 or newer.</p></section>
        <section className="stat-box"><strong>2. Log in to Garmin on this computer</strong><pre style={{ marginTop: 12, overflowX: 'auto' }}><code>.venv/bin/python sync_garmin.py --login</code></pre><p style={{ color: 'var(--muted)', marginTop: 10 }}>Enter your email, password, and any 2FA code only in the terminal prompts. Password and login token are never sent to RunClub.</p></section>
        <section className="stat-box"><strong>3. Inspect a three-day read locally</strong><pre style={{ marginTop: 12, overflowX: 'auto' }}><code>.venv/bin/python sync_garmin.py --days 3 --dry-run</code></pre><p style={{ color: 'var(--muted)', marginTop: 10 }}>To save private Markdown and JSON files without uploading, use <code>--sink files</code>.</p></section>
        <section className="stat-box"><strong>4. Upload to your RunClub account (optional)</strong><p style={{ color: 'var(--muted)', marginTop: 10 }}>From the matching personal dashboard, click Connect Garmin and copy the one-time RunClub token. Then run:</p><pre style={{ marginTop: 12, overflowX: 'auto' }}><code>.venv/bin/python sync_garmin.py --days 30 --sink runclub</code></pre><p style={{ color: 'var(--muted)', marginTop: 10 }}>The token is requested in a hidden prompt and stored in a private local file. RunClub stores only its hash. The default destination is the deployed HTTPS endpoint; localhost destinations are rejected.</p></section>
      </div>
    </main>
  )
}
