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

function readStat(label: string): string {
  const el = screen.getByText(label).nextSibling as HTMLElement;
  return el.textContent ?? '';
}

function progressPct(): number {
  return parseFloat(readStat('Progress'));
}

function speedMph(): number {
  return parseFloat(readStat('Speed'));
}

describe('RaceRunRoute', () => {
  it('mounts the playable race for the oval test track without crashing', () => {
    renderAt('/race/run/oval-test-track');
    expect(screen.getByText('Oval Test Track')).toBeTruthy();
    expect(screen.getByText('Speed Tester')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'GAS' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'BRAKE' })).toBeTruthy();
  });

  it('starts with speed 0 and progress 0%, marker on the left', () => {
    renderAt('/race/run/oval-test-track');
    expect(speedMph()).toBe(0);
    expect(progressPct()).toBe(0);
    const marker = screen.getByTestId('race-car-marker') as HTMLElement;
    expect(marker.style.left).toBe('0%');
  });

  it('shows a not-found screen for an unknown track', () => {
    renderAt('/race/run/does-not-exist');
    expect(screen.getByText('Track not found')).toBeTruthy();
  });

  it('holding GAS via mousedown increases displayed speed and progress', () => {
    renderAt('/race/run/oval-test-track');
    const gas = screen.getByRole('button', { name: 'GAS' });

    fireEvent.mouseDown(gas, { button: 0 });
    pumpTicks(40, 50); // 2 seconds of game time
    expect(gas.getAttribute('aria-pressed')).toBe('true');

    expect(speedMph()).toBeGreaterThan(10);
    expect(progressPct()).toBeGreaterThan(0);

    fireEvent.mouseUp(window);
    expect(gas.getAttribute('aria-pressed')).toBe('false');
  });

  it('holding BRAKE never reverses the displayed progress', () => {
    renderAt('/race/run/oval-test-track');
    const gas = screen.getByRole('button', { name: 'GAS' });
    const brake = screen.getByRole('button', { name: 'BRAKE' });

    // Warm up some forward motion.
    fireEvent.mouseDown(gas, { button: 0 });
    pumpTicks(40, 50);
    fireEvent.mouseUp(window);

    const progressAfterGas = progressPct();
    expect(progressAfterGas).toBeGreaterThan(0);

    // Hold BRAKE for a long time. Progress should plateau (forward momentum
    // bleeds out) but it must NEVER go down.
    fireEvent.mouseDown(brake, { button: 0 });
    let prev = progressAfterGas;
    for (let i = 0; i < 20; i++) {
      pumpTicks(20, 50); // 1s chunks
      const cur = progressPct();
      expect(cur).toBeGreaterThanOrEqual(prev);
      prev = cur;
    }
    fireEvent.mouseUp(window);

    // And speed must have hit zero.
    expect(speedMph()).toBe(0);
  });

  it('BRAKE at zero speed cannot push progress backward', () => {
    renderAt('/race/run/oval-test-track');
    const brake = screen.getByRole('button', { name: 'BRAKE' });
    expect(progressPct()).toBe(0);
    fireEvent.mouseDown(brake, { button: 0 });
    pumpTicks(100, 50); // 5s of full braking from a standstill
    fireEvent.mouseUp(window);
    expect(speedMph()).toBe(0);
    expect(progressPct()).toBe(0);
    const marker = screen.getByTestId('race-car-marker') as HTMLElement;
    expect(marker.style.left).toBe('0%');
  });

  it('document-level mouseup safety net releases the press', () => {
    // Repro for "press stays stuck when finger lifts off-button": even if the
    // release event lands somewhere other than the button, the press must end.
    renderAt('/race/run/oval-test-track');
    const gas = screen.getByRole('button', { name: 'GAS' });
    fireEvent.mouseDown(gas, { button: 0 });
    expect(gas.getAttribute('aria-pressed')).toBe('true');
    fireEvent.mouseUp(document.body);
    expect(gas.getAttribute('aria-pressed')).toBe('false');
  });

  it('holding BRAKE after building speed reduces the speed', () => {
    renderAt('/race/run/oval-test-track');
    const gas = screen.getByRole('button', { name: 'GAS' });
    const brake = screen.getByRole('button', { name: 'BRAKE' });

    fireEvent.mouseDown(gas, { button: 0 });
    pumpTicks(40, 50);
    fireEvent.mouseUp(window);
    const before = speedMph();
    expect(before).toBeGreaterThan(20);

    fireEvent.mouseDown(brake, { button: 0 });
    pumpTicks(20, 50);
    fireEvent.mouseUp(window);
    expect(speedMph()).toBeLessThan(before);
  });

  it('race finishes at 100% and Restart Race resets everything', () => {
    renderAt('/race/run/oval-test-track');
    const gas = screen.getByRole('button', { name: 'GAS' });

    fireEvent.mouseDown(gas, { button: 0 });
    // Enough ticks for Speed Tester to cover 800m.
    pumpTicks(600, 50);

    expect(screen.getByText('Race finished!')).toBeTruthy();
    expect(progressPct()).toBe(100);

    const restart = screen.getByRole('button', { name: /Restart Race/ });
    fireEvent.click(restart);

    expect(screen.queryByText('Race finished!')).toBeNull();
    expect(screen.getByRole('button', { name: 'GAS' })).toBeTruthy();
    expect(speedMph()).toBe(0);
    expect(progressPct()).toBe(0);
    expect(readStat('Time')).toBe('0.00s');
    const marker = screen.getByTestId('race-car-marker') as HTMLElement;
    expect(marker.style.left).toBe('0%');
  });
});
