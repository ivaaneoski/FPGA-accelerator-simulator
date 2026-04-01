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

def calc_output_dim(in_dim, pad_type, kernel, stride):
    pad = 0
    if pad_type == 'same':
        # simplification: same padding keeps dim same if stride=1, else ceil division
        return math.ceil(in_dim / stride)
    else: # 'valid'
        return math.floor((in_dim - kernel) / stride) + 1

def calc_conv2d_macs(out_h, out_w, filters, in_channels, kernel):
    return out_h * out_w * filters * in_channels * (kernel ** 2)

def calc_dense_macs(in_neurons, out_neurons):
    return in_neurons * out_neurons

def calc_dsps(mac_group, parallelism, precision):
    # mac_group is filters*in_channels*k^2 for Conv2D, or output_neurons for Dense
    # parallelism unrolls the filter/output dimensions
    return math.ceil(mac_group / parallelism) * DSPS_PER_MAC[precision]

def calc_luts(dsps, precision, activation):
    act_luts = 0
    if activation == 'relu':
        act_luts = 20
    elif activation in ['sigmoid', 'softmax']:
        act_luts = 100
    
    return dsps * LUT_OVERHEAD_PER_DSP[precision] + act_luts

def calc_ffs(luts):
    return luts * 0.6

def calc_brams(weight_bits):
    return math.ceil(weight_bits / 36864)

def calc_conv2d_latency(macs, parallelism, clock_mhz):
    # Pipelined latency approximation
    latency_cycles = math.ceil(macs / parallelism) + 20 # pipeline_depth_overhead
    latency_us = latency_cycles / clock_mhz
    return latency_cycles, latency_us

def calc_dense_latency(in_neurons, out_neurons, parallelism, clock_mhz):
    latency_cycles = math.ceil((in_neurons * out_neurons) / parallelism)
    latency_us = latency_cycles / clock_mhz
    return latency_cycles, latency_us
