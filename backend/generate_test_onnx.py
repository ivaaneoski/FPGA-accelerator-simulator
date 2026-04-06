"""Generate a comprehensive test ONNX model covering every parser path.

Usage:
    cd backend
    python generate_test_onnx.py

Output: backend/test_model.onnx

Layers produced:
  [0] conv2d  — Conv 16f3x3x3, stride=1, valid pad  + Relu
  [1] conv2d  — Conv 32f3x3x16, stride=2, same pad  + Sigmoid
  [2] dense   — Gemm 128->64                       + Softmax
  [3] dense   — MatMul 64->10

Skipped ops:
  GlobalAveragePool, MaxPool, BatchNormalization, Flatten
"""

import numpy as np
import onnx
from onnx import helper, numpy_helper, TensorProto

np.random.seed(42)


def main():
    # ── Graph I/O ─────────────────────────────────────────────────────────
    input_main = helper.make_tensor_value_info(
        "input", TensorProto.FLOAT, [1, 3, 32, 32]
    )
    fc_input = helper.make_tensor_value_info(
        "fc_input", TensorProto.FLOAT, [1, 128]
    )
    output_main = helper.make_tensor_value_info(
        "output", TensorProto.FLOAT, [1, 10]
    )

    # ── Layer 1: Conv (valid, stride=1) + Relu ────────────────────────────
    conv1_w = numpy_helper.from_array(
        np.random.randn(16, 3, 3, 3).astype(np.float32), name="conv1_w"
    )
    conv1 = helper.make_node(
        "Conv", inputs=["input", "conv1_w"], outputs=["c1"],
        kernel_shape=[3, 3], strides=[1, 1], pads=[0, 0, 0, 0],
        name="Conv1_valid_stride1",
    )
    relu1 = helper.make_node(
        "Relu", inputs=["c1"], outputs=["r1"], name="Relu_after_conv1"
    )

    # ── Layer 2: Conv (same, stride=2) + Sigmoid ──────────────────────────
    conv2_w = numpy_helper.from_array(
        np.random.randn(32, 16, 3, 3).astype(np.float32), name="conv2_w"
    )
    conv2 = helper.make_node(
        "Conv", inputs=["r1", "conv2_w"], outputs=["c2"],
        kernel_shape=[3, 3], strides=[2, 2], pads=[1, 1, 1, 1],
        name="Conv2_same_stride2",
    )
    sig1 = helper.make_node(
        "Sigmoid", inputs=["c2"], outputs=["s1"], name="Sigmoid_after_conv2"
    )

    # ── Unsupported ops (should appear in skipped_ops) ────────────────────
    gap = helper.make_node(
        "GlobalAveragePool", inputs=["s1"], outputs=["g1"], name="GAP1"
    )
    mp = helper.make_node(
        "MaxPool", inputs=["g1"], outputs=["m1"],
        kernel_shape=[2, 2], strides=[2, 2], name="MaxPool1"
    )
    bn_s = numpy_helper.from_array(np.ones(1, dtype=np.float32), name="bn_s")
    bn_b = numpy_helper.from_array(np.zeros(1, dtype=np.float32), name="bn_b")
    bn_m = numpy_helper.from_array(np.zeros(1, dtype=np.float32), name="bn_m")
    bn_v = numpy_helper.from_array(np.ones(1, dtype=np.float32), name="bn_v")
    bn = helper.make_node(
        "BatchNormalization",
        inputs=["m1", "bn_s", "bn_b", "bn_m", "bn_v"],
        outputs=["b1"], name="BN1"
    )
    flat = helper.make_node(
        "Flatten", inputs=["b1"], outputs=["f1"], axis=1, name="Flatten1"
    )

    # ── Layer 3: Gemm (128 -> 64) + Softmax ───────────────────────────────
    gemm_w = numpy_helper.from_array(
        np.random.randn(128, 64).astype(np.float32), name="gemm_w"
    )
    gemm = helper.make_node(
        "Gemm", inputs=["fc_input", "gemm_w"], outputs=["g_out"],
        name="Gemm1_fc1"
    )
    softmax = helper.make_node(
        "Softmax", inputs=["g_out"], outputs=["sm_out"], name="Softmax1"
    )

    # ── Layer 4: MatMul (64 -> 10) ────────────────────────────────────────
    mm_w = numpy_helper.from_array(
        np.random.randn(64, 10).astype(np.float32), name="mm_w"
    )
    mm = helper.make_node(
        "MatMul", inputs=["sm_out", "mm_w"], outputs=["mm_out"],
        name="MatMul1_output"
    )

    # ── Reshape final output to [1, 10] ───────────────────────────────────
    shape_t = numpy_helper.from_array(np.array([1, 10], dtype=np.int64), name="shape_t")
    reshape = helper.make_node(
        "Reshape", inputs=["mm_out", "shape_t"], outputs=["output"],
        name="Reshape_to_output"
    )

    # ── Assemble graph ────────────────────────────────────────────────────
    nodes = [conv1, relu1, conv2, sig1, gap, mp, bn, flat, gemm, softmax, mm, reshape]
    inits = [conv1_w, conv2_w, bn_s, bn_b, bn_m, bn_v, gemm_w, mm_w, shape_t]

    graph = helper.make_graph(
        nodes,
        "test_model_comprehensive",
        [input_main, fc_input],
        [output_main],
        inits,
    )

    model = helper.make_model(
        graph,
        opset_imports=[helper.make_opsetid("", 13)],
        producer_name="generate_test_onnx.py",
    )
    model = onnx.shape_inference.infer_shapes(model)
    model.ir_version = 8
    onnx.checker.check_model(model)

    path = "test_model.onnx"
    onnx.save(model, path)
    print(f"[OK] Wrote {path}")

    # ── Self-verify with the parser ───────────────────────────────────────
    from engine.onnx_parser import parse_onnx
    with open(path, "rb") as f:
        layers, skipped, mname = parse_onnx(f.read())

    print(f"\nModel name : {mname}")
    print(f"Layers     : {len(layers)}")
    for i, l in enumerate(layers):
        print(f"  [{i}] {l['type']:^8s}  {l['name']:<24s}  activation={l['activation']:8s}  "
              + (" ".join(f"{k}={v}" for k, v in sorted(l.items()) if k not in (
                  "name", "type", "activation", "precision", "parallelism_factor"))))
    print(f"Skipped ops: {skipped}")

    # Assert coverage
    types = [l['type'] for l in layers]
    assert "conv2d" in types, "Missing conv2d"
    assert "dense" in types, "Missing dense"
    conv_layers = [l for l in layers if l['type'] == 'conv2d']
    assert len(conv_layers) == 2, f"Expected 2 conv, got {len(conv_layers)}"
    assert conv_layers[0]['padding'] == 'valid', "Conv1 should be valid"
    assert conv_layers[0]['stride'] == 1
    assert conv_layers[1]['padding'] == 'same', "Conv2 should be same"
    assert conv_layers[1]['stride'] == 2
    assert conv_layers[0]['activation'] == 'relu'
    assert conv_layers[1]['activation'] == 'sigmoid'
    dense_layers = [l for l in layers if l['type'] == 'dense']
    assert len(dense_layers) == 2, f"Expected 2 dense, got {len(dense_layers)}"
    assert dense_layers[0]['activation'] == 'softmax'
    for l in layers:
        assert l['precision'] == 'int8'
        assert l['parallelism_factor'] == 4
    for op in ("GlobalAveragePool", "MaxPool", "BatchNormalization", "Flatten"):
        assert op in skipped, f"Expected {op} in skipped"

    print("\n[ALL ASSERTIONS PASSED]")


if __name__ == "__main__":
    main()
