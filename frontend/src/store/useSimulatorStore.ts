import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Layer, EstimationResult, SavedConfig, FPGATarget } from '../types';
import { estimateLayers } from '../api/estimator';
import { FPGA_TARGETS } from '../utils/constants';

interface SimulatorState {
  // Layer stack
  layers: Layer[];
  addLayer: (layer: Layer) => void;
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  removeLayer: (id: string) => void;
  clearLayers: () => void;
  reorderLayers: (from: number, to: number) => void;

  // FPGA target
  selectedFPGA: FPGATarget;
  setFPGA: (target: FPGATarget) => void;

  // Clock
  clockMhz: number;
  setClockMhz: (mhz: number) => void;

  // Estimation result
  result: EstimationResult | null;
  isLoading: boolean;
  error: string | null;
  runEstimation: () => Promise<void>;

  // Saved configurations
  savedConfigs: SavedConfig[];
  saveConfig: (name: string) => void;
  loadConfig: (id: string) => void;
  deleteConfig: (id: string) => void;

  // Theme
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const useSimulatorStore = create<SimulatorState>()(
  persist(
    (set, get) => ({
      layers: [],
      selectedFPGA: FPGA_TARGETS[1], // Zynq UltraScale+ default
      clockMhz: 200,
      result: null,
      isLoading: false,
      error: null,
      savedConfigs: [],
      darkMode: true,

      addLayer: (layer) => {
        set((s) => ({ layers: [...s.layers, layer] }));
        get().runEstimation();
      },
      updateLayer: (id, updates) => {
        set((s) => ({
          layers: s.layers.map((l) => (l.id === id ? { ...l, ...updates } as Layer : l)),
        }));
        get().runEstimation();
      },
      removeLayer: (id) => {
        set((s) => ({ layers: s.layers.filter((l) => l.id !== id) }));
        get().runEstimation();
      },
      clearLayers: () => set({ layers: [], result: null }),
      reorderLayers: (from, to) => {
        set((s) => {
          const updated = [...s.layers];
          const [moved] = updated.splice(from, 1);
          updated.splice(to, 0, moved);
          return { layers: updated };
        });
        get().runEstimation();
      },

      setFPGA: (target) => {
        set({ selectedFPGA: target });
        get().runEstimation();
      },
      setClockMhz: (mhz) => {
        set({ clockMhz: mhz });
        get().runEstimation();
      },

      runEstimation: async () => {
        const { layers, selectedFPGA, clockMhz } = get();
        if (layers.length === 0) { set({ result: null }); return; }
        set({ isLoading: true, error: null });
        try {
          const result = await estimateLayers({
            fpga_target: selectedFPGA.id,
            clock_mhz: clockMhz,
            // the backend accepts 'layers' exactly like the ts-types so this works
            layers: layers,
          });
          set({ result, isLoading: false });
        } catch (err: any) {
          set({ error: err.message || 'Estimation failed', isLoading: false });
        }
      },

      saveConfig: (name) => {
        const { layers, selectedFPGA, clockMhz, result, savedConfigs } = get();
        if (!result) return;
        const config: SavedConfig = {
          id: crypto.randomUUID(),
          name,
          fpgaTarget: selectedFPGA.id,
          clockMhz,
          layers,
          result,
          savedAt: new Date().toISOString(),
        };
        set({ savedConfigs: [...savedConfigs.slice(-9), config] }); // max 10
      },
      loadConfig: (id) => {
        const config = get().savedConfigs.find((c) => c.id === id);
        if (!config) return;
        const fpga = FPGA_TARGETS.find((t) => t.id === config.fpgaTarget) ?? FPGA_TARGETS[1];
        set({ layers: config.layers, selectedFPGA: fpga, clockMhz: config.clockMhz, result: config.result });
      },
      deleteConfig: (id) => {
        set((s) => ({ savedConfigs: s.savedConfigs.filter((c) => c.id !== id) }));
      },

      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
    }),
    {
      name: 'fpga-simulator-store',
      partialize: (s) => ({ savedConfigs: s.savedConfigs, darkMode: s.darkMode }),
    }
  )
);
