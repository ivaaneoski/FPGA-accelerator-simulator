from pydantic import BaseModel
from typing import List, Dict, Any

class TotalEstimate(BaseModel):
    luts: int
    ffs: int
    dsps: int
    brams: int
    latency_cycles: int
    latency_us: float
    throughput_inf_per_sec: float
    macs: int

class FPGAUtilization(BaseModel):
    lut_pct: float
    ff_pct: float
    dsp_pct: float
    bram_pct: float

class LayerEstimate(BaseModel):
    name: str
    type: str
    luts: int
    ffs: int
    dsps: int
    brams: int
    latency_cycles: int
    latency_us: float
    macs: int
    parameters: int
    arithmetic_intensity: float
    roofline_bound: str
    formula_used: Dict[str, str]

class EstimationResult(BaseModel):
    total: TotalEstimate
    fpga_utilization: FPGAUtilization
    layers: List[LayerEstimate]
