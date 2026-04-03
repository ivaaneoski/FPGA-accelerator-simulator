from engine import formulas, fpga_targets
from models.layer import Conv2DLayer, DenseLayer

def estimate_pipeline(layers, target_id: str, clock_mhz: int):
    target = fpga_targets.get_target_by_id(target_id)
    if not target:
        raise ValueError(f"Unknown FPGA target {target_id}")

    total_luts = 0
    total_ffs = 0
    total_dsps = 0
    total_brams = 0
    total_cycles = 0
    total_macs = 0

    results_layers = []

    for layer in layers:
        layer_dict = layer.dict()
        layer_type = layer_dict.pop("type")
        layer_name = layer_dict.pop("name")
        layer_id = layer_dict.pop("id", None) # if id was passed
        
        if layer_type == 'conv2d':
            # map keys
            # layer has input_width, input_height, input_channels, filters, kernel_size, stride, padding, activation, precision, parallelism_factor
            est = formulas.estimate_conv2d(
                input_w=layer.input_width, 
                input_h=layer.input_height, 
                input_channels=layer.input_channels, 
                filters=layer.filters, 
                kernel_size=layer.kernel_size, 
                stride=layer.stride, 
                padding=layer.padding, 
                activation=layer.activation, 
                precision=layer.precision, 
                parallelism_factor=layer.parallelism_factor, 
                clock_mhz=clock_mhz
            )
        elif layer_type == 'dense':
            est = formulas.estimate_dense(
                input_neurons=layer.input_neurons,
                output_neurons=layer.output_neurons,
                activation=layer.activation,
                precision=layer.precision,
                parallelism_factor=layer.parallelism_factor,
                clock_mhz=clock_mhz
            )
        else:
            raise ValueError(f"Unknown layer type {layer_type}")

        l_dict = {
            "name": layer_name,
            "type": layer_type,
            **est
        }
        
        results_layers.append(l_dict)
        
        total_luts += est["luts"]
        total_ffs += est["ffs"]
        total_dsps += est["dsps"]
        total_brams += est["brams"]
        total_cycles += est["latency_cycles"]
        total_macs += est["macs"]

    total_latency_us = total_cycles / clock_mhz if clock_mhz > 0 else 0
    throughput = (1.0 / (total_latency_us / 1e6)) if total_latency_us > 0 else 0

    return {
        "total": {
            "luts": total_luts,
            "ffs": total_ffs,
            "dsps": total_dsps,
            "brams": total_brams,
            "latency_cycles": total_cycles,
            "latency_us": round(total_latency_us, 4),
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
