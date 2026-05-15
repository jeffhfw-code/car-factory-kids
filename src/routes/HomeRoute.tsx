import { Link } from 'react-router-dom';

const tiles: Array<{ to: string; label: string; emoji: string; color: string }> = [
  { to: '/factory/1', label: 'Start New Build', emoji: '🔧', color: '#3FA9F5' },
  { to: '/garage', label: 'Garage', emoji: '🚗', color: '#FFC93C' },
  { to: '/notebook', label: 'Notebook', emoji: '📓', color: '#7BC950' },
  { to: '/settings', label: 'Settings', emoji: '⚙️', color: '#FF6B6B' },
];

export default function HomeRoute() {
  return (
    <main
      style={{
        minHeight: '100%',
        padding: 'var(--space-xl)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-xl)',
      }}
    >
      <header style={{ textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: 56, fontWeight: 900 }}>Car Factory Kids</h1>
        <p style={{ margin: '8px 0 0', color: 'var(--color-ink-soft)', fontSize: 20 }}>
          Build it. Measure it. Race it.
        </p>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-lg)',
          flex: 1,
          alignContent: 'center',
        }}
      >
        {tiles.map((tile) => (
          <Link
            key={tile.to}
            to={tile.to}
            style={{
              background: tile.color,
              color: 'white',
              borderRadius: 'var(--radius-lg)',
              minHeight: 160,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-sm)',
              boxShadow: '0 6px 0 rgba(0,0,0,0.12)',
              padding: 'var(--space-lg)',
              fontSize: 24,
            }}
          >
            <span style={{ fontSize: 56 }} aria-hidden>
              {tile.emoji}
            </span>
            <span>{tile.label}</span>
          </Link>
        ))}
      </div>

      <footer
        style={{
          textAlign: 'center',
          color: 'var(--color-ink-soft)',
          fontSize: 14,
        }}
      >
        Phase 1 shell • No data is collected • Works offline
      </footer>
    </main>
  );
}
