import logging
from typing import Any

import onnx
from onnx import numpy_helper, shape_inference

logger = logging.getLogger(__name__)

UNSUPPORTED_OPS = {
    "GlobalAveragePool",
    "MaxPool",
    "AvgPool",
    "BatchNormalization",
    "Flatten",
    "Reshape",
}

ACTIVATION_OPS = {
    "Relu": "relu",
    "Sigmoid": "sigmoid",
    "Softmax": "softmax",
}

COMPUTE_OPS = {"Conv", "Gemm", "MatMul"}


def parse_onnx(model_bytes: bytes) -> tuple[list[dict], list[str], str]:
    """
    Parse an ONNX model into a list of layer dicts compatible with the simulator,
    a list of skipped (unsupported) op names, and the model name.

    Returns:
        (layers, skipped_ops, model_name)
    """
    try:
        model = onnx.load_from_string(model_bytes)
    except Exception as e:
        raise ValueError(f"Failed to parse ONNX model: {e}") from e

    model = shape_inference.infer_shapes(model)

    # Build initializer lookup: name -> numpy array
    init_map: dict[str, Any] = {}
    for init in model.graph.initializer:
        init_map[init.name] = numpy_helper.to_array(init)

    # Build node info lookup from value_info / graph inputs
    shape_map: dict[str, list[int]] = {}
    for vi in model.graph.value_info:
        if vi.type.HasField("tensor_type") and vi.type.tensor_type.HasField("shape"):
            shape_map[vi.name] = [d.dim_value for d in vi.type.tensor_type.shape.dim]
    for inp in model.graph.input:
        if inp.type.HasField("tensor_type") and inp.type.tensor_type.HasField("shape"):
            dims = []
            for d in inp.type.tensor_type.shape.dim:
                if d.HasField("dim_value"):
                    dims.append(d.dim_value)
                elif d.HasField("dim_param"):
                    dims.append(0)  # unknown / dynamic
                else:
                    dims.append(0)
            shape_map[inp.name] = dims
    # Also check output shapes for nodes whose outputs have inferred shapes
    for out in model.graph.output:
        if out.type.HasField("tensor_type") and out.type.tensor_type.HasField("shape"):
            dims = []
            for d in out.type.tensor_type.shape.dim:
                if d.HasField("dim_value"):
                    dims.append(d.dim_value)
                elif d.HasField("dim_param"):
                    dims.append(0)
                else:
                    dims.append(0)
            shape_map[out.name] = dims

    # For shape info lookup by node name (node output)
    node_output_names: dict[str, str] = {}
    for node in model.graph.node:
        if node.output:
            node_output_names[node.output[0]] = node.name

    layers: list[dict] = []
    skipped_ops: list[str] = []

    # Determine model_name from graph name if present
    graph_name = model.graph.name if model.graph.name else ""

    i = 0
    while i < len(model.graph.node):
        node = model.graph.node[i]
        op_type = node.op_type

        # Activations: merge into previous layer
        if op_type in ACTIVATION_OPS:
            if layers:
                prev = layers[-1]
                prev["activation"] = ACTIVATION_OPS[op_type]
            else:
                logger.warning(
                    "Activation node '%s' (%s) has no preceding compute layer, skipping",
                    node.name,
                    op_type,
                )
                skipped_ops.append(op_type)
            i += 1
            continue

        # Skip unsupported ops
        if op_type in UNSUPPORTED_OPS:
            logger.warning("Skipping unsupported op '%s' (%s)", node.name, op_type)
            skipped_ops.append(op_type)
            i += 1
            continue

        # Compute layers
        if op_type == "Conv":
            layer = _parse_conv(node, init_map, shape_map)
            if layer:
                layers.append(layer)
            else:
                logger.warning("Failed to parse Conv node '%s', skipping", node.name)
                skipped_ops.append("Conv")
        elif op_type in ("Gemm", "MatMul"):
            layer = _parse_gemm_matmul(node, init_map, shape_map)
            if layer:
                layers.append(layer)
            else:
                logger.warning(
                    "Failed to parse %s node '%s', skipping", op_type, node.name
                )
                skipped_ops.append(op_type)
        else:
            logger.warning(
                "Unknown op type '%s' on node '%s', skipping", op_type, node.name
            )
            skipped_ops.append(op_type)

        i += 1

    return layers, skipped_ops, graph_name


def _get_attr(node: onnx.NodeProto, name: str, default: Any = None) -> Any:
    """Safely get an attribute from an ONNX node."""
    for attr in node.attribute:
        if attr.name == name:
            if attr.type == onnx.AttributeProto.INT:
                return attr.i
            elif attr.type == onnx.AttributeProto.FLOAT:
                return attr.f
            elif attr.type == onnx.AttributeProto.STRING:
                return attr.s
            elif attr.type == onnx.AttributeProto.INTS:
                return list(attr.ints)
            elif attr.type == onnx.AttributeProto.FLOATS:
                return list(attr.floats)
            elif attr.type == onnx.AttributeProto.TENSOR:
                return numpy_helper.to_array(attr.t)
    return default


def _get_output_shape(
    shape_map: dict[str, list[int]], node: onnx.NodeProto, idx: int = 0
) -> list[int] | None:
    """Get the inferred shape for a node's N-th output."""
    if not node.output:
        return None
    return shape_map.get(node.output[idx])


def _parse_conv(
    node: onnx.NodeProto,
    init_map: dict[str, Any],
    shape_map: dict[str, list[int]],
) -> dict | None:
    """Parse a Conv ONNX node into a simulator layer dict."""
    try:
        # Look for weight tensor among inputs
        weight_name = node.input[1] if len(node.input) > 1 else None
        if weight_name is None or weight_name not in init_map:
            return None

        weight_tensor = init_map[weight_name]
        # Conv weight shape: [out_channels, in_channels / groups, kernel_h, kernel_w, ...]
        filters = int(weight_tensor.shape[0])
        in_ch_per_group = int(weight_tensor.shape[1])
        kernel_shape = list(weight_tensor.shape[2:])
        kernel_size = kernel_shape[0]

        # ONNX Conv attributes
        strides = _get_attr(node, "strides", [1])
        stride = strides[0] if strides else 1

        pads = _get_attr(node, "pads", [0, 0, 0, 0])
        pad_sum = sum(pads) if pads else 0
        padding = "same" if pad_sum > 0 else "valid"

        group = _get_attr(node, "group", 1)
        input_channels = in_ch_per_group * group

        # Try to get input spatial dimensions from shape_map
        input_name = node.input[0] if node.input else None
        input_shape = shape_map.get(input_name) if input_name else None

        if input_shape and len(input_shape) >= 2:
            # ONNX Conv input is [N, C, H, W, ...] so spatial dims are at index 2+
            input_height = input_shape[2] if len(input_shape) > 2 else 28
            input_width = input_shape[3] if len(input_shape) > 3 else 28
            # Handle dynamic dimensions (encoded as 0)
            if input_height <= 0:
                input_height = 28
            if input_width <= 0:
                input_width = 28
        else:
            # Fallback
            input_height = 28
            input_width = 28

        return {
            "name": node.name or "conv2d",
            "type": "conv2d",
            "input_width": max(1, input_width),
            "input_height": max(1, input_height),
            "input_channels": max(1, input_channels),
            "filters": max(1, filters),
            "kernel_size": max(1, kernel_size),
            "stride": max(1, stride),
            "padding": padding,
            "activation": "none",
            "precision": "int8",
            "parallelism_factor": 4,
        }
    except Exception as e:
        logger.warning("Error parsing Conv '%s': %s", node.name, e)
        return None


def _parse_gemm_matmul(
    node: onnx.NodeProto,
    init_map: dict[str, Any],
    shape_map: dict[str, list[int]],
) -> dict | None:
    """Parse a Gemm or MatMul ONNX node into a simulator layer dict."""
    try:
        # Try to find weight/init tensor for dimensions
        weight_tensor = None

        if node.op_type == "Gemm":
            # Gemm inputs: A, B, (C=optional bias)
            # B is usually an initializer (weight matrix)
            b_name = node.input[1] if len(node.input) > 1 else None
            if b_name and b_name in init_map:
                weight_tensor = init_map[b_name]
        else:
            # MatMul: inputs: A, B - B is usually an initializer
            b_name = node.input[1] if len(node.input) > 1 else None
            if b_name and b_name in init_map:
                weight_tensor = init_map[b_name]

        if weight_tensor is not None and weight_tensor.ndim >= 2:
            output_neurons = int(weight_tensor.shape[-1])
            input_neurons = int(weight_tensor.shape[-2])
        else:
            # Fall back to shape inference from value_info
            in_shape = shape_map.get(
                node.input[0] if node.input else None, []
            )
            out_shape = _get_output_shape(shape_map, node)

            if in_shape and out_shape and len(in_shape) >= 2 and len(out_shape) >= 2:
                input_neurons = max(1, in_shape[-1])
                output_neurons = max(1, out_shape[-1])
            else:
                return None

        return {
            "name": node.name or "dense",
            "type": "dense",
            "input_neurons": max(1, input_neurons),
            "output_neurons": max(1, output_neurons),
            "activation": "none",
            "precision": "int8",
            "parallelism_factor": 4,
        }
    except Exception as e:
        logger.warning("Error parsing %s '%s': %s", node.op_type, node.name, e)
        return None
