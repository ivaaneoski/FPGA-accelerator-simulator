import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Layer, EstimationResult, SavedConfig, FPGATarget, ExportedConfig } from '../types';
import { estimateLayersCancellable } from '../api/estimator';
import { FPGA_TARGETS } from '../utils/constants';
import { getLocalStorageSizeKB } from '../utils/localStorage';
import { toast } from 'react-hot-toast';

interface SimulatorState {
  // Layer stack
  layers: Layer[];
  addLayer: (layer: Layer) => void;
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  removeLayer: (id: string) => void;
  clearLayers: () => void;
  reorderLayers: (from: number, to: number) => void;
  setLayers: (layers: Layer[]) => void;

  // ONNX import
  importedModelName: string | null;
  skippedOpsWarning: string[] | null;
  dismissSkippedOpsWarning: () => void;
  clearImportedModelName: () => void;

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
  clearAllConfigs: () => void;
  exportConfigs: () => void;
  importConfigs: (file: File) => void;

  // Theme
  darkMode: boolean;
  toggleDarkMode: () => void;
}

// Track the latest request ID so we can ignore stale responses
let latestRequestId = 0;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function isValidSavedConfig(config: unknown): config is SavedConfig {
  if (!config || typeof config !== 'object') return false;

  const c = config as Partial<SavedConfig>;
  const total = c.result?.total;
  const utilization = c.result?.fpga_utilization;

  return (
    typeof c.id === 'string' &&
    typeof c.name === 'string' &&
    typeof c.fpgaTarget === 'string' &&
    isFiniteNumber(c.clockMhz) &&
    Array.isArray(c.layers) &&
    !!total &&
    isFiniteNumber(total.luts) &&
    isFiniteNumber(total.dsps) &&
    isFiniteNumber(total.brams) &&
    isFiniteNumber(total.latency_us) &&
    isFiniteNumber(total.throughput_inf_per_sec) &&
    !!utilization &&
    isFiniteNumber(utilization.lut_pct) &&
    isFiniteNumber(utilization.dsp_pct) &&
    isFiniteNumber(utilization.bram_pct)
  );
}

function normalizeSavedConfigs(configs: unknown): SavedConfig[] {
  return Array.isArray(configs) ? configs.filter(isValidSavedConfig) : [];
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
      clearLayers: () => set({ layers: [], result: null, isLoading: false, error: null }),
      reorderLayers: (from, to) => {
        set((s) => {
          const updated = [...s.layers];
          const [moved] = updated.splice(from, 1);
          updated.splice(to, 0, moved);
          return { layers: updated };
        });
        get().runEstimation();
      },
      setLayers: (layers) => {
        set({ layers, result: null, importedModelName: null, skippedOpsWarning: null });
        get().runEstimation();
      },

      importedModelName: null,
      skippedOpsWarning: null,
      dismissSkippedOpsWarning: () => set({ skippedOpsWarning: null }),
      clearImportedModelName: () => set({ importedModelName: null }),

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
        if (layers.length === 0) {
          set({ result: null, isLoading: false, error: null });
          return;
        }

        // Increment request ID — only the latest request writes state
        const requestId = ++latestRequestId;
        set({ isLoading: true, error: null });

        try {
          const { promise } = estimateLayersCancellable({
            fpga_target: selectedFPGA.id,
            clock_mhz: clockMhz,
            layers: layers,
          });
          const result = await promise;

          // Only apply if this is still the latest request
          if (requestId === latestRequestId) {
            set({ result, isLoading: false });
          }
        } catch (err: any) {
          // Silently ignore canceled requests — a newer one is in flight
          if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
            // Don't touch isLoading — the newer request owns it now
            return;
          }
          // Only show error if this is still the latest request
          if (requestId === latestRequestId) {
            let detail = err.response?.data?.detail || err.message || 'Estimation failed';
            // FastAPI 422 validation errors are arrays of field issues
            if (Array.isArray(detail)) {
              detail = detail.map((d: any) => (d.msg ? `${d.loc?.[1] || ''}: ${d.msg}` : JSON.stringify(d))).join('; ');
            }
            set({ error: String(detail), isLoading: false });
          }
        }
      },

      saveConfig: (name) => {
        const { layers, selectedFPGA, clockMhz, result, savedConfigs } = get();
        if (!result) {
          toast.error('Run an estimation before saving.');
          return;
        }
        if (savedConfigs.length >= 10) {
          toast.error('Maximum 10 saved configurations. Delete one to save a new config.');
          return;
        }
        const sizeKB = getLocalStorageSizeKB();
        if (sizeKB > 4000) {
          toast.error('Storage nearly full. Delete old configurations to continue saving.');
          return;
        }
        const config: SavedConfig = {
          id: crypto.randomUUID(),
          name,
          fpgaTarget: selectedFPGA.id,
          clockMhz,
          layers,
          result,
          savedAt: new Date().toISOString(),
        };
        set({ savedConfigs: [...savedConfigs, config] });
        toast.success(`"${name}" saved successfully.`);
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
      clearAllConfigs: () => {
        set({ savedConfigs: [] });
        toast.success('All saved configurations cleared.');
      },

      exportConfigs: () => {
        const { savedConfigs } = get();
        if (savedConfigs.length === 0) {
          toast.error('No configurations to export.');
          return;
        }
        const payload: ExportedConfig = {
          version: 1,
          appName: 'fpga-nn-simulator',
          exportedAt: new Date().toISOString(),
          configs: savedConfigs,
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const date = new Date().toISOString().split('T')[0];
        a.download = `fpga-configs-${date}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success(`Exported ${savedConfigs.length} config(s).`);
      },

      importConfigs: (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const parsed = JSON.parse(e.target?.result as string);
            let configsToImport: SavedConfig[];

            // Support both direct array and exported wrapper format
            if (
              parsed &&
              typeof parsed === 'object' &&
              parsed.appName === 'fpga-nn-simulator' &&
              Array.isArray(parsed.configs)
            ) {
              configsToImport = parsed.configs;
            } else if (Array.isArray(parsed)) {
              configsToImport = parsed;
            } else {
              toast.error('Invalid config file format.');
              return;
            }

            const existingIds = new Set(get().savedConfigs.map((c) => c.id));
            const newConfigs = configsToImport.filter(
              (c) => isValidSavedConfig(c) && !existingIds.has(c.id)
            );

            if (newConfigs.length === 0) {
              if (configsToImport.length > existingIds.size || configsToImport.every((c) => existingIds.has(c.id))) {
                toast.error('All configurations from that file are already imported.');
              } else {
                toast.error('No valid configs found in the file.');
              }
              return;
            }

            set((s) => ({ savedConfigs: [...s.savedConfigs, ...newConfigs] }));
            toast.success(`Imported ${newConfigs.length} config(s).`);
          } catch {
            toast.error('Failed to parse the config file.');
          }
        };
        reader.readAsText(file);
      },

      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
    }),
    {
      name: 'fpga-simulator-store',
      partialize: (s) => ({ savedConfigs: s.savedConfigs, darkMode: s.darkMode }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<SimulatorState> | undefined;
        return {
          ...currentState,
          ...persisted,
          savedConfigs: normalizeSavedConfigs(persisted?.savedConfigs),
          darkMode: typeof persisted?.darkMode === 'boolean' ? persisted.darkMode : currentState.darkMode,
        };
      },
    }
  )
);
