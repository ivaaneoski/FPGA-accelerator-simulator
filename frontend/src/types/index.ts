export type Precision = 'fp32' | 'int8' | 'int4';
export type Activation = 'relu' | 'sigmoid' | 'softmax' | 'none';
export type LayerType = 'conv2d' | 'dense';

export interface Conv2DLayer {
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

export interface DenseLayer {
  id: string;
  type: 'dense';
  name: string;
  inputNeurons: number;
  outputNeurons: number;
  activation: Activation;
  precision: Precision;
  parallelismFactor: number;
}

export type Layer = Conv2DLayer | DenseLayer;

export interface LayerEstimate {
  name: string;
  type: LayerType;
  luts: number;
  ffs: number;
  dsps: number;
  brams: number;
  latency_cycles: number;
  latency_us: number;
  macs: number;
  parameters: number;
  arithmetic_intensity: number;
  roofline_bound: 'compute' | 'memory';
  effective_speedup: number;
  confidence_margin: string;
  formula_used: Record<string, string>;
}

export interface TotalEstimate {
  luts: number;
  ffs: number;
  dsps: number;
  brams: number;
  latency_cycles: number;
  latency_us: number;
  throughput_inf_per_sec: number;
  macs: number;
}

export interface FPGAUtilization {
  lut_pct: number;
  ff_pct: number;
  dsp_pct: number;
  bram_pct: number;
}

export interface EstimationResult {
  total: TotalEstimate;
  fpga_utilization: FPGAUtilization;
  layers: LayerEstimate[];
}

export interface SavedConfig {
  id: string;
  name: string;
  fpgaTarget: string;
  clockMhz: number;
  layers: Layer[];
  result: EstimationResult;
  savedAt: string; // ISO timestamp
}

export interface ExportedConfig {
  version: 1;
  appName: 'fpga-nn-simulator';
  exportedAt: string;
  configs: SavedConfig[];
}

export interface FPGATarget {
  id: string;
  name: string;
  family: string;
  luts: number;
  ffs: number;
  dsps: number;
  brams: number;
}

export interface EstimateRequest {
  fpga_target: string;
  clock_mhz: number;
  layers: any[]; // Using any to simplify mapping Layer objects directly
}

export interface OnnxImportResponse {
  layers: any[]; // snake_case layer dicts from backend
  skipped_ops: string[];
  model_name: string;
}

