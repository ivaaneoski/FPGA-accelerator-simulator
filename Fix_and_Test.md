# FPGA-NN Accelerator Simulator — Fix & Test Instructions

## Context

You have already built the FPGA-NN Accelerator Simulator — a FastAPI Python backend + React/TypeScript/Vite frontend that estimates FPGA hardware resources (LUTs, DSPs, BRAMs, FFs) for neural network layers (Conv2D and Dense). The core structure, file layout, API endpoints, Zustand store, and UI components exist. This document addresses every known technical difficulty that needs fixing, every edge case that needs hardening, and instructs you to run all three layers of tests to verify correctness end to end.

---

## Part 1 — Fix All Known Technical Difficulties

### Fix 1 — Estimation Formula Accuracy & Labeling

The estimation formulas are mathematical approximations, not ground truth synthesis results. Apply all of the following:

**In the backend `engine/formulas.py`:**
- Add a `bram_efficiency_factor = 0.7` multiplier to all BRAM calculations. Raw bit division assumes perfect packing — real designs waste 20–30% of each tile due to aspect ratio mismatch and port constraints. Final formula: `brams = ceil(weight_bits / (36864 * 0.7))`
- Add a `routing_overhead_factor = 1.20` to all LUT calculations. Real synthesis adds 10–30% routing LUTs on top of logic LUTs. Apply as: `luts = base_luts * routing_overhead_factor`
- Floor all output values at 1 — no resource count should ever return 0 or a negative number
- Add a `confidence_margin` field to every layer result: `"confidence_margin": "±20%"` — this is a static string, always the same value
- For activation LUT costs, use these fixed additive values on top of base LUT count:
  - ReLU = `+base_luts * 0.05`
  - Sigmoid = `+base_luts * 0.15`
  - Softmax = `+base_luts * 0.20`
  - None = `+0`

**In the frontend, everywhere a resource number is displayed:**
- Append `~` prefix to all estimated values (e.g., "~14,320 LUTs") to signal approximation
- Add a tooltip on every metric card that reads: "Estimated value. Real synthesis results may differ by ±15–25%. Based on Sze et al. 2017 and Xilinx UG579."
- In the Formula Provenance accordion on the Analytics page, add a disclaimer paragraph: "All estimates include a 20% routing overhead factor and 70% BRAM fill efficiency factor. Values may differ from Vivado HLS synthesis by ±15–25%."

---

### Fix 2 — Parallelism Model: Memory-Bound Diminishing Returns

The current parallelism model gives linear speedup at all parallelism levels, which is physically incorrect for memory-bound layers. Fix this:

**In `engine/formulas.py`:**

```python
MEMORY_BANDWIDTH_GBS = 25.6  # DDR4 on Zynq, GB/s

def compute_roofline_bound(macs: int, weight_bits: int, activation_bits: int, clock_mhz: int, dsps: int) -> dict:
    compute_roof_gops = (dsps * 2 * clock_mhz) / 1000
    data_bytes = (weight_bits + activation_bits) / 8
    arithmetic_intensity = (2 * macs) / data_bytes if data_bytes > 0 else 0.001
    ridge_point = compute_roof_gops / MEMORY_BANDWIDTH_GBS
    bound = "compute" if arithmetic_intensity >= ridge_point else "memory"
    return {
        "arithmetic_intensity": round(arithmetic_intensity, 4),
        "attainable_performance_gops": round(min(
            arithmetic_intensity * MEMORY_BANDWIDTH_GBS,
            compute_roof_gops
        ), 4),
        "compute_roof_gops": round(compute_roof_gops, 4),
        "memory_roof_gbs": MEMORY_BANDWIDTH_GBS,
        "ridge_point": round(ridge_point, 4),
        "bound": bound
    }

def apply_parallelism_diminishing_returns(base_latency_cycles: int, parallelism: int, bound: str) -> int:
    if bound == "memory":
        # Memory-bound: sqrt scaling instead of linear — doubling parallelism gives ~1.4x speedup
        effective_speedup = parallelism ** 0.5
    else:
        # Compute-bound: linear scaling with 90% efficiency factor
        effective_speedup = parallelism * 0.90
    return max(1, int(base_latency_cycles / effective_speedup))
```

- Call `apply_parallelism_diminishing_returns` in both `estimate_conv2d` and `estimate_dense` to compute final `latency_cycles`
- Add `"roofline_bound": bound` to every layer result
- Add `"effective_speedup": effective_speedup` to every layer result so the frontend can display it

**In the frontend Parallelism Slider component:**
- When a layer is memory-bound, display a warning badge next to the slider: amber `AlertTriangle` icon + text "Memory-bound — diminishing returns above 4×"
- Show the `effective_speedup` value next to the latency reading: "Latency: 71µs (4.2× effective speedup)"

---

### Fix 3 — Race Condition on Slider & Form Changes

Every layer edit, slider move, or form change triggers `runEstimation()`. If the user makes changes rapidly, multiple in-flight requests can return out of order, causing stale data to overwrite fresh data. Fix this completely:

**In `frontend/src/api/estimator.ts`:**

```typescript
let activeController: AbortController | null = null;

export async function estimateLayers(payload: EstimateRequest): Promise<EstimationResult> {
  // Cancel any in-flight request before starting a new one
  activeController?.abort();
  activeController = new AbortController();

  try {
    const { data } = await apiClient.post<EstimationResult>(
      '/api/estimate',
      payload,
      { signal: activeController.signal }
    );
    return data;
  } catch (error: any) {
    if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
      // Request was intentionally cancelled — do not update state, do not show error
      throw error;
    }
    throw error;
  }
}
```

**In `frontend/src/store/useSimulatorStore.ts` — update `runEstimation`:**

```typescript
runEstimation: async () => {
  const { layers, selectedFPGA, clockMhz } = get();
  if (layers.length === 0) { set({ result: null, isLoading: false }); return; }
  set({ isLoading: true, error: null });
  try {
    const result = await estimateLayers({
      fpga_target: selectedFPGA.id,
      clock_mhz: clockMhz,
      layers,
    });
    set({ result, isLoading: false });
  } catch (err: any) {
    if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
      // Silently ignore — a newer request is already running
      return;
    }
    set({ error: err.message || 'Estimation failed', isLoading: false });
  }
},
```

Also confirm the debounce hook is applied to ALL slider and number input components at 300ms. Any component that calls `updateLayer` or `setClockMhz` on change must go through `useDebounce(value, 300)` before triggering the store action.

---

### Fix 4 — Roofline Chart: Log-Log Scale Crash Prevention

The Recharts ScatterChart with `scale="log"` crashes or renders incorrectly when any data value is zero or negative. Fix this:

**In `engine/formulas.py`:**
- Floor `arithmetic_intensity` at `0.001` — never allow zero
- Floor `attainable_performance_gops` at `0.001` — never allow zero

**In `frontend/src/components/analytics/RooflineChart.tsx`:**

```typescript
// Before passing data to the chart, sanitize every point
const safePoints = points.map(p => ({
  ...p,
  x: Math.max(p.arithmeticIntensity, 0.001),
  y: Math.max(p.performance, 0.001),
}));

// Axis tick formatter — prevents ugly floating point labels on log scale
const logTickFormatter = (value: number) => {
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  if (value >= 1) return `${Math.round(value)}`;
  return `${value.toFixed(2)}`;
};

// Apply to both XAxis and YAxis:
// tickFormatter={logTickFormatter}
// domain={[0.001, 'auto']}  ← never start from 0
// scale="log"
// type="number"
// allowDataOverflow={false}
```

Also ensure roof line data points never include x=0 or y=0 — start the memory slope segment from x=0.01 minimum.

---

### Fix 5 — BRAM Estimation Edge Case: Very Small Weight Matrices

Dense layers with very few neurons (e.g., Dense 10-neuron output layer) have tiny weight matrices that still consume a full BRAM tile. Fix this:

**In `engine/formulas.py`:**

```python
def estimate_brams(weight_bits: int, efficiency_factor: float = 0.7) -> int:
    if weight_bits <= 0:
        return 0
    # Very small weights (< 1 tile) still consume exactly 1 tile minimum
    raw = weight_bits / (36864 * efficiency_factor)
    return max(1, math.ceil(raw))
```

Apply `estimate_brams()` consistently in both `estimate_conv2d` and `estimate_dense`. Never inline the BRAM formula — always call this function.

---

### Fix 6 — localStorage Quota Exceeded Error Handling

The Zustand `persist` middleware silently crashes when localStorage is full. Add explicit error handling:

**In `frontend/src/utils/localStorage.ts`:**

```typescript
export function safeLocalStorageSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e: any) {
    if (e.name === 'QuotaExceededError' || e.code === 22) {
      console.error('localStorage quota exceeded');
      return false;
    }
    return false;
  }
}

export function getLocalStorageSizeKB(): number {
  let total = 0;
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length + key.length;
    }
  }
  return Math.round(total / 1024);
}
```

**In `useSimulatorStore.ts` — `saveConfig` action:**

```typescript
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
  if (sizeKB > 4000) { // 4MB threshold — warn before hitting 5MB hard limit
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
```

---

### Fix 7 — CORS Production Configuration

Confirm the FastAPI CORS middleware is correctly configured and that environment variables are wired all the way through. Check all of the following:

**In `backend/main.py`:** Confirm `CORSMiddleware` is added BEFORE any `app.include_router()` calls. Order matters — middleware must be registered first.

**In `backend/.env`:** `CORS_ORIGINS` must be a comma-separated string of exact origins with no trailing slashes:
```
CORS_ORIGINS=http://localhost:5173,https://your-app.vercel.app
```

**In `frontend/.env`:**
```
VITE_API_URL=http://localhost:8000
```

**In `frontend/.env.production`:**
```
VITE_API_URL=https://your-backend.railway.app
```

**In `frontend/vite.config.ts`:** Confirm the dev proxy is set:
```typescript
server: {
  proxy: {
    '/api': { target: 'http://localhost:8000', changeOrigin: true }
  }
}
```

**In `frontend/src/api/client.ts`:** Confirm baseURL uses the env variable:
```typescript
baseURL: import.meta.env.VITE_API_URL,
```

If any of these are missing, add them now. Do not use `allow_origins=["*"]` in production.

---

### Fix 8 — Number Formatting Everywhere

All resource numbers must be formatted consistently across the entire frontend. Apply this utility function everywhere a number is displayed:

**In `frontend/src/utils/formatters.ts`:**

```typescript
// Locale-aware integer formatting with comma separators
export const fmtInt = (n: number): string =>
  Math.round(n).toLocaleString('en-US');

// Latency formatting
export const fmtLatency = (us: number): string => {
  if (us >= 1000) return `${(us / 1000).toFixed(2)} ms`;
  if (us >= 1) return `${us.toFixed(2)} µs`;
  return `${(us * 1000).toFixed(1)} ns`;
};

// Throughput formatting
export const fmtThroughput = (infPerSec: number): string => {
  if (infPerSec >= 1_000_000) return `${(infPerSec / 1_000_000).toFixed(2)}M inf/s`;
  if (infPerSec >= 1_000) return `${(infPerSec / 1_000).toFixed(1)}K inf/s`;
  return `${Math.round(infPerSec)} inf/s`;
};

// MACs formatting
export const fmtMACs = (macs: number): string => {
  if (macs >= 1_000_000_000) return `${(macs / 1_000_000_000).toFixed(2)}G MACs`;
  if (macs >= 1_000_000) return `${(macs / 1_000_000).toFixed(2)}M MACs`;
  if (macs >= 1_000) return `${(macs / 1_000).toFixed(1)}K MACs`;
  return `${macs} MACs`;
};

// Percentage formatting
export const fmtPct = (pct: number): string => `${Math.min(pct, 999).toFixed(1)}%`;
```

Apply `fmtInt`, `fmtLatency`, `fmtThroughput`, `fmtMACs`, and `fmtPct` consistently. No raw `.toString()` or template literals on resource numbers anywhere in the codebase.

---

### Fix 9 — Empty & Error States

Confirm every possible state has a handled UI:

**Empty state (no layers):** Centered in the main chart area — `Cpu` icon (48px, indigo, opacity 40%), H3 "No layers configured", Body "Add your first layer using the button in the sidebar to begin estimation.", Primary button "Add First Layer" that triggers the Add Layer modal.

**Loading state:** Every metric card, every chart, and every gauge must show a skeleton loader (`animate-pulse` div with `bg-slate-700` and matching border radius) while `isLoading === true`. No chart should render with empty or undefined data — show skeleton instead.

**Error state:** If `error !== null` in the store, show a red toast notification (auto-dismiss 5 seconds) with the message. Also show an inline error banner below the metric cards: red border-left card with `XCircle` icon + "Estimation failed. Check that the backend is running." + a "Retry" button that calls `runEstimation()` again.

**Over-capacity state:** If any utilization percentage exceeds 100%, show a full-width amber warning banner above the metric cards: `AlertTriangle` icon + "Warning: design exceeds available resources on the selected FPGA. Reduce layer complexity, lower parallelism, or switch to a larger target chip."

---

## Part 2 — Run All Three Testing Layers

After applying all fixes above, run the complete test suite in this exact order.

---

## Testing Layer 1 — Backend Unit Tests

Create and run `backend/tests/test_formulas.py`:

```python
import pytest
import math
from engine.formulas import estimate_conv2d, estimate_dense, estimate_brams, compute_roofline_bound

class TestConv2DEstimation:
    def test_basic_output_dims_same_padding(self):
        r = estimate_conv2d(input_w=28, input_h=28, input_channels=1,
                            filters=32, kernel_size=3, stride=1,
                            padding="same", activation="relu",
                            precision="int8", parallelism_factor=1, clock_mhz=200)
        assert r["output_w"] == 28
        assert r["output_h"] == 28

    def test_basic_output_dims_valid_padding(self):
        r = estimate_conv2d(input_w=28, input_h=28, input_channels=1,
                            filters=32, kernel_size=3, stride=1,
                            padding="valid", activation="relu",
                            precision="int8", parallelism_factor=1, clock_mhz=200)
        assert r["output_w"] == 26
        assert r["output_h"] == 26

    def test_all_resources_positive(self):
        r = estimate_conv2d(input_w=28, input_h=28, input_channels=1,
                            filters=32, kernel_size=3, stride=1,
                            padding="same", activation="relu",
                            precision="int8", parallelism_factor=1, clock_mhz=200)
        assert r["luts"] >= 1
        assert r["ffs"] >= 1
        assert r["dsps"] >= 1
        assert r["brams"] >= 1
        assert r["latency_cycles"] >= 1
        assert r["latency_us"] > 0
        assert r["macs"] > 0

    def test_precision_ordering_luts(self):
        base = dict(input_w=28, input_h=28, input_channels=1, filters=32,
                    kernel_size=3, stride=1, padding="same", activation="relu",
                    parallelism_factor=1, clock_mhz=200)
        fp32 = estimate_conv2d(**base, precision="fp32")
        int8 = estimate_conv2d(**base, precision="int8")
        int4 = estimate_conv2d(**base, precision="int4")
        assert fp32["luts"] > int8["luts"]
        assert int8["luts"] > int4["luts"]

    def test_precision_ordering_dsps(self):
        base = dict(input_w=28, input_h=28, input_channels=1, filters=32,
                    kernel_size=3, stride=1, padding="same", activation="relu",
                    parallelism_factor=1, clock_mhz=200)
        fp32 = estimate_conv2d(**base, precision="fp32")
        int8 = estimate_conv2d(**base, precision="int8")
        int4 = estimate_conv2d(**base, precision="int4")
        assert fp32["dsps"] > int8["dsps"]
        assert int8["dsps"] >= int4["dsps"]

    def test_higher_parallelism_reduces_latency(self):
        base = dict(input_w=28, input_h=28, input_channels=1, filters=64,
                    kernel_size=3, stride=1, padding="same", activation="relu",
                    precision="int8", clock_mhz=200)
        r1 = estimate_conv2d(**base, parallelism_factor=1)
        r8 = estimate_conv2d(**base, parallelism_factor=8)
        assert r8["latency_cycles"] < r1["latency_cycles"]

    def test_higher_parallelism_increases_luts(self):
        base = dict(input_w=28, input_h=28, input_channels=1, filters=64,
                    kernel_size=3, stride=1, padding="same", activation="relu",
                    precision="int8", clock_mhz=200)
        r1 = estimate_conv2d(**base, parallelism_factor=1)
        r8 = estimate_conv2d(**base, parallelism_factor=8)
        assert r8["luts"] > r1["luts"]

    def test_memory_bound_diminishing_returns(self):
        # Memory-bound layers should have sublinear speedup
        base = dict(input_w=112, input_h=112, input_channels=3, filters=64,
                    kernel_size=3, stride=1, padding="same", activation="relu",
                    precision="fp32", clock_mhz=200)
        r1 = estimate_conv2d(**base, parallelism_factor=1)
        r16 = estimate_conv2d(**base, parallelism_factor=16)
        speedup = r1["latency_cycles"] / r16["latency_cycles"]
        # Memory-bound: speedup should be much less than 16x
        assert speedup < 16

    def test_routing_overhead_applied(self):
        # LUTs should include routing overhead — base logic alone would be lower
        r = estimate_conv2d(input_w=28, input_h=28, input_channels=1,
                            filters=32, kernel_size=3, stride=1,
                            padding="same", activation="none",
                            precision="int8", parallelism_factor=1, clock_mhz=200)
        assert r["luts"] > 0

    def test_confidence_margin_present(self):
        r = estimate_conv2d(input_w=28, input_h=28, input_channels=1,
                            filters=32, kernel_size=3, stride=1,
                            padding="same", activation="relu",
                            precision="int8", parallelism_factor=1, clock_mhz=200)
        assert "confidence_margin" in r
        assert r["confidence_margin"] == "±20%"


class TestDenseEstimation:
    def test_basic_dense_all_positive(self):
        r = estimate_dense(input_neurons=128, output_neurons=64,
                           activation="relu", precision="int8",
                           parallelism_factor=1, clock_mhz=200)
        assert r["luts"] >= 1
        assert r["dsps"] >= 1
        assert r["brams"] >= 1
        assert r["latency_cycles"] >= 1
        assert r["macs"] == 128 * 64

    def test_tiny_dense_bram_minimum_one(self):
        # Even a tiny 10-neuron output layer must consume at least 1 BRAM
        r = estimate_dense(input_neurons=10, output_neurons=10,
                           activation="softmax", precision="int8",
                           parallelism_factor=1, clock_mhz=200)
        assert r["brams"] >= 1

    def test_precision_ordering_dense(self):
        base = dict(input_neurons=256, output_neurons=128,
                    activation="relu", parallelism_factor=1, clock_mhz=200)
        fp32 = estimate_dense(**base, precision="fp32")
        int8 = estimate_dense(**base, precision="int8")
        int4 = estimate_dense(**base, precision="int4")
        assert fp32["luts"] > int8["luts"] > int4["luts"]

    def test_parallelism_reduces_latency_dense(self):
        base = dict(input_neurons=512, output_neurons=256,
                    activation="relu", precision="int8", clock_mhz=200)
        r1 = estimate_dense(**base, parallelism_factor=1)
        r4 = estimate_dense(**base, parallelism_factor=4)
        assert r4["latency_cycles"] < r1["latency_cycles"]


class TestBRAMEstimation:
    def test_zero_bits_returns_zero(self):
        assert estimate_brams(0) == 0

    def test_minimum_one_tile(self):
        assert estimate_brams(1) == 1  # 1 bit still needs 1 tile

    def test_efficiency_factor_applied(self):
        # Without efficiency factor, 36864 bits = 1 tile exactly
        # With 0.7 factor, 36864 bits = ceil(36864 / (36864*0.7)) = ceil(1.43) = 2 tiles
        assert estimate_brams(36864) == 2

    def test_large_weight_matrix(self):
        # 1M bits with 0.7 efficiency
        result = estimate_brams(1_000_000)
        expected = math.ceil(1_000_000 / (36864 * 0.7))
        assert result == expected


class TestRooflineModel:
    def test_compute_bound_classification(self):
        # High arithmetic intensity → compute-bound
        result = compute_roofline_bound(
            macs=10_000_000, weight_bits=32768,
            activation_bits=8192, clock_mhz=200, dsps=360)
        assert result["bound"] == "compute"

    def test_memory_bound_classification(self):
        # Low arithmetic intensity → memory-bound
        result = compute_roofline_bound(
            macs=100, weight_bits=10_000_000,
            activation_bits=1_000_000, clock_mhz=200, dsps=360)
        assert result["bound"] == "memory"

    def test_arithmetic_intensity_never_zero(self):
        result = compute_roofline_bound(
            macs=0, weight_bits=0, activation_bits=0,
            clock_mhz=200, dsps=360)
        assert result["arithmetic_intensity"] >= 0.001

    def test_attainable_performance_never_zero(self):
        result = compute_roofline_bound(
            macs=1, weight_bits=1, activation_bits=1,
            clock_mhz=200, dsps=360)
        assert result["attainable_performance_gops"] >= 0.001

    def test_attainable_capped_at_compute_roof(self):
        # Attainable performance cannot exceed compute roof
        result = compute_roofline_bound(
            macs=10_000_000_000, weight_bits=100,
            activation_bits=100, clock_mhz=200, dsps=360)
        assert result["attainable_performance_gops"] <= result["compute_roof_gops"] + 0.001
```

Run all unit tests:
```bash
cd backend
pytest tests/test_formulas.py -v --tb=short
```

**All tests must pass before proceeding. Fix any failing formula logic before moving to Layer 2.**

---

## Testing Layer 2 — API Integration Tests

Create and run `backend/tests/test_endpoints.py`:

```python
import pytest
import time
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

VALID_CONV2D_LAYER = {
    "type": "conv2d", "name": "Conv2D-1",
    "input_width": 28, "input_height": 28, "input_channels": 1,
    "filters": 32, "kernel_size": 3, "stride": 1,
    "padding": "same", "activation": "relu",
    "precision": "int8", "parallelism_factor": 1
}

VALID_DENSE_LAYER = {
    "type": "dense", "name": "Dense-1",
    "input_neurons": 128, "output_neurons": 64,
    "activation": "relu", "precision": "int8", "parallelism_factor": 1
}


class TestHealthEndpoint:
    def test_health_returns_200(self):
        r = client.get("/api/health")
        assert r.status_code == 200

    def test_health_returns_ok_status(self):
        r = client.get("/api/health")
        assert r.json()["status"] == "ok"


class TestFPGATargetsEndpoint:
    def test_returns_200(self):
        r = client.get("/api/fpga-targets")
        assert r.status_code == 200

    def test_returns_five_targets(self):
        r = client.get("/api/fpga-targets")
        assert len(r.json()) == 5

    def test_each_target_has_required_fields(self):
        r = client.get("/api/fpga-targets")
        for target in r.json():
            assert "id" in target
            assert "name" in target
            assert "luts" in target
            assert "ffs" in target
            assert "dsps" in target
            assert "brams" in target
            assert target["luts"] > 0


class TestEstimateEndpoint:
    def test_single_conv2d_returns_200(self):
        payload = {"fpga_target": "zynq_ultrascale_zu3eg",
                   "clock_mhz": 200, "layers": [VALID_CONV2D_LAYER]}
        r = client.post("/api/estimate", json=payload)
        assert r.status_code == 200

    def test_response_has_required_top_level_keys(self):
        payload = {"fpga_target": "zynq_ultrascale_zu3eg",
                   "clock_mhz": 200, "layers": [VALID_CONV2D_LAYER]}
        data = client.post("/api/estimate", json=payload).json()
        assert "total" in data
        assert "layers" in data
        assert "fpga_utilization" in data

    def test_total_has_required_fields(self):
        payload = {"fpga_target": "zynq_ultrascale_zu3eg",
                   "clock_mhz": 200, "layers": [VALID_CONV2D_LAYER]}
        total = client.post("/api/estimate", json=payload).json()["total"]
        for field in ["luts", "ffs", "dsps", "brams", "latency_cycles",
                      "latency_us", "throughput_inf_per_sec", "macs"]:
            assert field in total
            assert total[field] > 0

    def test_layer_result_has_confidence_margin(self):
        payload = {"fpga_target": "zynq_ultrascale_zu3eg",
                   "clock_mhz": 200, "layers": [VALID_CONV2D_LAYER]}
        layer = client.post("/api/estimate", json=payload).json()["layers"][0]
        assert layer["confidence_margin"] == "±20%"

    def test_layer_result_has_roofline_bound(self):
        payload = {"fpga_target": "zynq_ultrascale_zu3eg",
                   "clock_mhz": 200, "layers": [VALID_CONV2D_LAYER]}
        layer = client.post("/api/estimate", json=payload).json()["layers"][0]
        assert layer["roofline_bound"] in ["compute", "memory"]

    def test_utilization_percentages_are_valid(self):
        payload = {"fpga_target": "zynq_ultrascale_zu3eg",
                   "clock_mhz": 200, "layers": [VALID_CONV2D_LAYER]}
        util = client.post("/api/estimate", json=payload).json()["fpga_utilization"]
        for pct in [util["lut_pct"], util["ff_pct"], util["dsp_pct"], util["bram_pct"]]:
            assert pct >= 0

    def test_mixed_layer_stack(self):
        payload = {"fpga_target": "zynq_ultrascale_zu3eg", "clock_mhz": 200,
                   "layers": [VALID_CONV2D_LAYER, VALID_DENSE_LAYER]}
        data = client.post("/api/estimate", json=payload).json()
        assert len(data["layers"]) == 2
        assert data["total"]["luts"] > 0

    def test_total_luts_equals_sum_of_layers(self):
        payload = {"fpga_target": "zynq_ultrascale_zu3eg", "clock_mhz": 200,
                   "layers": [VALID_CONV2D_LAYER, VALID_DENSE_LAYER]}
        data = client.post("/api/estimate", json=payload).json()
        layer_lut_sum = sum(l["luts"] for l in data["layers"])
        assert data["total"]["luts"] == layer_lut_sum

    def test_empty_layers_rejected(self):
        payload = {"fpga_target": "zynq_ultrascale_zu3eg",
                   "clock_mhz": 200, "layers": []}
        r = client.post("/api/estimate", json=payload)
        assert r.status_code == 422

    def test_invalid_fpga_target_rejected(self):
        payload = {"fpga_target": "nonexistent_chip_xyz",
                   "clock_mhz": 200, "layers": [VALID_CONV2D_LAYER]}
        r = client.post("/api/estimate", json=payload)
        assert r.status_code in [404, 422]

    def test_invalid_precision_rejected(self):
        bad_layer = {**VALID_CONV2D_LAYER, "precision": "int16"}
        payload = {"fpga_target": "zynq_ultrascale_zu3eg",
                   "clock_mhz": 200, "layers": [bad_layer]}
        r = client.post("/api/estimate", json=payload)
        assert r.status_code == 422

    def test_invalid_parallelism_rejected(self):
        # 3 is not a power of 2 — must be rejected
        bad_layer = {**VALID_CONV2D_LAYER, "parallelism_factor": 3}
        payload = {"fpga_target": "zynq_ultrascale_zu3eg",
                   "clock_mhz": 200, "layers": [bad_layer]}
        r = client.post("/api/estimate", json=payload)
        assert r.status_code == 422

    def test_lenet5_preset_runs_successfully(self):
        lenet5 = [
            {**VALID_CONV2D_LAYER, "name": "Conv2D-1", "filters": 6, "kernel_size": 5},
            {**VALID_CONV2D_LAYER, "name": "Conv2D-2", "filters": 16, "kernel_size": 5,
             "input_channels": 6, "input_width": 12, "input_height": 12},
            {**VALID_DENSE_LAYER, "name": "Dense-1", "input_neurons": 400, "output_neurons": 120},
            {**VALID_DENSE_LAYER, "name": "Dense-2", "input_neurons": 120, "output_neurons": 84},
            {**VALID_DENSE_LAYER, "name": "Dense-3", "input_neurons": 84, "output_neurons": 10,
             "activation": "softmax"},
        ]
        payload = {"fpga_target": "zynq_ultrascale_zu3eg", "clock_mhz": 200, "layers": lenet5}
        data = client.post("/api/estimate", json=payload).json()
        assert len(data["layers"]) == 5
        assert data["total"]["luts"] > 0
        # LeNet-5 INT8 should fit on ZU3EG (70,560 LUTs available)
        assert data["fpga_utilization"]["lut_pct"] < 100

    def test_response_time_under_200ms(self):
        payload = {"fpga_target": "zynq_ultrascale_zu3eg", "clock_mhz": 200,
                   "layers": [VALID_CONV2D_LAYER] * 20}
        start = time.time()
        client.post("/api/estimate", json=payload)
        elapsed_ms = (time.time() - start) * 1000
        assert elapsed_ms < 200, f"Response took {elapsed_ms:.0f}ms — must be under 200ms"
```

Run all integration tests:
```bash
cd backend
pytest tests/test_endpoints.py -v --tb=short
```

**All tests must pass. If `test_response_time_under_200ms` fails, profile `engine/formulas.py` for slow loops and vectorize with NumPy.**

---

## Testing Layer 3 — Manual Frontend Smoke Tests

Start both servers:
```bash
# Terminal 1
cd backend && uvicorn main:app --reload --port 8000

# Terminal 2
cd frontend && npm run dev
```

Open `http://localhost:5173` and run every scenario below in order. Mark each as PASS or FAIL.

---

### Group A — Empty & Initial State

- [ ] App loads with no errors in browser console
- [ ] Empty state illustration and "No layers configured" message visible in main area
- [ ] All 4 metric cards show "—" or "0" — no skeleton, no broken layout
- [ ] No API call fired on load (check Network tab — no `/api/estimate` request should appear)

---

### Group B — Layer Management

- [ ] Click "Add Layer" → modal opens with Conv2D selected by default
- [ ] Fill Conv2D form with valid values → Save → layer card appears in sidebar
- [ ] Layer card shows correct type badge (indigo "Conv2D"), name, and key params summary
- [ ] API call fires after save → all 4 metric cards update with `~` prefixed numbers
- [ ] Add a second Dense layer → both cards visible in sidebar, totals increase
- [ ] Click pencil icon on Conv2D layer → form pre-filled with existing values → change filters → Save → estimates update
- [ ] Click trash icon on a layer → confirmation dialog appears → confirm → layer removed → estimates recalculate
- [ ] Click "Clear All" → confirmation → all layers removed → empty state illustration returns

---

### Group C — Parallelism Slider

- [ ] Open Layer Builder for an existing layer → parallelism slider visible
- [ ] Drag slider from 1× to 2× → wait 300ms → latency decreases, LUTs increase in estimates
- [ ] Drag slider rapidly from 1× to 16× in one motion → only ONE API call fires after stopping (verify in Network tab — debounce working correctly)
- [ ] Large Conv2D with FP32 precision (memory-bound) → amber warning badge appears beside slider reading "Memory-bound — diminishing returns above 4×"
- [ ] `effective_speedup` value shown correctly next to the latency reading (e.g., "4.2× effective speedup")

---

### Group D — Precision Comparator

- [ ] Change precision from INT8 → FP32 → LUTs and DSPs jump up (3–4× increase)
- [ ] Change precision from INT8 → INT4 → LUTs and DSPs drop (approximately 50%)
- [ ] Precision Comparator table shows three columns (FP32 / INT8 / INT4) with correct relative ordering: FP32 > INT8 > INT4 for all resource counts
- [ ] Currently active precision column has indigo background highlight
- [ ] Accuracy Loss row shows: FP32 = 0%, INT8 = ~0.5%, INT4 = ~2–4%

---

### Group E — FPGA Target Switching

- [ ] Switch from ZU3EG to Zynq-7020 (smaller chip) → all utilization percentages increase
- [ ] Switch to Virtex UltraScale+ VU9P (largest chip) → utilization percentages drop significantly
- [ ] Progress bar colors update correctly per threshold — green below 60%, amber 60–80%, red above 80%
- [ ] Gauge charts update to reflect new percentages immediately

---

### Group F — Over-Capacity Handling

- [ ] Add many large layers (or switch to a small chip) until LUT% exceeds 100%
- [ ] Full-width amber warning banner appears above metric cards with `AlertTriangle` icon
- [ ] App does not crash — no console errors
- [ ] Metric card can display utilization values above 100% without breaking layout
- [ ] No negative values appear anywhere

---

### Group G — Configuration Save & Load

- [ ] Click "Save Configuration" → name prompt appears → enter a name → success toast appears with config name
- [ ] Navigate to Comparison page → saved configuration visible in table with correct columns
- [ ] Click "Set as Active" on saved config → navigates to Simulator → all layers and estimates restored exactly
- [ ] Save 10 different configurations → attempt to save an 11th → error toast: "Maximum 10 saved configurations"
- [ ] Delete a config from Comparison page → it disappears from the table immediately
- [ ] Hard refresh the browser (`Ctrl+Shift+R`) → saved configurations still present in Comparison page (localStorage persisted across refresh)

---

### Group H — Export & Import

- [ ] Click "Export JSON" → file downloads to computer
- [ ] Open the downloaded file — valid JSON structure with `layers` and `result` keys present
- [ ] Click "Import JSON" → select the downloaded file → layers restore correctly in sidebar
- [ ] After import, estimation runs automatically and results match the exported values

---

### Group I — Error Handling & Recovery

- [ ] Stop the backend server (`Ctrl+C` in terminal) → try adding or editing a layer → red error toast appears within 10 seconds
- [ ] Inline error banner appears below metric cards with `XCircle` icon and "Retry" button
- [ ] Click "Retry" while backend is still down → toast appears again, no crash, no frozen UI
- [ ] Restart backend server → click "Retry" → estimation succeeds, error banner disappears, results appear

---

### Group J — Roofline Chart

- [ ] Navigate to Analytics page with at least 2 layers configured (one Conv2D, one Dense)
- [ ] Roofline chart renders with both axes labeled ("Arithmetic Intensity (OPs/Byte)" and "Performance (GOPs/s)")
- [ ] Both axes use log scale — data points spread across the chart, not clustered in one corner
- [ ] Each layer appears as a colored dot: red for compute-bound, indigo for memory-bound
- [ ] Roof lines visible as amber dashed lines (memory slope and flat compute ceiling)
- [ ] Hover over a layer dot → tooltip shows: layer name, arithmetic intensity, performance, bound classification
- [ ] Open browser console — zero errors about `log(0)`, `NaN`, or `undefined` values

---

### Group K — Dark / Light Mode

- [ ] Click theme toggle in header → entire app switches to light mode — backgrounds, text, borders all update
- [ ] Charts re-render with updated colors appropriate for light mode
- [ ] All text remains readable in both modes (no white-on-white or black-on-black)
- [ ] Refresh page → theme preference persists (dark or light remembered from localStorage)
- [ ] Toggle back to dark mode → returns to correct dark appearance

---

## Final Test Report

After completing all three testing layers, produce a report in this exact format:

```
=== FPGA-NN Accelerator Simulator — Test Report ===

Layer 1 — Unit Tests
  Passed: X / 21
  Failed: X / 21
  Failures: [list test names that failed]

Layer 2 — Integration Tests
  Passed: X / 17
  Failed: X / 17
  Failures: [list test names that failed]

Layer 3 — Frontend Smoke Tests
  Group A (Empty State):        PASS / FAIL
  Group B (Layer Management):   PASS / FAIL
  Group C (Parallelism Slider): PASS / FAIL
  Group D (Precision):          PASS / FAIL
  Group E (FPGA Switching):     PASS / FAIL
  Group F (Over-Capacity):      PASS / FAIL
  Group G (Save / Load):        PASS / FAIL
  Group H (Export / Import):    PASS / FAIL
  Group I (Error Handling):     PASS / FAIL
  Group J (Roofline Chart):     PASS / FAIL
  Group K (Dark / Light Mode):  PASS / FAIL
  Notes: [any group-specific observations]

Overall Status: READY FOR DEPLOYMENT / NEEDS FIXES
```

Fix all failures before considering the build complete. Do not deploy until all three layers show zero failures.
