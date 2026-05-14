import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const SAVE_VERSION = 1;
export const SAVE_KEY = 'cfk_save_v1';
export const BUILD_SLOT_COUNT = 6;

export interface BuildPlaceholder {
  id: string;
  name: string;
  createdAt: number;
  lastModified: number;
}

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
  builds: (BuildPlaceholder | null)[];
  progress: ProgressState;
  settings: SettingsState;
}

export interface GameStore extends SaveData {
  resetProgress: () => void;
}

const emptyBuilds = (): (BuildPlaceholder | null)[] =>
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
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
