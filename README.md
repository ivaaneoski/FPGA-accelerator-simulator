# FPGA-NN Accelerator Simulator

![License](https://img.shields.io/github/license/ivaaneoski/FPGA-accelerator-simulator)

A full-stack web application that simulates neural network inference on FPGA hardware. Estimate resource utilization (LUTs, FFs, DSPs, BRAMs), latency, throughput, and roofline performance bounds **before** committing to time-consuming RTL synthesis. Built for ML hardware researchers, students, and FPGA engineers.

> **This is a simulation tool.** It does not generate synthesizable RTL code or interface with physical FPGA hardware.

## Table of Contents

- [Demo](#demo)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Features](#features)
- [Supported FPGA Targets](#supported-fpga-targets)
- [Resource Estimation Methodology](#resource-estimation-methodology)
- [API Reference](#api-reference)
- [Installation](#installation)
- [Running the Simulator](#running-the-simulator)
- [Testing](#testing)
- [Academic References](#academic-references)
- [License](#license)

---

## Technology Stack

### Backend
- **Python 3.11+**
- **FastAPI** — REST API framework
- **Pydantic** — request/response validation
- **Uvicorn** — ASGI server
- **NumPy** — numerical computation
- **ONNX** — model parsing and shape inference for import workflow

### Frontend
- **React 18** with **TypeScript 5**
- **Vite 5** — build tool & dev server
- **Tailwind CSS 3** — styling
- **Recharts** — data visualization
- **Zustand** — state management
- **Axios** — HTTP client
- **React Router 6** — client-side routing

## Architecture

```
┌──────────────────────────────────────────────────────┐
│  Frontend (React + Vite :5173)                        │
│  ┌──────────┐ ┌───────────┐ ┌────────────┐           │
│  │ Simulator │ │ Dashboard │ │ Comparisons │          │
│  │  Page    │ │  Page     │ │   Page      │          │
│  └──────────┘ └───────────┘ └────────────┘           │
│         │              │              │               │
│  ┌──────┴──────────────┴──────────────┴───────┐       │
│  │              Zustand Store                 │       │
│  └──────────────────────┬─────────────────────┘       │
│                         │  Axios                      │
└─────────────────────────┼─────────────────────────────┘
                          │  /api/*
┌─────────────────────────┼─────────────────────────────┐
│  Backend (FastAPI :8000) │                             │
│  ┌───────────────────────┴──────────────────┐         │
│  │  Routers: /api/estimate, /api/fpga-targets, │      │
│  │           /api/import-onnx                 │      │
│  └───────────────────────┬──────────────────┘         │
│  ┌───────────────────────┴──────────────────┐         │
│  │  Engine: formulas, estimator, roofline   │         │
│  └───────────────────────┬──────────────────┘         │
│  ┌───────────────────────┴──────────────────┐         │
│  │  Models: Conv2D, Dense, EstimationResult │         │
│  └──────────────────────────────────────────┘         │
└──────────────────────────────────────────────────────┘
```

### Directory Structure

```
├── backend/
│   ├── main.py                    # FastAPI application entry
│   ├── requirements.txt           # Python dependencies
│   ├── engine/
│   │   ├── estimator.py           # Pipeline coordinator — iterates layers, aggregates results
│   │   ├── formulas.py            # Core math: DSP/LUT/FF/BRAM estimation, roofline analysis
│   │   ├── roofline.py            # Arithmetic intensity classification
│   │   ├── fpga_targets.py        # FPGA target hardware specs database
│   │   └── onnx_parser.py         # ONNX graph parsing into simulator layers
│   ├── models/
│   │   ├── layer.py               # Conv2DLayer, DenseLayer Pydantic models
│   │   ├── request.py             # EstimateRequest
│   │   └── response.py            # EstimationResult, LayerEstimate, etc.
│   ├── routers/
│   │   ├── estimate.py            # POST /api/estimate
│   │   ├── onnx_import.py         # POST /api/import-onnx
│   │   └── targets.py             # GET /api/fpga-targets
│   └── tests/
│       ├── test_formulas.py       # Unit tests for estimation formulas
│       ├── test_endpoints.py      # Integration tests for API endpoints
│       └── test_onnx_import.py    # ONNX parser and import endpoint tests
├── frontend/
│   ├── src/
│   │   ├── api/                   # Axios API client
│   │   ├── components/layout/     # Sidebar, navigation shell
│   │   ├── pages/                 # Main page views
│   │   ├── store/                 # Zustand state
│   │   ├── themes/                # Tailwind/theme config
│   │   └── types/                 # TypeScript type definitions
│   ├── vite.config.ts             # Vite config (includes /api → :8000 proxy)
│   ├── tailwind.config.ts
│   └── package.json
└── run.py                         # Convenience script — starts both servers
```

## Features

- **Interactive Layer Builder** — Add Conv2D and Dense layers with configurable dimensions, precision (FP32/INT8/INT4), activation functions, and parallelism factors
- **ONNX Model Import** — Upload `.onnx` models and auto-populate supported Conv and Dense layers in the builder
- **Real-Time Estimation** — Resource usage recalculated on every change
- **Per-Layer Breakdown** — See LUT, DSP, BRAM, FF consumption per layer with contribution charts
- **Latency Waterfall** — Stacked bar visualization of per-layer latency contributions
- **FPGA Utilization Gauges** — Percentage-based gauges against each target device's limits
- **Roofline Model Analysis** — Classify each layer as compute-bound or memory-bound via arithmetic intensity
- **Multi-Configuration Comparison** — Save and compare different design iterations (e.g., INT8 + parallelism 4 vs INT4 + parallelism 8)
- **5 Pre-Defined FPGA Targets** — from Artix-7 35T (entry-level) to Virtex UltraScale+ VU9P (datacenter-class)
- **Skipped-Operator Warnings** — Unsupported ONNX operators are reported in the UI instead of failing the full import

### ONNX Import Support

The ONNX importer currently converts these compute operators into simulator layers:

- `Conv` → `conv2d`
- `Gemm` → `dense`
- `MatMul` → `dense`

The importer also folds adjacent activation operators into the preceding layer when possible:

- `Relu`
- `Sigmoid`
- `Softmax`

These operators are currently skipped and surfaced as warnings in the Layer Builder:

- `GlobalAveragePool`
- `MaxPool`
- `AvgPool`
- `BatchNormalization`
- `Flatten`
- `Reshape`

Current import defaults and assumptions:

- Imported layers default to `int8` precision and `parallelism_factor: 4`
- Dynamic or unknown spatial dimensions fall back to `28x28`
- The uploaded model name is shown in the builder when available from the ONNX graph
- Unsupported operators are skipped rather than blocking import of the supported layers

## Supported FPGA Targets

| Device | Family | LUTs | FFs | DSPs | BRAMs |
|--------|--------|------|-----|------|-------|
| Artix-7 35T | Artix-7 | 20,800 | 41,600 | 90 | 50 |
| Zynq-7020 | Zynq-7000 | 53,200 | 106,400 | 220 | 140 |
| Zynq UltraScale+ ZU3EG | UltraScale+ | 70,560 | 141,120 | 360 | 216 |
| Kria KV260 | UltraScale+ | 117,120 | 234,240 | 1,248 | 144 |
| Virtex UltraScale+ VU9P | UltraScale+ | 1,182,240 | 2,364,480 | 6,840 | 2,160 |

These are approximate values, for actual values please refer to the official documentation of the FPGA.


## Resource Estimation Methodology

### Precision Multipliers
Different data types consume different numbers of DSP slices and BRAM tiles per MAC operation:

| Precision | Bits | DSPs per MAC | BRAM Factor | LUT Overhead per DSP |
|-----------|------|--------------|-------------|----------------------|
| FP32 | 32 | 3.0 | 4.0x | 120 |
| INT8 | 8 | 1.0 | 1.0x | 40 |
| INT4 | 4 | 0.5 | 0.5x | 25 |

### Conv2D Estimation

- **Output dimensions**: `ceil(input / stride)` (same padding) or `floor((input - kernel) / stride) + 1` (valid padding)
- **MACs**: `output_h * output_w * filters * input_channels * kernel_size^2`
- **DSPs**: `ceil(MAC_group / parallelism) * DSPs_per_MAC[precision]`
- **LUTs**: `DSPs * LUT_overhead[precision] * 1.20 + activation_luts`
- **FFs**: `LUTs * 0.6`
- **BRAMs**: `ceil(weight_bits / (36864 * 0.7))` (minimum 1 tile, 36Kb per block)
- **Latency**: `base_cycles / effective_speedup + pipeline_overhead`

Where `effective_speedup` depends on the roofline classification:
- **Compute-bound**: `parallelism * 0.90` (linear scaling at 90% efficiency)
- **Memory-bound**: `sqrt(parallelism)` (diminishing returns due to bandwidth limits)

### Dense Estimation

- **MACs**: `input_neurons * output_neurons`
- **DSPs**: `ceil(output_neurons / parallelism) * DSPs_per_MAC[precision]`
- LUTs, FFs, BRAMs, latency follow the same formulas as Conv2D

### Activation Function Overhead

Added on top of base LUT count:
- **ReLU**: +5%
- **Sigmoid**: +15%
- **Softmax**: +20%

### Roofline Model

The simulator computes arithmetic intensity (operations per byte of memory access) for each layer:

```
AI = (2 * MACs) / (weight_bytes + activation_bytes)
```

Comparing against the hardware's **compute roof** (DSP GOPS) and **memory roof** (25.6 GB/s DDR4 bandwidth):

```
ridge_point = compute_roof / memory_roof
bound = "compute" if AI >= ridge_point else "memory"
```

A layer above the ridge point is compute-bound; below it is memory-bound. This classification determines how parallelism affects effective speedup.

### Confidence Margin

All estimates carry an approximate **±20%** confidence margin. The models are simplified academic approximations and should not be expected to match post-synthesis Place-and-Route results precisely. Use them for relative comparisons between configurations.

## API Reference

### `GET /api/health`

Check if the backend is running.

**Response:**
```json
{ "status": "ok" }
```

### `GET /api/fpga-targets`

List all available FPGA target devices with their resource specifications.

**Response:**
```json
[
  {
    "id": "zynq_7020",
    "name": "Zynq-7020",
    "family": "Zynq-7000",
    "luts": 53200,
    "ffs": 106400,
    "dsps": 220,
    "brams": 140
  }
]
```

### `POST /api/estimate`

Submit a neural network layer pipeline for hardware resource estimation.

**Request Body:**
```json
{
  "fpga_target": "zynq_7020",
  "clock_mhz": 200,
  "layers": [
    {
      "name": "conv1",
      "type": "conv2d",
      "input_width": 224,
      "input_height": 224,
      "input_channels": 3,
      "filters": 64,
      "kernel_size": 3,
      "stride": 1,
      "padding": "same",
      "activation": "relu",
      "precision": "int8",
      "parallelism_factor": 4
    },
    {
      "name": "fc1",
      "type": "dense",
      "input_neurons": 256,
      "output_neurons": 10,
      "activation": "softmax",
      "precision": "int8",
      "parallelism_factor": 4
    }
  ]
}
```



**Conv2DLayer Fields:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | Yes | 1–32 chars, `[a-zA-Z0-9_-]` |
| `type` | string | Yes | `"conv2d"` |
| `input_width` | integer | Yes | 1–4096 |
| `input_height` | integer | Yes | 1–4096 |
| `input_channels` | integer | Yes | 1–2048 |
| `filters` | integer | Yes | 1–2048 |
| `kernel_size` | integer | Yes | 1–7 |
| `stride` | integer | Yes | 1–4 |
| `padding` | string | No | `"same"` (default) or `"valid"` |
| `activation` | string | No | `"relu"` (default), `"sigmoid"`, `"softmax"`, `"none"` |
| `precision` | string | No | `"fp32"`, `"int8"` (default), `"int4"` |
| `parallelism_factor` | integer | Yes | 1–16, must be power of 2 |

**DenseLayer Fields:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | Yes | 1–32 chars, `[a-zA-Z0-9_-]` |
| `type` | string | Yes | `"dense"` |
| `input_neurons` | integer | Yes | 1–65536 |
| `output_neurons` | integer | Yes | 1–65536 |
| `activation` | string | No | `"relu"`, `"sigmoid"`, `"softmax"`, `"none"` |
| `precision` | string | No | `"fp32"`, `"int8"`, `"int4"` |
| `parallelism_factor` | integer | Yes | 1–16, power of 2 |

**Response (200):**
```json
{
  "total": {
    "luts": 12500,
    "ffs": 7500,
    "dsps": 312,
    "brams": 8,
    "latency_cycles": 4500000,
    "latency_us": 22500.0,
    "throughput_inf_per_sec": 44,
    "macs": 90070016
  },
  "fpga_utilization": {
    "lut_pct": 23.5,
    "ff_pct": 7.0,
    "dsp_pct": 141.8,
    "bram_pct": 5.7
  },
  "layers": [
    {
      "name": "conv1",
      "type": "conv2d",
      "luts": 12000,
      "ffs": 7200,
      "dsps": 300,
      "brams": 7,
      "latency_cycles": 4200000,
      "latency_us": 21000.0,
      "macs": 90065920,
      "parameters": 1728,
      "arithmetic_intensity": 12.8,
      "roofline_bound": "compute",
      "effective_speedup": 3.6,
      "confidence_margin": "±20%",
      "formula_used": {
        "dsps": "ceil(filters * channels * K^2 / parallelism) * dsps_per_mac",
        "luts": "dsps * lut_overhead_factor[precision] * 1.2",
        "latency": "apply_parallelism_diminishing_returns(base_latency, parallelism)"
      }
    },
    {
      "name": "fc1",
      "type": "dense",
      "luts": 500,
      "ffs": 300,
      "dsps": 12,
      "brams": 1,
      "latency_cycles": 300000,
      "latency_us": 1500.0,
      "macs": 2560,
      "parameters": 2560,
      "arithmetic_intensity": 128.0,
      "roofline_bound": "compute",
      "effective_speedup": 3.6,
      "confidence_margin": "±20%",
      "formula_used": {
        "dsps": "ceil(output_neurons / parallelism) * dsps_per_mac",
        "luts": "dsps * lut_overhead_factor[precision] * 1.2",
        "latency": "apply_parallelism_diminishing_returns(base_latency, parallelism)"
      }
    }
  ]
}
```

**Error Responses:**

| Status | Condition |
|--------|-----------|
| 404 | Unknown FPGA target ID |
| 422 | Invalid layer parameters or malformed request |
| 500 | Internal estimation error |

### `POST /api/import-onnx`

Upload an ONNX model and convert supported layers into the simulator's layer schema.

**Request:**

- `multipart/form-data`
- Form field: `file`
- Accepted file type: `.onnx`

**Response (200):**
```json
{
  "layers": [
    {
      "name": "Conv1",
      "type": "conv2d",
      "input_width": 28,
      "input_height": 28,
      "input_channels": 3,
      "filters": 16,
      "kernel_size": 3,
      "stride": 1,
      "padding": "valid",
      "activation": "relu",
      "precision": "int8",
      "parallelism_factor": 4
    }
  ],
  "skipped_ops": ["BatchNormalization", "MaxPool"],
  "model_name": "example_model"
}
```

**Error Responses:**

| Status | Condition |
|--------|-----------|
| 422 | Invalid file type, unreadable upload, or ONNX parsing error |
| 500 | Unexpected ONNX import failure |

## Installation

### Prerequisites

- Python 3.11 or higher
- Node.js 18.x or higher
- npm or yarn

### Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate       # Linux/macOS
venv\Scripts\activate          # Windows

# Install dependencies
pip install -r requirements.txt
```

**requirements.txt:**
```
fastapi==0.111.0
uvicorn[standard]==0.29.0
numpy==1.26.4
pydantic==2.7.1
python-dotenv==1.0.1
onnx>=1.15.0
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install
```

## Running the Simulator

### Quick Start (both servers at once)

```bash
python run.py
```

This starts the backend on `http://localhost:8000` and the frontend on `http://localhost:5173` concurrently. The Vite dev server proxies `/api/*` requests to the FastAPI backend automatically.

### Manual Start

```bash
# Terminal 1 — Backend
cd backend
uvicorn main:app --host 127.0.0.1 --port 8000 --reload

# Terminal 2 — Frontend
cd frontend
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- API Docs (Swagger): http://localhost:8000/docs

## Testing

```bash
cd backend
python -m pytest tests/ -v
```

Covers:
- `test_formulas.py` — unit tests for Conv2D and Dense estimation logic
- `test_endpoints.py` — integration tests for API routes
- `test_onnx_import.py` — parser and `/api/import-onnx` coverage for valid models, schema compatibility, and skipped unsupported ops

## Academic References

The estimation models are derived from the following publications:

- Sze, V., et al. (2017). *"Efficient Processing of Deep Neural Networks: A Tutorial and Survey."* Proceedings of the IEEE.
- Xilinx. *"UltraScale Architecture DSP Slice User Guide (UG579)."*
- Umuroglu, Y., et al. (2017). *"FINN: A Framework for Fast, Scalable Binarized Neural Network Inference."* FPGA '17.
- Blott, M., et al. (2018). *"FINN-R: An End-to-End Deep-Learning Framework for Fast Exploration of Quantized Neural Networks."* ACM TRETS.

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
