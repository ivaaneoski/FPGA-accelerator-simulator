from engine import formulas, roofline, fpga_targets
from models.layer import Conv2DLayer, DenseLayer

def estimate_pipeline(layers, target_id: str, clock_mhz: int):
    target = fpga_targets.get_target_by_id(target_id)
    if not target:
        raise ValueError(f"Unknown FPGA target {target_id}")

    # compute_roof (GOPs/s) = FPGA_DSPs * 2 * clock_mhz / 1000
    compute_roof = (target['dsps'] * 2 * clock_mhz) / 1000.0
    # memory_roof = 25.6 GB/s typical
    memory_roof = 25.6 

    total_luts = 0
    total_ffs = 0
    total_dsps = 0
    total_brams = 0
    total_cycles = 0
    total_macs = 0

    results_layers = []

    for layer in layers:
        l_dict = {
            "name": layer.name,
            "type": layer.type,
            "formula_used": {}
        }
        
        precision = layer.precision
        weight_bits = 0
        act_bits = 0

        if layer.type == 'conv2d':
            out_h = formulas.calc_output_dim(layer.input_width, layer.padding, layer.kernel_size, layer.stride)
            out_w = formulas.calc_output_dim(layer.input_height, layer.padding, layer.kernel_size, layer.stride)
            
            macs = formulas.calc_conv2d_macs(out_h, out_w, layer.filters, layer.input_channels, layer.kernel_size)
            
            mac_group = layer.filters * layer.input_channels * (layer.kernel_size ** 2)
            dsps = formulas.calc_dsps(mac_group, layer.parallelism_factor, precision)
            luts = formulas.calc_luts(dsps, precision, layer.activation)
            ffs = formulas.calc_ffs(luts)
            
            weight_bits = mac_group * formulas.PRECISION_BITS[precision]
            brams = formulas.calc_brams(weight_bits)
            
            act_bits = out_h * out_w * layer.filters * formulas.PRECISION_BITS[precision]
            
            lat_cycles, lat_us = formulas.calc_conv2d_latency(macs, layer.parallelism_factor, clock_mhz)
            
            params = mac_group
            
            l_dict["formula_used"] = {
                "dsps": "ceil(filters * channels * K^2 / parallelism) * dsps_per_mac",
                "luts": "dsps * lut_overhead_factor[precision]",
                "latency": "ceil(macs / parallelism) + pipeline_depth_overhead_cycles"
            }
            
        elif layer.type == 'dense':
            macs = formulas.calc_dense_macs(layer.input_neurons, layer.output_neurons)
            
            mac_group = layer.output_neurons
            dsps = formulas.calc_dsps(mac_group, layer.parallelism_factor, precision)
            luts = formulas.calc_luts(dsps, precision, layer.activation)
            ffs = formulas.calc_ffs(luts)
            
            weight_bits = layer.input_neurons * layer.output_neurons * formulas.PRECISION_BITS[precision]
            brams = formulas.calc_brams(weight_bits)
            
            act_bits = layer.output_neurons * formulas.PRECISION_BITS[precision]
            
            lat_cycles, lat_us = formulas.calc_dense_latency(layer.input_neurons, layer.output_neurons, layer.parallelism_factor, clock_mhz)
            
            params = layer.input_neurons * layer.output_neurons

            l_dict["formula_used"] = {
                "dsps": "ceil(output_neurons / parallelism) * dsps_per_mac",
                "luts": "dsps * lut_overhead_factor[precision]",
                "latency": "ceil(input_neurons * output_neurons / parallelism)"
            }

        else:
            raise ValueError(f"Unknown layer type {layer.type}")

        ai, bound = roofline.classify_roofline(macs, weight_bits, act_bits, compute_roof, memory_roof)

        l_dict.update({
            "luts": int(luts),
            "ffs": int(ffs),
            "dsps": int(dsps),
            "brams": int(brams),
            "latency_cycles": int(lat_cycles),
            "latency_us": float(lat_us),
            "macs": int(macs),
            "parameters": int(params),
            "arithmetic_intensity": float(ai),
            "roofline_bound": bound,
        })
        
        results_layers.append(l_dict)
        
        total_luts += int(luts)
        total_ffs += int(ffs)
        total_dsps += int(dsps)
        total_brams += int(brams)
        total_cycles += int(lat_cycles)
        total_macs += int(macs)

    total_latency_us = total_cycles / clock_mhz if clock_mhz > 0 else 0
    throughput = (1.0 / (total_latency_us / 1e6)) if total_latency_us > 0 else 0

    return {
        "total": {
            "luts": total_luts,
            "ffs": total_ffs,
            "dsps": total_dsps,
            "brams": total_brams,
            "latency_cycles": total_cycles,
            "latency_us": total_latency_us,
            "throughput_inf_per_sec": int(throughput),
            "macs": total_macs
        },
        "fpga_utilization": {
            "lut_pct": round((total_luts / target['luts']) * 100, 1) if target['luts'] else 0,
            "ff_pct": round((total_ffs / target['ffs']) * 100, 1) if target['ffs'] else 0,
            "dsp_pct": round((total_dsps / target['dsps']) * 100, 1) if target['dsps'] else 0,
            "bram_pct": round((total_brams / target['brams']) * 100, 1) if target['brams'] else 0,
        },
        "layers": results_layers
    }
