import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getTrack } from '../data/tracks';
import { SAMPLE_BUILDS_BY_ID } from '../data/sampleBuilds';
import { calculateStats } from '../logic/statCalculator';
import {
  createInitialCarState,
  getRacePosition,
  isRaceFinished,
  updateCarState,
} from '../race/engine/RaceEngine';
import type { CarState, RaceInput } from '../race/engine/CarState';
import { topSpeedFromStats } from '../race/engine/TrackMath';

const DEFAULT_BUILD_ID = 'sample_speed_tester';

export default function RaceRunRoute() {
  const { trackId } = useParams();
  const track = trackId ? getTrack(trackId) : undefined;
  const build = SAMPLE_BUILDS_BY_ID[DEFAULT_BUILD_ID];

  const stats = useMemo(
    () => (build ? calculateStats(build.parts).stats : null),
    [build],
  );
  const top = useMemo(() => (stats ? topSpeedFromStats(stats) : 0), [stats]);
  const [carState, setCarState] = useState<CarState | null>(() =>
    build && stats ? createInitialCarState(build, stats) : null,
  );

  const inputRef = useRef<RaceInput>({ gasHeld: false, brakeHeld: false });
  const lastTickRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const restart = useCallback(() => {
    if (!build || !stats) return;
    inputRef.current = { gasHeld: false, brakeHeld: false };
    lastTickRef.current = null;
    setCarState(createInitialCarState(build, stats));
  }, [build, stats]);

  useEffect(() => {
    if (!stats || !track) return;
    const tick = (now: number) => {
      const last = lastTickRef.current ?? now;
      const dt = Math.min(0.1, (now - last) / 1000);
      lastTickRef.current = now;
      setCarState((prev) =>
        prev ? updateCarState(prev, stats, track, inputRef.current, dt) : prev,
      );
      rafRef.current = window.requestAnimationFrame(tick);
    };
    rafRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTickRef.current = null;
    };
  }, [stats, track]);

  if (!track) {
    return (
      <main style={pageStyle}>
        <Link to="/" style={backLinkStyle}>← Home</Link>
        <h1 style={{ margin: 0 }}>Track not found</h1>
        <p>No track exists with id "{trackId}".</p>
      </main>
    );
  }
  if (!build || !stats || !carState) {
    return (
      <main style={pageStyle}>
        <Link to="/" style={backLinkStyle}>← Home</Link>
        <h1 style={{ margin: 0 }}>Build not found</h1>
        <p>No sample build exists with id "{DEFAULT_BUILD_ID}".</p>
      </main>
    );
  }

  const setGas = (held: boolean) => {
    inputRef.current = { ...inputRef.current, gasHeld: held };
  };
  const setBrake = (held: boolean) => {
    inputRef.current = { ...inputRef.current, brakeHeld: held };
  };

  const finished = isRaceFinished(carState, track);
  const progress = getRacePosition(carState, track);
  const elapsedDisplay = (
    finished ? carState.finishTimeSeconds : carState.elapsedSeconds
  ).toFixed(2);

  return (
    <main style={pageStyle}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/race/select" style={backLinkStyle}>← Pick a Race</Link>
        <h1 style={{ margin: 0, fontSize: 28 }}>{track.name}</h1>
      </header>

      <section style={statsBarStyle}>
        <Stat label="Car" value={build.name} />
        <Stat label="Speed" value={`${Math.round(carState.speedMph)} mph`} />
        <Stat label="Top" value={`${Math.round(top)} mph`} />
        <Stat label="Progress" value={`${Math.round(progress * 100)}%`} />
        <Stat label="Time" value={`${elapsedDisplay}s`} />
        <Stat
          label="Status"
          value={finished ? 'FINISHED' : 'racing'}
          tone={finished ? 'success' : 'default'}
        />
      </section>

      <section style={raceLaneStyle} aria-label="Race progress">
        {/*
          The car visual is a non-directional colored disc. We deliberately
          do NOT use the 🏎️ emoji here: on every major platform that emoji
          renders facing left, which made the car appear to drive in reverse
          as the disc slid left-to-right with progress. A circle has no
          inherent orientation.
        */}
        <div
          data-testid="race-car-marker"
          style={{
            position: 'absolute',
            left: `${progress * 100}%`,
            top: '50%',
            width: 48,
            height: 48,
            marginLeft: -24,
            marginTop: -24,
            borderRadius: '50%',
            background: '#3FA9F5',
            boxShadow: '0 4px 0 rgba(0,0,0,0.18), inset 0 -6px 0 rgba(0,0,0,0.12)',
            transition: 'left 80ms linear',
          }}
          aria-hidden
        />
        <div style={finishMarkerStyle} aria-hidden>🏁</div>
      </section>

      {finished ? (
        <section style={finishCardStyle}>
          <h2 style={{ margin: 0, fontSize: 36 }}>Race finished!</h2>
          <p style={{ margin: '8px 0 0', fontSize: 22 }}>
            {build.name} crossed the line in{' '}
            <strong>{carState.finishTimeSeconds.toFixed(2)}s</strong>
          </p>
          <button
            type="button"
            onClick={restart}
            style={restartButtonStyle}
          >
            🔄 Restart Race
          </button>
        </section>
      ) : (
        <section style={controlsRowStyle}>
          <HoldButton label="BRAKE" color="#FF6B6B" onChange={setBrake} />
          <HoldButton label="GAS" color="#7BC950" onChange={setGas} />
        </section>
      )}
    </main>
  );
}

function Stat({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'success' | 'danger';
}) {
  const color =
    tone === 'success'
      ? 'var(--color-success)'
      : tone === 'danger'
        ? 'var(--color-danger)'
        : 'var(--color-ink)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 80 }}>
      <span style={{ fontSize: 12, color: 'var(--color-ink-soft)', textTransform: 'uppercase' }}>
        {label}
      </span>
      <span style={{ fontSize: 20, fontWeight: 800, color }}>{value}</span>
    </div>
  );
}

/**
 * Hold-to-press button hardened for real iOS Safari.
 *
 * We attach NATIVE event listeners (not React synthetic events) for one
 * reason: React adds touch listeners as passive by default, which makes
 * `e.preventDefault()` inside onTouchStart a no-op. Without preventDefault
 * iOS Safari can:
 *   - dispatch a synthesized mousedown ~300ms later (double-fires the press)
 *   - treat a held finger as a "tap" that ends with a synthesized mouseup
 *   - fire `pointercancel` on tiny finger movement, which would kill the press
 *
 * The native listener is registered with `{ passive: false }` so we can
 * actually preventDefault. We also stick to touch + mouse events and avoid
 * pointer events entirely: touchstart/touchend on iOS are far more reliable
 * for a tap-and-hold control than pointer events.
 *
 * A document-level mouseup/touchend listener acts as a safety net so the
 * press always releases — even if the user lifts off-button, the system
 * grabs focus, or iOS routes the up event elsewhere.
 */
function HoldButton({
  label,
  color,
  onChange,
}: {
  label: string;
  color: string;
  onChange: (held: boolean) => void;
}) {
  const [pressed, setPressed] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const btn = buttonRef.current;
    if (!btn) return;

    let active = false;
    let touchActive = false;

    const press = () => {
      if (active) return;
      active = true;
      setPressed(true);
      onChangeRef.current(true);
    };
    const release = () => {
      if (!active) return;
      active = false;
      touchActive = false;
      setPressed(false);
      onChangeRef.current(false);
    };

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault(); // block iOS mouse synthesis + 300ms tap delay
      touchActive = true;
      press();
    };
    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      release();
    };
    const onTouchCancel = () => release();

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      // If a touch is already active, ignore the synthesized mouse event so
      // we don't trip an extra press.
      if (touchActive) return;
      press();
    };
    const onWindowMouseUp = () => release();
    const onWindowTouchEnd = (e: TouchEvent) => {
      // Document-level safety net: covers off-button releases.
      // We do NOT preventDefault here because the touch may belong to a
      // different element entirely.
      if (active && e.touches.length === 0) release();
    };
    const onBlur = () => release();

    btn.addEventListener('touchstart', onTouchStart, { passive: false });
    btn.addEventListener('touchend', onTouchEnd, { passive: false });
    btn.addEventListener('touchcancel', onTouchCancel);
    btn.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onWindowMouseUp);
    window.addEventListener('touchend', onWindowTouchEnd);
    window.addEventListener('touchcancel', onTouchCancel);
    window.addEventListener('blur', onBlur);

    return () => {
      release();
      btn.removeEventListener('touchstart', onTouchStart);
      btn.removeEventListener('touchend', onTouchEnd);
      btn.removeEventListener('touchcancel', onTouchCancel);
      btn.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onWindowMouseUp);
      window.removeEventListener('touchend', onWindowTouchEnd);
      window.removeEventListener('touchcancel', onTouchCancel);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  return (
    <button
      ref={buttonRef}
      type="button"
      onContextMenu={(e) => e.preventDefault()}
      aria-pressed={pressed}
      aria-label={label}
      style={{
        flex: 1,
        minHeight: 160,
        background: color,
        color: 'white',
        border: 'none',
        borderRadius: 'var(--radius-lg)',
        fontSize: 32,
        fontWeight: 900,
        boxShadow: pressed
          ? '0 2px 0 rgba(0,0,0,0.2)'
          : '0 8px 0 rgba(0,0,0,0.15)',
        transform: pressed ? 'translateY(4px)' : 'none',
        transition: 'transform 60ms, box-shadow 60ms',
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {label}
    </button>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: '100%',
  padding: 'var(--space-lg)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-lg)',
};

const backLinkStyle: React.CSSProperties = {
  alignSelf: 'flex-start',
  background: 'var(--color-surface)',
  color: 'var(--color-ink)',
  padding: 'var(--space-sm) var(--space-md)',
  borderRadius: 'var(--radius-pill)',
  boxShadow: '0 2px 0 rgba(0,0,0,0.08)',
};

const statsBarStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'var(--space-lg)',
  background: 'var(--color-surface)',
  padding: 'var(--space-md) var(--space-lg)',
  borderRadius: 'var(--radius-md)',
  boxShadow: '0 2px 0 rgba(0,0,0,0.06)',
};

const raceLaneStyle: React.CSSProperties = {
  position: 'relative',
  height: 120,
  background: 'linear-gradient(to bottom, #cfe9ff, #f4f1ed)',
  borderRadius: 'var(--radius-lg)',
  border: '4px dashed var(--color-ink-soft)',
  overflow: 'hidden',
};

const finishMarkerStyle: React.CSSProperties = {
  position: 'absolute',
  right: 8,
  top: '50%',
  transform: 'translateY(-50%)',
  fontSize: 40,
};

const finishCardStyle: React.CSSProperties = {
  background: 'var(--color-surface)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--space-xl)',
  textAlign: 'center',
  boxShadow: '0 4px 0 rgba(0,0,0,0.06)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 'var(--space-md)',
};

const restartButtonStyle: React.CSSProperties = {
  background: 'var(--color-primary)',
  color: 'white',
  border: 'none',
  borderRadius: 'var(--radius-pill)',
  padding: '16px 32px',
  fontSize: 22,
  fontWeight: 900,
  boxShadow: '0 4px 0 rgba(0,0,0,0.15)',
};

const controlsRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--space-lg)',
  marginTop: 'auto',
};
