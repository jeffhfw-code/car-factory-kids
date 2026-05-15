import { Link } from 'react-router-dom';
import { ScreenContainer } from '../ui/ScreenContainer';
import { OVAL_TEST_TRACK } from '../data/tracks';

export default function RaceSelectRoute() {
  return (
    <ScreenContainer
      title="Pick a Race"
      subtitle="Phase 2B: a single test race using the Speed Tester sample build."
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-md)',
          alignItems: 'flex-start',
        }}
      >
        <Link
          to={`/race/run/${OVAL_TEST_TRACK.id}`}
          style={{
            background: 'var(--color-primary)',
            color: 'white',
            padding: '20px 32px',
            borderRadius: 'var(--radius-lg)',
            fontSize: 26,
            fontWeight: 900,
            boxShadow: '0 6px 0 rgba(0,0,0,0.12)',
          }}
        >
          🏁 Start Test Race
        </Link>
        <p style={{ color: 'var(--color-ink-soft)', fontSize: 16, margin: 0 }}>
          Track: {OVAL_TEST_TRACK.name} • {OVAL_TEST_TRACK.lengthMeters}m •{' '}
          {OVAL_TEST_TRACK.surface}
        </p>
        <p style={{ color: 'var(--color-ink-soft)', fontSize: 14, margin: 0 }}>
          Full car selection, track selection, and AI opponents arrive in a
          later phase.
        </p>
      </div>
    </ScreenContainer>
  );
}
