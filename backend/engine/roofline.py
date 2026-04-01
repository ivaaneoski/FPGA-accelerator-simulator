def classify_roofline(macs, weight_bits, activation_bits, compute_roof, memory_roof):
    # Arithmetic Intensity (OPs/Byte)
    # 2 ops per MAC (multiply and add)
    bytes_accessed = (weight_bits / 8) + (activation_bits / 8)
    if bytes_accessed == 0:
        arithmetic_intensity = 0.0
    else:
        arithmetic_intensity = (2 * macs) / bytes_accessed

    # Check bounds
    if memory_roof <= 0:
        ridge_point = float('inf')
    else:
        ridge_point = compute_roof / memory_roof

    if arithmetic_intensity < ridge_point:
        bound = "memory"
    else:
        bound = "compute"
        
    return arithmetic_intensity, bound
