import { create } from "zustand";
import type { RegionId } from "@/lib/ai-labs";

export const SPEEDS = [
  { id: 0, label: "暂停" },
  { id: 1, label: "实时" },
  { id: 60, label: "×60" },
  { id: 600, label: "×600" },
  { id: 3600, label: "×3600" },
] as const;

type GlobeState = {
  simTime: number;
  speed: number;
  selectedId: string | null;
  hoveredId: string | null;
  flyNonce: number;
  flyId: string | null;
  panelOpen: boolean;
  region: RegionId | "all";
  texturesReady: boolean;
  setSimTime: (t: number) => void;
  setSpeed: (s: number) => void;
  select: (id: string | null) => void;
  hover: (id: string | null) => void;
  flyTo: (id: string) => void;
  setPanelOpen: (open: boolean) => void;
  setRegion: (region: RegionId | "all") => void;
  setTexturesReady: (ready: boolean) => void;
  jumpToNow: () => void;
};

export const useGlobe = create<GlobeState>((set) => ({
  simTime: Date.now(),
  speed: 1,
  selectedId: null,
  hoveredId: null,
  flyNonce: 0,
  flyId: null,
  panelOpen: false,
  region: "all",
  texturesReady: false,
  setSimTime: (simTime) => set({ simTime }),
  setSpeed: (speed) => set({ speed }),
  select: (selectedId) => set({ selectedId }),
  hover: (hoveredId) => set({ hoveredId }),
  flyTo: (id) =>
    set((s) => ({
      selectedId: id,
      flyId: id,
      flyNonce: s.flyNonce + 1,
      panelOpen: false,
    })),
  setPanelOpen: (panelOpen) => set({ panelOpen }),
  setRegion: (region) => set({ region }),
  setTexturesReady: (texturesReady) => set({ texturesReady }),
  jumpToNow: () => set({ simTime: Date.now(), speed: 1 }),
}));
