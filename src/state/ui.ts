import { create } from 'zustand';

export type GridStepState = 'queued' | 'thinking' | 'rendering' | 'ready' | 'error';

type UIState = {
  gridSweepTick: number;
  triggerGridSweep: () => void;
};

export const useUI = create<UIState>((set) => ({
  gridSweepTick: 0,
  triggerGridSweep: () => set((state) => ({ gridSweepTick: state.gridSweepTick + 1 })),
}));
