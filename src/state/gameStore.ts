import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import type { Build } from '../data/types';

export const SAVE_VERSION = 1;
export const SAVE_KEY = 'cfk_save_v1';
export const BUILD_SLOT_COUNT = 6;

export interface ProgressState {
  coins: number;
  unlockedPartIds: string[];
  unlockedNotebookEntries: string[];
  revealedHiddenStats: string[];
  trackRecords: Record<string, number>;
  surfacesRacedOn: string[];
  totalRacesByTrack: Record<string, number>;
}

export interface SettingsState {
  soundEffects: boolean;
  music: boolean;
  narration: boolean;
  musicVolume: number;
  sfxVolume: number;
}

export interface SaveData {
  version: typeof SAVE_VERSION;
  builds: (Build | null)[];
  progress: ProgressState;
  settings: SettingsState;
}

export interface GameStore extends SaveData {
  resetProgress: () => void;
}

const emptyBuilds = (): (Build | null)[] =>
  Array.from({ length: BUILD_SLOT_COUNT }, () => null);

const initialProgress: ProgressState = {
  coins: 0,
  unlockedPartIds: [],
  unlockedNotebookEntries: [],
  revealedHiddenStats: [],
  trackRecords: {},
  surfacesRacedOn: [],
  totalRacesByTrack: {},
};

const initialSettings: SettingsState = {
  soundEffects: true,
  music: false,
  narration: false,
  musicVolume: 0.5,
  sfxVolume: 0.8,
};

const memoryStorage = (): StateStorage => {
  const map = new Map<string, string>();
  return {
    getItem: (key) => (map.has(key) ? map.get(key)! : null),
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
  };
};

const getStorage = (): StateStorage => {
  if (typeof window === 'undefined') return memoryStorage();
  try {
    const probeKey = `${SAVE_KEY}__probe`;
    window.localStorage.setItem(probeKey, '1');
    window.localStorage.removeItem(probeKey);
    return window.localStorage;
  } catch {
    return memoryStorage();
  }
};

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      version: SAVE_VERSION,
      builds: emptyBuilds(),
      progress: initialProgress,
      settings: initialSettings,
      resetProgress: () =>
        set({
          version: SAVE_VERSION,
          builds: emptyBuilds(),
          progress: initialProgress,
          settings: initialSettings,
        }),
    }),
    {
      name: SAVE_KEY,
      version: SAVE_VERSION,
      storage: createJSONStorage(() => getStorage()),
      migrate: (persisted) => {
        // Phase 2A schema refinement: builds were always (Build | null)[]
        // with all-nulls in Phase 1, so this is a safe identity migration
        // that backfills any missing keys.
        if (!persisted || typeof persisted !== 'object') {
          return {
            version: SAVE_VERSION,
            builds: emptyBuilds(),
            progress: initialProgress,
            settings: initialSettings,
          };
        }
        const candidate = persisted as Partial<SaveData>;
        return {
          version: SAVE_VERSION,
          builds:
            Array.isArray(candidate.builds) &&
            candidate.builds.length === BUILD_SLOT_COUNT
              ? (candidate.builds as (Build | null)[])
              : emptyBuilds(),
          progress: { ...initialProgress, ...(candidate.progress ?? {}) },
          settings: { ...initialSettings, ...(candidate.settings ?? {}) },
        };
      },
    },
  ),
);
