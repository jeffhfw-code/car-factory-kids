import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore, BUILD_SLOT_COUNT, SAVE_VERSION } from '../src/state/gameStore';

describe('gameStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useGameStore.getState().resetProgress();
  });

  it('starts with the expected save schema', () => {
    const state = useGameStore.getState();
    expect(state.version).toBe(SAVE_VERSION);
    expect(state.builds).toHaveLength(BUILD_SLOT_COUNT);
    expect(state.builds.every((b) => b === null)).toBe(true);
    expect(state.progress.coins).toBe(0);
    expect(state.settings.soundEffects).toBe(true);
  });

  it('resets cleanly via resetProgress', () => {
    useGameStore.setState((s) => ({
      progress: { ...s.progress, coins: 999 },
    }));
    expect(useGameStore.getState().progress.coins).toBe(999);
    useGameStore.getState().resetProgress();
    expect(useGameStore.getState().progress.coins).toBe(0);
  });
});
