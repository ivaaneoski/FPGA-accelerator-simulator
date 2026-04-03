import math

PRECISION_BITS = {
    "fp32": 32,
    "int8": 8,
    "int4": 4
}

DSPS_PER_MAC = {
    "fp32": 3,
    "int8": 1,
    "int4": 0.5
}

LUT_OVERHEAD_PER_DSP = {
    "fp32": 120,
    "int8": 40,
    "int4": 25
}

MEMORY_BANDWIDTH_GBS = 25.6  # DDR4 on Zynq, GB/s

def compute_roofline_bound(macs: int, weight_bits: int, activation_bits: int, clock_mhz: int, dsps: int) -> dict:
    compute_roof_gops = (dsps * 2 * clock_mhz) / 1000
    data_bytes = (weight_bits + activation_bits) / 8
    arithmetic_intensity = (2 * macs) / data_bytes if data_bytes > 0 else 0.001
    arithmetic_intensity = max(arithmetic_intensity, 0.001)

    # memory roof is 25.6 GB/s, compute roof varying
    ridge_point = compute_roof_gops / MEMORY_BANDWIDTH_GBS if MEMORY_BANDWIDTH_GBS > 0 else 0
    bound = "compute" if arithmetic_intensity >= ridge_point else "memory"
    
    attainable_perf = min(arithmetic_intensity * MEMORY_BANDWIDTH_GBS, compute_roof_gops)
    attainable_perf = max(attainable_perf, 0.001)

    return {
        "arithmetic_intensity": round(arithmetic_intensity, 4),
        "attainable_performance_gops": round(attainable_perf, 4),
        "compute_roof_gops": round(compute_roof_gops, 4),
        "memory_roof_gbs": MEMORY_BANDWIDTH_GBS,
        "ridge_point": round(ridge_point, 4),
        "bound": bound
    }

def apply_parallelism_diminishing_returns(base_latency_cycles: int, parallelism: int, bound: str) -> int:
    if bound == "memory":
        # Memory-bound: sqrt scaling instead of linear â€” doubling parallelism gives ~1.4x speedup
        effective_speedup = parallelism ** 0.5
    else:
        # Compute-bound: linear scaling with 90% efficiency factor
        effective_speedup = parallelism * 0.90
    return max(1, int(base_latency_cycles / effective_speedup))

def estimate_brams(weight_bits: int, efficiency_factor: float = 0.7) -> int:
    if weight_bits <= 0:
        return 0
    # Very small weights (< 1 tile) still consume exactly 1 tile minimum
    raw = weight_bits / (36864 * efficiency_factor)
    return max(1, math.ceil(raw))

def _calc_output_dim(in_dim: int, pad_type: str, kernel: int, stride: int) -> int:
    if pad_type == 'same':
        return math.ceil(in_dim / stride)
    else: # 'valid'
        return math.floor((in_dim - kernel) / stride) + 1

def _calc_act_luts(base_luts: int, activation: str) -> int:
    act = activation.lower()
    if act == "relu": return int(base_luts * 0.05)
    elif act == "sigmoid": return int(base_luts * 0.15)
    elif act == "softmax": return int(base_luts * 0.20)
    return 0

def estimate_conv2d(input_w: int, input_h: int, input_channels: int, filters: int, kernel_size: int, 
                    stride: int, padding: str, activation: str, precision: str, 
                    parallelism_factor: int, clock_mhz: int = 200, **kwargs):
    
    out_w = _calc_output_dim(input_w, padding, kernel_size, stride)
    out_h = _calc_output_dim(input_h, padding, kernel_size, stride)
    
    macs = out_h * out_w * filters * input_channels * (kernel_size ** 2)
    mac_group = filters * input_channels * (kernel_size ** 2)
    parameters = mac_group
    
    dsps = max(1, math.ceil(mac_group / (16.0 / parallelism_factor)) * DSPS_PER_MAC[precision])
    
    base_luts = dsps * LUT_OVERHEAD_PER_DSP[precision]
    base_luts = base_luts * 1.20 # routing_overhead_factor
    base_luts += _calc_act_luts(base_luts, activation)
    luts = max(1, int(base_luts))
    
    ffs = max(1, int(luts * 0.6))
    
    weight_bits = parameters * PRECISION_BITS[precision]
    brams = estimate_brams(weight_bits)
    
    act_bits = out_h * out_w * filters * PRECISION_BITS[precision]
    
    roof = compute_roofline_bound(macs, weight_bits, act_bits, clock_mhz, dsps)
    bound = roof["bound"]
    
    # Latency (pipelined approximation)
    base_latency = math.ceil(macs / 1) + 20
    latency_cycles = apply_parallelism_diminishing_returns(base_latency, parallelism_factor, bound)
    latency_us = latency_cycles / clock_mhz
    
    eff_speedup = parallelism_factor ** 0.5 if bound == "memory" else parallelism_factor * 0.90
    
    return {
        "output_w": out_w,
        "output_h": out_h,
        "luts": luts,
        "ffs": ffs,
        "dsps": dsps,
        "brams": brams,
        "latency_cycles": latency_cycles,
        "latency_us": round(latency_us, 4),
        "macs": macs,
        "parameters": parameters,
        "confidence_margin": "Â\u00b120%",
        "arithmetic_intensity": roof["arithmetic_intensity"],
        "roofline_bound": bound,
        "effective_speedup": round(eff_speedup, 2),
        "formula_used": {
            "dsps": "ceil(filters * channels * K^2 / parallelism) * dsps_per_mac",
            "luts": "dsps * lut_overhead_factor[precision] * 1.2",
            "latency": "apply_parallelism_diminishing_returns(base_latency, parallelism)"
        }
    }

def estimate_dense(input_neurons: int, output_neurons: int, activation: str, precision: str,
                   parallelism_factor: int, clock_mhz: int = 200, **kwargs):
    
    macs = input_neurons * output_neurons
    parameters = macs
    
    dsps = max(1, math.ceil(output_neurons / (16.0 / parallelism_factor)) * DSPS_PER_MAC[precision])
    
    base_luts = dsps * LUT_OVERHEAD_PER_DSP[precision]
    base_luts = base_luts * 1.20 # routing overhead
    base_luts += _calc_act_luts(base_luts, activation)
    luts = max(1, int(base_luts))
    
    ffs = max(1, int(luts * 0.6))
    
    weight_bits = parameters * PRECISION_BITS[precision]
    brams = estimate_brams(weight_bits)
    
    act_bits = output_neurons * PRECISION_BITS[precision]
    
    roof = compute_roofline_bound(macs, weight_bits, act_bits, clock_mhz, dsps)
    bound = roof["bound"]
    
    base_latency = math.ceil(macs / 1)
    latency_cycles = apply_parallelism_diminishing_returns(base_latency, parallelism_factor, bound)
    latency_us = latency_cycles / clock_mhz
    
    eff_speedup = parallelism_factor ** 0.5 if bound == "memory" else parallelism_factor * 0.90
    
    return {
        "luts": luts,
        "ffs": ffs,
        "dsps": dsps,
        "brams": brams,
        "latency_cycles": latency_cycles,
        "latency_us": round(latency_us, 4),
        "macs": macs,
        "parameters": parameters,
        "confidence_margin": "Â\u00b120%",
        "arithmetic_intensity": roof["arithmetic_intensity"],
        "roofline_bound": bound,
        "effective_speedup": round(eff_speedup, 2),
        "formula_used": {
            "dsps": "ceil(output_neurons / parallelism) * dsps_per_mac",
            "luts": "dsps * lut_overhead_factor[precision] * 1.2",
            "latency": "apply_parallelism_diminishing_returns(base_latency, parallelism)"
        }
    }
