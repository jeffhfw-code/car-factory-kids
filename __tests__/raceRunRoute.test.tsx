import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import RaceRunRoute from '../src/routes/RaceRunRoute';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/race/run/:trackId" element={<RaceRunRoute />} />
      </Routes>
    </MemoryRouter>,
  );
}

let rafCallbacks: FrameRequestCallback[] = [];
let rafId = 0;
let nowMs = 0;

beforeEach(() => {
  rafCallbacks = [];
  rafId = 0;
  nowMs = 0;
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    rafCallbacks.push(cb);
    return ++rafId;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

function pumpTicks(count: number, dtMs = 50) {
  act(() => {
    for (let i = 0; i < count; i++) {
      const callbacks = rafCallbacks;
      rafCallbacks = [];
      nowMs += dtMs;
      callbacks.forEach((cb) => cb(nowMs));
    }
  });
}

describe('RaceRunRoute', () => {
  it('mounts the playable race for the oval test track without crashing', () => {
    renderAt('/race/run/oval-test-track');
    expect(screen.getByText('Oval Test Track')).toBeTruthy();
    expect(screen.getByText('Speed Tester')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'GAS' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'BRAKE' })).toBeTruthy();
  });

  it('shows a not-found screen for an unknown track', () => {
    renderAt('/race/run/does-not-exist');
    expect(screen.getByText('Track not found')).toBeTruthy();
  });

  it('holding GAS via pointerdown advances the speed and progress', () => {
    renderAt('/race/run/oval-test-track');
    const gas = screen.getByRole('button', { name: 'GAS' });

    fireEvent.pointerDown(gas, { pointerId: 1 });
    pumpTicks(40, 50); // 2 seconds of game time
    expect(gas.getAttribute('aria-pressed')).toBe('true');

    const speedEl = screen.getByText('Speed').nextSibling as HTMLElement;
    const progressEl = screen.getByText('Progress').nextSibling as HTMLElement;
    expect(parseFloat(speedEl.textContent ?? '0')).toBeGreaterThan(10);
    expect(parseFloat(progressEl.textContent ?? '0')).toBeGreaterThan(0);

    fireEvent.pointerUp(gas, { pointerId: 1 });
    expect(gas.getAttribute('aria-pressed')).toBe('false');
  });

  it('release on document pointerup still works (iOS-style off-button release)', () => {
    renderAt('/race/run/oval-test-track');
    const gas = screen.getByRole('button', { name: 'GAS' });

    fireEvent.pointerDown(gas, { pointerId: 7 });
    expect(gas.getAttribute('aria-pressed')).toBe('true');

    // Pointerup that lands on document, not on the button (e.g., iOS gesture
    // or finger lifted off-button). The safety-net listener must still
    // release the press. jsdom doesn't construct PointerEvent, so build a
    // plain Event with the pointerId field the handler reads.
    act(() => {
      const ev = new Event('pointerup', { bubbles: true });
      Object.assign(ev, { pointerId: 7 });
      document.dispatchEvent(ev);
    });
    expect(gas.getAttribute('aria-pressed')).toBe('false');
  });

  it('holding BRAKE after building speed reduces the speed', () => {
    renderAt('/race/run/oval-test-track');
    const gas = screen.getByRole('button', { name: 'GAS' });
    const brake = screen.getByRole('button', { name: 'BRAKE' });

    fireEvent.pointerDown(gas, { pointerId: 1 });
    pumpTicks(40, 50);
    fireEvent.pointerUp(gas, { pointerId: 1 });

    const speedEl = screen.getByText('Speed').nextSibling as HTMLElement;
    const before = parseFloat(speedEl.textContent ?? '0');
    expect(before).toBeGreaterThan(20);

    fireEvent.pointerDown(brake, { pointerId: 2 });
    pumpTicks(20, 50);
    fireEvent.pointerUp(brake, { pointerId: 2 });

    const after = parseFloat(speedEl.textContent ?? '0');
    expect(after).toBeLessThan(before);
  });

  it('race finishes at 100% and the Restart Race button resets state', () => {
    renderAt('/race/run/oval-test-track');
    const gas = screen.getByRole('button', { name: 'GAS' });

    fireEvent.pointerDown(gas, { pointerId: 1 });
    // Long enough to reach 800m for the Speed Tester (~18s of game time).
    pumpTicks(600, 50);

    expect(screen.getByText('Race finished!')).toBeTruthy();
    const progressEl = screen.getByText('Progress').nextSibling as HTMLElement;
    expect(progressEl.textContent).toBe('100%');

    const restart = screen.getByRole('button', { name: /Restart Race/ });
    fireEvent.click(restart);

    // After restart, GAS/BRAKE return and the readouts reset.
    expect(screen.queryByText('Race finished!')).toBeNull();
    expect(screen.getByRole('button', { name: 'GAS' })).toBeTruthy();
    const speedEl = screen.getByText('Speed').nextSibling as HTMLElement;
    const progressEl2 = screen.getByText('Progress').nextSibling as HTMLElement;
    expect(speedEl.textContent).toBe('0 mph');
    expect(progressEl2.textContent).toBe('0%');
  });
});
