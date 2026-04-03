# FPGA-NN Accelerator Simulator

A sophisticated simulation environment designed for ML hardware researchers, students, and FPGA engineers. This tool enables the exploration of architectural design decisions for neural network acceleration on FPGA hardware before committing to time-consuming RTL synthesis. It provides detailed estimations for resource utilization, latency, and throughput across various FPGA targets.

## Project Overview

The FPGA-NN Accelerator Simulator is a full-stack web application that maps neural network layers (Conv2D, Dense) to theoretical FPGA hardware resources. It implements simplified academic and manufacturer-specific resource estimation models to predict LUT, FF, DSP, and BRAM consumption.

Note: This is a simulation-only tool. It does not interface with physical FPGA hardware or generate synthesizable RTL code.

## Technology Stack

### Backend
- Python 3.11+
- FastAPI (REST API)
- NumPy (Mathematical computations)
- Pydantic (Data validation)
- Uvicorn (ASGI server)

### Frontend
- React 18
- TypeScript 5
- Vite 5
- Tailwind CSS 3.4+
- Recharts (Interactive visualization)
- Zustand (State management)
- Axios (API communication)

## Key Features

- Interactive Simulator: Real-time calculation of resource usage as layers are added or modified.
- Layer Builder: Comprehensive configuration for Conv2D and Dense layers, including precision (FP32, INT8, INT4) and parallelism factors.
- Resource Breakdown: Visualizations for LUT, DSP, and BRAM usage per layer and globally.
- Latency Waterfall: Stacked bar charts showing individual layer contributions to total inference time.
- Utilization Gauges: Clear visual representation of how close the design is to specific FPGA limits.
- Roofline Model: Analysis of arithmetic intensity vs. performance to identify compute-bound or memory-bound layers.
- Multi-Config Comparison: Save and compare multiple design iterations (precision vs. parallelism vs. area).

## Project Structure

### Backend Architecture
```text
backend/
├── main.py                    # FastAPI application entrypoint
├── requirements.txt           # Python dependencies
├── engine/                    # Core estimation logic
│   ├── estimator.py           # Resource estimation coordinator
│   ├── formulas.py            # Mathematical estimation functions
│   ├── fpga_targets.py        # Database of FPGA hardware specifications
│   └── roofline.py            # Performance classification logic
├── models/                    # Pydantic data models
└── routers/                   # API endpoint definitions
```

### Frontend Architecture
```text
frontend/
├── src/
│   ├── api/                   # Axios-based service layers
│   ├── components/            # Reusable UI components and charts
│   ├── pages/                 # Main application views
│   ├── store/                 # Zustand global state management
│   ├── themes/                # Tailwind styling configurations
│   └── types/                 # TypeScript interface definitions
```

## Resource Estimation Methodology

The simulator uses validated models to estimate hardware requirements based on layer parameters and hardware targets.

### Conv2D Resources
- DSP blocks: Determined by the number of MAC operations and the precision-dependent multiplier factor.
- LUTs: Calculated as a combination of control logic overhead (tied to DSP count) and activation function implementation.
- BRAMs: Estimated based on weight bit-depth (precision) and total parameter count relative to 36Kb tiles.
- Latency: Modeled as a pipelined process where clock cycles = macs / parallelism + pipeline overhead.

### Precision Multipliers
The following multipliers are applied based on data precision:

| Precision | Bits | DSPs per MAC | BRAM Factor |
|-----------|------|--------------|-------------|
| FP32      | 32   | 3.0          | 4.0x        |
| INT8      | 8    | 1.0          | 1.0x        |
| INT4      | 4    | 0.5          | 0.5x        |

## Supported FPGA Target Devices

The system includes pre-defined specifications for several common FPGA devices:

| Device                          | Family        | LUTs      | DSPs  | BRAMs |
|---------------------------------|---------------|-----------|-------|-------|
| Zynq-7020                       | Zynq-7000     | 53,200    | 220   | 140   |
| Zynq UltraScale+ ZU3EG          | UltraScale+   | 70,560    | 360   | 216   |
| Artix-7 35T                     | Artix-7       | 20,800    | 90    | 50    |
| Virtex UltraScale+ VU9P         | UltraScale+   | 1,182,240 | 6,840 | 2,160 |
| Kria KV260                      | UltraScale+   | 117,120   | 1,248 | 144   |

## Installation and Setup

### Prerequisites
- Python 3.11 or higher
- Node.js 18.x or higher
- npm or yarn

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the server:
   ```bash
   python main.py
   ```
   The backend will be available at `http://localhost:8000`.

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`.

## Academic References

The estimation models are derived from the following publications:
- Sze, V., et al. (2017). "Efficient Processing of Deep Neural Networks: A Tutorial and Survey." Proceedings of the IEEE.
- Xilinx. "UltraScale Architecture DSP Slice User Guide (UG579)."
- Umuroglu, Y., et al. (2017). "FINN: A Framework for Fast, Scalable Binarized Neural Network Inference." FPGA '17.
- Blott, M., et al. (2018). "FINN-R: An End-to-End Deep-Learning Framework for Fast Exploration of Quantized Neural Networks." ACM TRETS.

## License

This project is intended for research and educational purposes. Refer to the source files for specific license details.
