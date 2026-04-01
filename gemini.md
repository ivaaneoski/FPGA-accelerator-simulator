# System Instructions: FPGA-Targeted Neural Network Accelerator Simulator

## Project Overview

Build an **FPGA-Targeted Neural Network Accelerator Simulator** — a Python backend + React/TypeScript frontend dashboard that simulates how neural network layers (Conv2D, Dense) map to FPGA hardware resources. The tool estimates LUT/FF/DSP/BRAM utilization, latency, throughput, and visualizes parallelism vs. area tradeoffs interactively. It is aimed at ML hardware researchers, students, and FPGA engineers who want to explore design-space decisions before committing to real synthesis.

This is a **simulation tool only** — it does not interface with real FPGA hardware. All estimates are derived from simplified academic and Xilinx-style resource estimation models.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11+, FastAPI 0.111+, NumPy 1.26+, Uvicorn 0.29+ |
| Frontend | React 18, TypeScript 5, Vite 5 |
| Charting | Recharts 2.12+ |
| Styling | Tailwind CSS 3.4+ |
| State Management | **Zustand 4.5+** (single global store — do NOT use Context) |
| API Communication | **Axios 1.7+** |
| Data Persistence | localStorage (for saved configurations) |
| Deployment | Vercel (frontend), Railway or Render (backend) |

---

## Navigation Structure

### Top Navigation Tabs
- Simulator (home/default view)
- Layer Builder
- Comparison
- Analytics
- About / References

### Header Elements
- Dark/Light mode toggle
- GitHub link icon
- App title: "FPGA-NN Accelerator Simulator"
- Target FPGA selector (global dropdown)

---

## Page 1 — Simulator (Home/Default View)

### Layer Stack Panel (Left Sidebar)
- List of all configured layers in order
- Each layer card shows:
  - Layer type badge (Conv2D / Dense)
  - Key parameters summary (e.g., "32 filters, 3×3 kernel")
  - Estimated LUT count (compact)
  - Edit button (pencil icon)
  - Delete button (trash icon)
- "Add Layer" button — opens layer form modal
- "Clear All" button with confirmation dialog
- "Save Configuration" button — saves to localStorage
- "Load Configuration" button — loads from localStorage

### Resource Summary Cards (Top Row — 4 Cards)

**Card 1: Total LUTs**
- Display estimated total LUT count
- Show as: `X / Y (Z%)` where Y = selected FPGA's LUT capacity
- Color-coded progress bar: green < 60%, yellow 60–80%, red > 80%

**Card 2: Total DSP Blocks**
- Display estimated DSP48E2 block usage
- Show as: `X / Y (Z%)`
- Color-coded progress bar

**Card 3: Total BRAMs**
- Display estimated Block RAM tile usage (36Kb tiles)
- Show as: `X / Y (Z%)`
- Color-coded progress bar

**Card 4: Estimated Latency**
- Display total inference latency in microseconds (µs)
- Sub-label: clock cycles at configured MHz
- Show throughput: inferences/second

### Layer-by-Layer Resource Breakdown Chart
- Grouped bar chart (Recharts BarChart)
- X-axis: layer names (e.g., "Conv2D-1", "Dense-1")
- Y-axis: resource count
- Three bar groups per layer: LUTs (blue), DSPs (purple), BRAMs (orange)
- Tooltip on hover showing exact values
- Legend below chart

### Latency Waterfall Chart
- Horizontal stacked bar chart showing each layer's contribution to total latency
- Color-coded by layer type (Conv2D = teal, Dense = indigo)
- Tooltip: layer name, clock cycles, wall-clock time
- Displayed in order of pipeline execution

### FPGA Utilization Gauge
- Four semicircular gauge charts (one per resource: LUT, FF, DSP, BRAM)
- Displayed as percentage of selected FPGA capacity
- Color transitions: green → yellow → red
- Center label: `X%`

**Implementation — use Recharts `RadialBarChart` exactly as follows:**

```tsx
// UtilizationGauge.tsx
import { RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';

interface GaugeProps {
  value: number;      // 0–100 (percentage)
  label: string;      // e.g. "LUTs"
  color: string;      // e.g. "#6366f1"
}

export function UtilizationGauge({ value, label, color }: GaugeProps) {
  const clampedValue = Math.min(value, 100);
  const gaugeColor =
    clampedValue < 60 ? '#22c55e' :
    clampedValue < 80 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative flex flex-col items-center">
      <RadialBarChart
        width={140}
        height={80}
        cx={70}
        cy={80}
        innerRadius={50}
        outerRadius={70}
        startAngle={180}
        endAngle={0}
        data={[{ value: clampedValue, fill: gaugeColor }]}
      >
        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
        <RadialBar dataKey="value" cornerRadius={4} background={{ fill: '#334155' }} />
      </RadialBarChart>
      {/* Centered label absolutely positioned over the flat edge of the semicircle */}
      <div className="absolute bottom-0 text-center">
        <p className="text-xl font-bold" style={{ color: gaugeColor }}>
          {clampedValue.toFixed(1)}%
        </p>
        <p className="text-xs text-slate-400">{label}</p>
      </div>
    </div>
  );
}
```

---

## Page 2 — Layer Builder

### Layer Configuration Form

**Layer Type Selector**
- Toggle/tab: `Conv2D` | `Dense (Fully Connected)`

---

#### Conv2D Configuration Fields

| Field | Input Type | Default | Notes |
|---|---|---|---|
| Layer Name | Text | "Conv2D-1" | Auto-incremented |
| Input Width | Number | 28 | Pixels |
| Input Height | Number | 28 | Pixels |
| Input Channels | Number | 1 | Depth of input feature map |
| Number of Filters | Number | 32 | Output channels |
| Kernel Size | Number (1–7) | 3 | Assumes square kernel (3 = 3×3) |
| Stride | Number | 1 | |
| Padding | Select | Same | Same / Valid |
| Activation | Select | ReLU | ReLU / None / Sigmoid |
| Precision | Select | INT8 | FP32 / INT8 / INT4 |
| Parallelism Factor | Slider (1–16, powers of 2) | 1 | Filter unrolling factor |

---

#### Dense (Fully Connected) Configuration Fields

| Field | Input Type | Default | Notes |
|---|---|---|---|
| Layer Name | Text | "Dense-1" | Auto-incremented |
| Input Neurons | Number | 128 | |
| Output Neurons | Number | 64 | |
| Activation | Select | ReLU | ReLU / None / Softmax / Sigmoid |
| Precision | Select | INT8 | FP32 / INT8 / INT4 |
| Parallelism Factor | Slider (1–16, powers of 2) | 1 | Output neuron unrolling |

---

### Parallelism vs. Latency Tradeoff Panel
- **Interactive Slider** — parallelism factor from 1× to 16× (powers of 2: 1, 2, 4, 8, 16)
- As slider moves, **live update** of:
  - Latency (clock cycles and µs) — decreases with higher parallelism
  - LUT usage — increases with higher parallelism
  - DSP usage — increases with higher parallelism
- Side-by-side display:
  - Left metric: "Latency: X µs"
  - Right metric: "LUTs used: X"
- Annotation: "Roofline: Compute-bound" or "Memory-bound" (based on arithmetic intensity)

### Precision Comparator Panel
- Three-column comparison table: FP32 | INT8 | INT4
- Rows: LUTs, DSPs, BRAMs, Latency (µs), Throughput (inf/s), Accuracy Loss (estimated %)
- Accuracy Loss values are static/estimated: FP32 = 0%, INT8 = ~0.5%, INT4 = ~2–4%
- Highlight the currently selected precision in each row

---

## Page 3 — Comparison

### Configuration Comparison Table
- User can save up to 5 named configurations (snapshots)
- Table columns: Config Name, Layers, Total LUTs, Total DSPs, Total BRAMs, Latency (µs), Throughput, Precision
- Highlight best value (lowest resource / lowest latency) in green per column
- "Save Current Config" button with name prompt
- "Delete Config" button per row
- "Set as Active" button per row — loads that config back into Simulator

### Radar Chart
- Spider/radar chart comparing up to 3 selected configurations simultaneously
- Axes: LUT %, DSP %, BRAM %, Latency (normalized), Throughput (normalized)
- Different color per configuration
- Legend with config names

**Implementation — use Recharts `RadarChart` exactly as follows:**

```tsx
// RadarChart.tsx
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Legend, ResponsiveContainer, Tooltip
} from 'recharts';

const RADAR_COLORS = ['#6366f1', '#14b8a6', '#f59e0b'];

interface RadarConfig {
  name: string;
  lutPct: number;
  dspPct: number;
  bramPct: number;
  latencyNorm: number;    // 0–100, normalized across all saved configs
  throughputNorm: number; // 0–100, normalized across all saved configs
}

export function ConfigRadarChart({ configs }: { configs: RadarConfig[] }) {
  // Transform into Recharts format: array of axis objects with value per config
  const axes = ['LUT %', 'DSP %', 'BRAM %', 'Latency', 'Throughput'];
  const dataKeys: (keyof RadarConfig)[] = ['lutPct', 'dspPct', 'bramPct', 'latencyNorm', 'throughputNorm'];

  const chartData = axes.map((axis, i) => {
    const entry: Record<string, any> = { axis };
    configs.forEach(cfg => { entry[cfg.name] = cfg[dataKeys[i]]; });
    return entry;
  });

  return (
    <ResponsiveContainer width="100%" height={320}>
      <RadarChart data={chartData}>
        <PolarGrid stroke="#334155" />
        <PolarAngleAxis dataKey="axis" tick={{ fill: '#94a3b8', fontSize: 12 }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
        {configs.map((cfg, i) => (
          <Radar
            key={cfg.name}
            name={cfg.name}
            dataKey={cfg.name}
            stroke={RADAR_COLORS[i]}
            fill={RADAR_COLORS[i]}
            fillOpacity={0.15}
            strokeWidth={2}
          />
        ))}
        <Legend />
        <Tooltip
          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
          labelStyle={{ color: '#f1f5f9' }}
          itemStyle={{ color: '#94a3b8' }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
```

---

## Page 4 — Analytics

### Resource Efficiency Score
- Composite score (0–100) calculated as:
  `Score = 0.4 × (1 - LUT%) + 0.3 × (1 - DSP%) + 0.3 × Throughput_normalized`
- Displayed as a large numeric gauge
- Interpretation labels: Poor (0–40), Fair (40–60), Good (60–80), Excellent (80–100)

### Roofline Model Chart
- Scatter plot (log-log scale)
- X-axis: Arithmetic Intensity (OPs/Byte)
- Y-axis: Attainable Performance (GOPs/s)
- Two roof lines: compute roof and memory bandwidth roof
- Each layer plotted as a labeled dot
- Color: compute-bound layers (red) vs. memory-bound layers (blue)

**Implementation — use Recharts `ScatterChart` with `scale="log"` exactly as follows:**

```tsx
// RooflineChart.tsx
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer, Label
} from 'recharts';

interface RooflinePoint {
  arithmeticIntensity: number;  // x — OPs/Byte
  performance: number;          // y — GOPs/s
  name: string;
  bound: 'compute' | 'memory';
}

interface RooflineChartProps {
  points: RooflinePoint[];
  computeRoof: number;     // e.g. 500 GOPs/s — from fpga DSPs * 2 * clockMhz / 1000
  memoryRoof: number;      // e.g. 25.6 GB/s — fixed for DDR4 on Zynq
}

export function RooflineChart({ points, computeRoof, memoryRoof }: RooflineChartProps) {
  // Ridge point: x where memory roof meets compute roof
  const ridgePoint = computeRoof / memoryRoof;

  // Build roof line as two-segment line data for ReferenceLine is not enough;
  // render roof lines as a second Scatter with line type using dot=false
  const roofData = [
    { x: 0.1, y: 0.1 * memoryRoof },          // left of ridge (memory slope)
    { x: ridgePoint, y: computeRoof },          // ridge point
    { x: ridgePoint * 10, y: computeRoof },     // right of ridge (flat compute roof)
  ];

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    const fill = payload.bound === 'compute' ? '#ef4444' : '#6366f1';
    return (
      <g>
        <circle cx={cx} cy={cy} r={6} fill={fill} stroke="#fff" strokeWidth={1} />
        <text x={cx + 8} y={cy - 6} fill="#94a3b8" fontSize={11}>{payload.name}</text>
      </g>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={350}>
      <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 50 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis
          dataKey="x"
          type="number"
          scale="log"
          domain={['auto', 'auto']}
          tickFormatter={(v) => v.toFixed(1)}
          stroke="#94a3b8"
        >
          <Label value="Arithmetic Intensity (OPs/Byte)" position="bottom" offset={20} fill="#94a3b8" />
        </XAxis>
        <YAxis
          dataKey="y"
          type="number"
          scale="log"
          domain={['auto', 'auto']}
          tickFormatter={(v) => `${v}`}
          stroke="#94a3b8"
        >
          <Label value="Performance (GOPs/s)" angle={-90} position="insideLeft" offset={-10} fill="#94a3b8" />
        </YAxis>
        <Tooltip
          cursor={{ strokeDasharray: '3 3' }}
          content={({ payload }) => {
            if (!payload?.length) return null;
            const d = payload[0].payload;
            return (
              <div className="bg-slate-800 border border-slate-700 p-2 rounded text-xs">
                <p className="font-bold text-slate-100">{d.name}</p>
                <p className="text-slate-400">AI: {d.arithmeticIntensity?.toFixed(2)} OPs/Byte</p>
                <p className="text-slate-400">Perf: {d.performance?.toFixed(1)} GOPs/s</p>
                <p className={d.bound === 'compute' ? 'text-red-400' : 'text-indigo-400'}>
                  {d.bound === 'compute' ? 'Compute-bound' : 'Memory-bound'}
                </p>
              </div>
            );
          }}
        />
        {/* Roof line rendered as a connected scatter */}
        <Scatter data={roofData} dataKey="y" line={{ stroke: '#f59e0b', strokeWidth: 2 }}
          dot={false} name="Roofline" fill="#f59e0b" />
        {/* Layer data points */}
        <Scatter
          data={points.map(p => ({ ...p, x: p.arithmeticIntensity, y: p.performance }))}
          dataKey="y"
          shape={<CustomDot />}
          name="Layers"
        />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
```

### Per-Layer Statistics Table
- Full table of all layers with columns:
  - Layer Name
  - Type
  - MACs (Multiply-Accumulate Operations)
  - Parameters
  - LUTs
  - FFs
  - DSPs
  - BRAMs
  - Latency (cycles)
  - Latency (µs)
  - Roofline Classification

### Formula Provenance Panel
- Collapsible accordion per resource type (LUT, DSP, BRAM)
- Shows the formula used for estimation
- Cites the source paper/document
- Example:
  - DSP for Conv2D: `DSPs = ceil(Filters × Channels × K² / Parallelism) × DSPs_per_MAC`
  - Source: "Sze et al., 2017 — Efficient Processing of Deep Neural Networks"

---

## Page 5 — About / References

### Project Description Section
- One-paragraph summary of what the tool does
- Mention: simulation-only, no real FPGA hardware required

### Academic References Section
- Numbered reference list:
  1. Sze, V., Chen, Y., Yang, T., & Edeleman, J. (2017). *Efficient Processing of Deep Neural Networks: A Tutorial and Survey*. Proceedings of the IEEE.
  2. Xilinx (AMD). *UltraScale Architecture DSP Slice User Guide (UG579)*.
  3. Xilinx (AMD). *Vivado Design Suite User Guide: High-Level Synthesis (UG902)*.
  4. Umuroglu, Y. et al. (2017). *FINN: A Framework for Fast, Scalable Binarized Neural Network Inference*. FPGA '17.
  5. Blott, M. et al. (2018). *FINN-R: An End-to-End Deep-Learning Framework for Fast Exploration of Quantized Neural Networks*. ACM TRETS.

### Supported FPGA Targets Section
- Table of available FPGA targets in the global selector:

| FPGA | Family | LUTs | FFs | DSP Blocks | BRAMs (36Kb) |
|---|---|---|---|---|---|
| Zynq-7020 | Zynq-7000 | 53,200 | 106,400 | 220 | 140 |
| Zynq UltraScale+ ZU3EG | UltraScale+ | 70,560 | 141,120 | 360 | 216 |
| Artix-7 35T | Artix-7 | 20,800 | 41,600 | 90 | 50 |
| Virtex UltraScale+ VU9P | UltraScale+ | 1,182,240 | 2,364,480 | 6,840 | 2,160 |
| Kria KV260 | UltraScale+ | 117,120 | 234,240 | 1,248 | 144 |

---

## Resource Estimation Engine (Python Backend)

### FastAPI Endpoints

```
POST   /api/estimate          → Estimate resources for full layer stack
POST   /api/estimate/layer    → Estimate resources for a single layer
GET    /api/fpga-targets       → Return list of supported FPGA targets
POST   /api/compare           → Compare multiple saved configurations
GET    /api/health             → Health check
```

---

### POST /api/estimate — Request Body

```json
{
  "fpga_target": "zynq_ultrascale_zu3eg",
  "clock_mhz": 200,
  "layers": [
    {
      "type": "conv2d",
      "name": "Conv2D-1",
      "input_width": 28,
      "input_height": 28,
      "input_channels": 1,
      "filters": 32,
      "kernel_size": 3,
      "stride": 1,
      "padding": "same",
      "activation": "relu",
      "precision": "int8",
      "parallelism_factor": 4
    },
    {
      "type": "dense",
      "name": "Dense-1",
      "input_neurons": 128,
      "output_neurons": 64,
      "activation": "relu",
      "precision": "int8",
      "parallelism_factor": 2
    }
  ]
}
```

---

### POST /api/estimate — Response Body

```json
{
  "total": {
    "luts": 14320,
    "ffs": 8960,
    "dsps": 48,
    "brams": 12,
    "latency_cycles": 18432,
    "latency_us": 92.16,
    "throughput_inf_per_sec": 10851,
    "macs": 4718592
  },
  "fpga_utilization": {
    "lut_pct": 20.3,
    "ff_pct": 6.3,
    "dsp_pct": 13.3,
    "bram_pct": 5.6
  },
  "layers": [
    {
      "name": "Conv2D-1",
      "type": "conv2d",
      "luts": 10240,
      "ffs": 6144,
      "dsps": 36,
      "brams": 8,
      "latency_cycles": 14336,
      "latency_us": 71.68,
      "macs": 4644864,
      "parameters": 320,
      "arithmetic_intensity": 12.4,
      "roofline_bound": "compute",
      "formula_used": {
        "dsps": "ceil(filters * channels * K^2 / parallelism) * dsps_per_mac",
        "luts": "dsps * lut_overhead_factor[precision]",
        "latency": "(output_h * output_w * filters * channels * K^2) / (parallelism * clock_mhz * 1e6)"
      }
    }
  ]
}
```

---

### Core Estimation Formulas

All formulas are implemented in `backend/engine/estimator.py`.

#### Conv2D Layer

```python
# Output dimensions
output_h = floor((input_h + 2*pad - kernel) / stride) + 1
output_w = floor((input_w + 2*pad - kernel) / stride) + 1

# MAC operations
macs = output_h * output_w * filters * in_channels * kernel^2

# DSP blocks (each MAC = 1 DSP; precision reduces sharing)
dsps_per_mac = {FP32: 3, INT8: 1, INT4: 0.5}
dsps = ceil(filters * in_channels * kernel^2 / parallelism) * dsps_per_mac[precision]

# LUTs (control, routing, activation logic overhead on top of DSPs)
lut_overhead = {FP32: 120, INT8: 40, INT4: 25}  # LUTs per DSP
luts = dsps * lut_overhead[precision] + activation_luts[activation]

# Flip-flops (pipeline registers)
ffs = luts * 0.6  # empirical approximation

# BRAMs (weight storage, 36Kb tiles)
weight_bits = filters * in_channels * kernel^2 * precision_bits[precision]
brams = ceil(weight_bits / 36864)

# Latency (pipelined)
latency_cycles = ceil(macs / (parallelism * 1)) + pipeline_depth_overhead
latency_us = latency_cycles / clock_mhz
```

#### Dense (FC) Layer

```python
# MAC operations
macs = input_neurons * output_neurons

# DSP blocks
dsps = ceil(output_neurons / parallelism) * dsps_per_mac[precision]

# LUTs
luts = dsps * lut_overhead[precision] + activation_luts[activation]

# FFs
ffs = luts * 0.6

# BRAMs (weight matrix storage)
weight_bits = input_neurons * output_neurons * precision_bits[precision]
brams = ceil(weight_bits / 36864)

# Latency (serial dot product per neuron group)
latency_cycles = ceil(input_neurons * output_neurons / parallelism)
latency_us = latency_cycles / clock_mhz
```

#### Precision Multipliers

| Precision | Bits | DSPs per MAC | LUT Overhead per DSP | BRAM Factor |
|---|---|---|---|---|
| FP32 | 32 | 3 | 120 | 4× |
| INT8 | 8 | 1 | 40 | 1× |
| INT4 | 4 | 0.5 | 25 | 0.5× |

#### Roofline Classification
```python
# Arithmetic Intensity (OPs/Byte)
arithmetic_intensity = (2 * macs) / (weight_bits / 8 + activation_bits / 8)

# Memory bandwidth roof: 25.6 GB/s (typical DDR4 on Zynq)
# Compute roof: FPGA_DSPs * 2 * clock_mhz (GOPs/s)
if arithmetic_intensity < compute_roof / memory_roof:
    bound = "memory"
else:
    bound = "compute"
```

---

## Data Models

### Layer Configuration (Frontend TypeScript)

```typescript
type Precision = 'fp32' | 'int8' | 'int4';
type Activation = 'relu' | 'sigmoid' | 'softmax' | 'none';
type LayerType = 'conv2d' | 'dense';

interface Conv2DLayer {
  id: string;
  type: 'conv2d';
  name: string;
  inputWidth: number;
  inputHeight: number;
  inputChannels: number;
  filters: number;
  kernelSize: number;
  stride: number;
  padding: 'same' | 'valid';
  activation: Activation;
  precision: Precision;
  parallelismFactor: number;
}

interface DenseLayer {
  id: string;
  type: 'dense';
  name: string;
  inputNeurons: number;
  outputNeurons: number;
  activation: Activation;
  precision: Precision;
  parallelismFactor: number;
}

type Layer = Conv2DLayer | DenseLayer;
```

### Estimation Result (Frontend TypeScript)

```typescript
interface LayerEstimate {
  name: string;
  type: LayerType;
  luts: number;
  ffs: number;
  dsps: number;
  brams: number;
  latencyCycles: number;
  latencyUs: number;
  macs: number;
  parameters: number;
  arithmeticIntensity: number;
  rooflineBound: 'compute' | 'memory';
  formulaUsed: Record<string, string>;
}

interface TotalEstimate {
  luts: number;
  ffs: number;
  dsps: number;
  brams: number;
  latencyCycles: number;
  latencyUs: number;
  throughputInfPerSec: number;
  macs: number;
}

interface FPGAUtilization {
  lutPct: number;
  ffPct: number;
  dspPct: number;
  bramPct: number;
}

interface EstimationResult {
  total: TotalEstimate;
  fpgaUtilization: FPGAUtilization;
  layers: LayerEstimate[];
}
```

### Saved Configuration (localStorage)

```typescript
interface SavedConfig {
  id: string;
  name: string;
  fpgaTarget: string;
  clockMhz: number;
  layers: Layer[];
  result: EstimationResult;
  savedAt: string; // ISO timestamp
}
```

### FPGA Target

```typescript
interface FPGATarget {
  id: string;
  name: string;
  family: string;
  luts: number;
  ffs: number;
  dsps: number;
  brams: number;
}
```

---

## Backend File Structure

```
backend/
├── main.py                    # FastAPI app entrypoint
├── requirements.txt
├── engine/
│   ├── __init__.py
│   ├── estimator.py           # Core resource estimation logic
│   ├── formulas.py            # All estimation formulas as pure functions
│   ├── fpga_targets.py        # FPGA target specs dictionary
│   └── roofline.py            # Roofline model classification
├── models/
│   ├── __init__.py
│   ├── layer.py               # Pydantic models for Conv2D, Dense
│   ├── request.py             # EstimateRequest Pydantic model
│   └── response.py            # EstimationResult Pydantic model
└── tests/
    ├── test_conv2d.py
    ├── test_dense.py
    └── test_endpoints.py
```

---

## Frontend File Structure

```
frontend/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── api/
│   │   └── estimator.ts       # API calls to FastAPI backend
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── ThemeToggle.tsx
│   │   ├── simulator/
│   │   │   ├── ResourceCard.tsx
│   │   │   ├── UtilizationGauge.tsx
│   │   │   ├── ResourceBreakdownChart.tsx
│   │   │   └── LatencyWaterfall.tsx
│   │   ├── builder/
│   │   │   ├── LayerForm.tsx
│   │   │   ├── Conv2DFields.tsx
│   │   │   ├── DenseFields.tsx
│   │   │   ├── ParallelismSlider.tsx
│   │   │   └── PrecisionComparator.tsx
│   │   ├── comparison/
│   │   │   ├── ComparisonTable.tsx
│   │   │   └── RadarChart.tsx
│   │   ├── analytics/
│   │   │   ├── RooflineChart.tsx
│   │   │   ├── EfficiencyScore.tsx
│   │   │   └── LayerStatsTable.tsx
│   │   └── shared/
│   │       ├── Badge.tsx
│   │       ├── ProgressBar.tsx
│   │       ├── Modal.tsx
│   │       └── Tooltip.tsx
│   ├── pages/
│   │   ├── SimulatorPage.tsx
│   │   ├── LayerBuilderPage.tsx
│   │   ├── ComparisonPage.tsx
│   │   ├── AnalyticsPage.tsx
│   │   └── AboutPage.tsx
│   ├── store/
│   │   ├── useSimulatorStore.ts   # Global state (Zustand or Context)
│   │   └── useThemeStore.ts
│   ├── utils/
│   │   ├── formatters.ts          # Number formatting helpers
│   │   ├── localStorage.ts        # Save/load config helpers
│   │   └── constants.ts           # FPGA targets, default values
│   └── types/
│       └── index.ts               # All TypeScript interfaces
```

---

## Core Functionalities

### Layer Management
- Add Conv2D and Dense layers to a stack
- Edit any layer's parameters inline
- Delete layers with confirmation
- Reorder layers via drag-and-drop (optional stretch goal)
- Auto-name layers with incrementing suffix (e.g., Conv2D-1, Conv2D-2)

### Resource Estimation
- On every change to the layer stack, POST to `/api/estimate`
- Show loading skeleton while awaiting response
- Display per-layer and total resource estimates
- Automatically update all charts and gauges

### Parallelism Tradeoff Exploration
- Parallelism slider updates estimation in real time (debounced 300ms)
- Show latency vs. LUT tradeoff numerically and visually
- Annotate if selected point is compute-bound or memory-bound

### Precision Comparison
- Three-column static comparison panel (FP32 / INT8 / INT4) for the current layer stack
- Trigger separate API calls for each precision level
- Highlight deltas vs. the currently selected precision

### Configuration Management
- Save current configuration snapshot with a user-defined name
- Load saved configs back into the simulator
- Delete saved configs
- Export current config as JSON file download
- Import config from JSON file upload

### Analytics
- Roofline model chart with per-layer data points
- Efficiency score calculation
- Per-layer statistics table with formula annotations

---

## UI / UX Requirements

### Color Scheme (Dark Mode Default)
- Background: `#0f172a` (slate-900)
- Surface: `#1e293b` (slate-800)
- Border: `#334155` (slate-700)
- Primary accent: `#6366f1` (indigo-500)
- Success: `#22c55e` (green-500)
- Warning: `#f59e0b` (amber-500)
- Danger: `#ef4444` (red-500)
- Text primary: `#f1f5f9` (slate-100)
- Text secondary: `#94a3b8` (slate-400)

### Light Mode Overrides
- Background: `#f8fafc`
- Surface: `#ffffff`
- Text primary: `#0f172a`

### Chart Colors
- Conv2D layers: `#6366f1` (indigo)
- Dense layers: `#14b8a6` (teal)
- LUT bars: `#6366f1`
- DSP bars: `#a855f7` (purple)
- BRAM bars: `#f59e0b`
- FF bars: `#22c55e`

### Responsive Behavior
- Desktop (≥1280px): Two-column layout — layer panel left, charts right
- Tablet (768–1279px): Single column, charts stack below panel
- Mobile (<768px): Single column, simplified view, charts remain scrollable

### Loading States
- Skeleton loaders on all cards and charts while estimating
- Spinner on estimate button during API call
- Debounce slider/form inputs at 300ms before triggering API call

### Error States
- Toast notification for API errors (red, bottom-right)
- Inline validation errors on form fields
- Fallback "N/A" display if estimation fails

---

## Default Layer Presets

Include a "Load Example" dropdown with the following preset architectures:

| Preset | Description | Layers |
|---|---|---|
| LeNet-5 (MNIST) | Classic small CNN | Conv2D(6, 5×5) → Conv2D(16, 5×5) → Dense(120) → Dense(84) → Dense(10) |
| MobileNet-Block | Depthwise separable block | Conv2D(32, 3×3) → Conv2D(64, 1×1) |
| Simple MLP | 3-layer fully connected | Dense(512) → Dense(256) → Dense(10) |
| Tiny YOLOv2 Block | Detection head approximation | Conv2D(64, 3×3) → Conv2D(128, 3×3) → Dense(256) |

---

## Features for MVP

- Simulator page with 4 resource summary cards
- Layer Builder with Conv2D and Dense forms
- Parallelism slider with live update
- Precision comparator (FP32 / INT8 / INT4)
- Layer-by-layer resource breakdown bar chart
- Latency waterfall chart
- FPGA utilization gauges
- FPGA target selector (5 targets)
- Save/load configurations to localStorage
- Export config as JSON
- Dark/light mode toggle
- FastAPI backend with `/api/estimate` endpoint
- Formula provenance panel on Analytics page

## Features to Exclude from MVP

- Real FPGA bitstream generation or synthesis
- Support for RNN / Transformer / Attention layers
- Custom dataflow architecture modeling (systolic arrays, etc.)
- Integration with Vivado HLS or Vitis AI
- User authentication or cloud sync
- Batch processing (multi-image inference)
- Power estimation (dynamic + static)
- Clock domain crossing analysis

---

## Performance Requirements

- API response time: < 200ms for stacks up to 20 layers
- Frontend re-render: < 100ms after receiving API response
- Handle up to 20 layers without degradation
- localStorage config limit: 10 saved configurations

---

## Validation Rules

### Conv2D Form
- Input width/height: integer, 1–4096
- Input channels: integer, 1–2048
- Filters: integer, 1–2048
- Kernel size: integer, 1–7 (odd values only: 1, 3, 5, 7)
- Stride: integer, 1–4
- Parallelism factor: must be power of 2, 1–16

### Dense Form
- Input neurons: integer, 1–65536
- Output neurons: integer, 1–65536
- Parallelism factor: must be power of 2, 1–16

### Global
- Clock MHz: integer, 50–1000
- Must have at least 1 layer before triggering estimation
- Layer name: max 32 characters, no special characters except hyphen and underscore

---

## Exact Dependency Files

### `backend/requirements.txt`
```
fastapi==0.111.0
uvicorn[standard]==0.29.0
numpy==1.26.4
pydantic==2.7.1
python-dotenv==1.0.1
```

### `frontend/package.json` — dependencies section
```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "recharts": "^2.12.7",
    "zustand": "^4.5.2",
    "axios": "^1.7.2",
    "lucide-react": "^0.383.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.3.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "typescript": "^5.4.5",
    "vite": "^5.2.13"
  }
}
```

---

## Environment Variables

### `backend/.env`
```
CORS_ORIGINS=http://localhost:5173,https://your-app.vercel.app
PORT=8000
```

### `frontend/.env`
```
VITE_API_URL=http://localhost:8000
```

### `frontend/.env.production`
```
VITE_API_URL=https://your-backend.railway.app
```

---

## FastAPI CORS Configuration

Add this to `backend/main.py` — **this is required or the frontend will get blocked**:

```python
# backend/main.py
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from routers import estimate, targets

load_dotenv()

app = FastAPI(
    title="FPGA-NN Accelerator Simulator API",
    version="1.0.0"
)

# CORS — must be added BEFORE any route registration
origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(estimate.router, prefix="/api")
app.include_router(targets.router, prefix="/api")

@app.get("/api/health")
def health():
    return {"status": "ok"}
```

---

## Axios API Client Setup

### `frontend/src/api/client.ts`
```typescript
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Global error handler
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);
```

### `frontend/src/api/estimator.ts`
```typescript
import { apiClient } from './client';
import type { EstimateRequest, EstimationResult, FPGATarget } from '../types';

export async function estimateLayers(payload: EstimateRequest): Promise<EstimationResult> {
  const { data } = await apiClient.post<EstimationResult>('/api/estimate', payload);
  return data;
}

export async function getFPGATargets(): Promise<FPGATarget[]> {
  const { data } = await apiClient.get<FPGATarget[]>('/api/fpga-targets');
  return data;
}
```

---

## Zustand Store Setup

### `frontend/src/store/useSimulatorStore.ts`

```typescript
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
            layers,
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
```

---

## Debounce Hook for Slider Inputs

### `frontend/src/hooks/useDebounce.ts`
```typescript
import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
```

**Use it in any slider component:**
```typescript
const [parallelism, setParallelism] = useState(1);
const debouncedParallelism = useDebounce(parallelism, 300);

useEffect(() => {
  updateLayer(layerId, { parallelismFactor: debouncedParallelism });
}, [debouncedParallelism]);
```

---

## Vite Configuration

### `frontend/vite.config.ts`
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy /api calls to backend during local development
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
```

---

## Tailwind CSS Configuration

### `frontend/tailwind.config.ts`
```typescript
import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',        // toggled by adding 'dark' class to <html>
  theme: {
    extend: {
      colors: {
        // Map to the design system tokens
        brand: {
          50:  '#eef2ff',
          500: '#6366f1',
          600: '#4f46e5',
          900: '#312e81',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
```

**Dark mode toggle — add/remove `dark` class on `<html>`:**
```typescript
// In ThemeToggle.tsx
const { darkMode, toggleDarkMode } = useSimulatorStore();
useEffect(() => {
  document.documentElement.classList.toggle('dark', darkMode);
}, [darkMode]);
```

---

## How to Run the Project

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# API available at: http://localhost:8000
# Docs at:          http://localhost:8000/docs
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# App available at: http://localhost:5173
```

### Production Build
```bash
# Frontend
cd frontend && npm run build     # outputs to dist/

# Backend — run with production settings
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 2
```

---

## Deployment Instructions

### Frontend → Vercel
1. Push `frontend/` to a GitHub repo
2. Import repo in Vercel dashboard
3. Set root directory to `frontend`
4. Add environment variable: `VITE_API_URL=https://your-backend.railway.app`
5. Deploy

### Backend → Railway
1. Push `backend/` to a GitHub repo (or same monorepo)
2. Create new Railway project → Deploy from GitHub
3. Set root directory to `backend`
4. Add environment variable: `CORS_ORIGINS=https://your-app.vercel.app`
5. Railway auto-detects `requirements.txt` and sets start command to `uvicorn main:app --host 0.0.0.0 --port $PORT`

---



Build a full-stack FPGA neural network resource estimation simulator with a FastAPI Python backend and a React/TypeScript frontend. The core value is enabling researchers and engineers to interactively explore the LUT/DSP/BRAM/latency tradeoffs of quantization, parallelism, and layer configuration for Conv2D and Dense layers — all without needing real FPGA hardware or synthesis tools. Focus on real-time interactive feedback, clean chart-driven UI, formula transparency, and research-quality documentation.