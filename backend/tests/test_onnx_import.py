import io

import onnx
import pytest
from onnx import helper, numpy_helper, TensorProto
from fastapi.testclient import TestClient
from main import app

from engine.onnx_parser import parse_onnx

client = TestClient(app)


# ---------------------------------------------------------------------------
# Helpers — build minimal ONNX models programmatically
# ---------------------------------------------------------------------------

def _make_conv_model() -> bytes:
    """ONNX graph:  Conv(kernel=3, out_channels=16) -> Relu"""
    X = helper.make_tensor_value_info("X", TensorProto.FLOAT, [1, 3, 28, 28])
    Y = helper.make_tensor_value_info("Y", TensorProto.FLOAT, [1, 16, 26, 26])

    # Weight tensor: [out_channels, in_channels, kH, kW] = [16, 3, 3, 3]
    weight = numpy_helper.from_array(
        __import__("numpy").random.randn(16, 3, 3, 3).astype("float32"),
        name="conv_w",
    )

    conv_node = helper.make_node(
        "Conv",
        inputs=["X", "conv_w"],
        outputs=["conv_out"],
        kernel_shape=[3, 3],
        strides=[1, 1],
        pads=[0, 0, 0, 0],
        name="Conv1",
    )

    relu_node = helper.make_node(
        "Relu",
        inputs=["conv_out"],
        outputs=["Y"],
        name="Relu1",
    )

    graph = helper.make_graph(
        [conv_node, relu_node],
        "test_conv_model",
        [X],
        [Y],
        [weight],
    )
    model = helper.make_model(graph, producer_name="test")
    model = onnx.shape_inference.infer_shapes(model)
    return model.SerializeToString()


def _make_gemm_model() -> bytes:
    """ONNX graph:  Gemm -> Softmax"""
    X = helper.make_tensor_value_info("X", TensorProto.FLOAT, [1, 128])
    Y = helper.make_tensor_value_info("Y", TensorProto.FLOAT, [1, 64])

    # Gemm weight: [128, 64]
    weight = numpy_helper.from_array(
        __import__("numpy").random.randn(128, 64).astype("float32"),
        name="gemm_w",
    )

    gemm_node = helper.make_node(
        "Gemm",
        inputs=["X", "gemm_w"],
        outputs=["gemm_out"],
        name="Gemm1",
    )

    softmax_node = helper.make_node(
        "Softmax",
        inputs=["gemm_out"],
        outputs=["Y"],
        name="Softmax1",
    )

    graph = helper.make_graph(
        [gemm_node, softmax_node],
        "test_gemm_model",
        [X],
        [Y],
        [weight],
    )
    model = helper.make_model(graph, producer_name="test")
    model = onnx.shape_inference.infer_shapes(model)
    return model.SerializeToString()


def _make_unsupported_ops_model() -> bytes:
    """ONNX graph with GlobalAveragePool, MaxPool, BatchNormalization alongside a Conv."""
    import numpy as np
    X = helper.make_tensor_value_info("X", TensorProto.FLOAT, [1, 3, 32, 32])
    Y = helper.make_tensor_value_info("Y", TensorProto.FLOAT, [1, 8, 30, 30])

    weight = numpy_helper.from_array(
        np.random.randn(8, 3, 3, 3).astype("float32"),
        name="conv_w2",
    )

    conv_node = helper.make_node(
        "Conv", inputs=["X", "conv_w2"], outputs=["conv_out"],
        kernel_shape=[3, 3], strides=[1, 1], pads=[0, 0, 0, 0], name="Conv2",
    )
    gap_node = helper.make_node(
        "GlobalAveragePool", inputs=["conv_out"], outputs=["gap_out"], name="Gap1",
    )
    pool_node = helper.make_node(
        "MaxPool", inputs=["gap_out"], outputs=["pool_out"],
        kernel_shape=[2, 2], strides=[2, 2], name="Pool1",
    )
    bn_node = helper.make_node(
        "BatchNormalization",
        inputs=["conv_out", "bn_scale", "bn_b", "bn_mean", "bn_var"],
        outputs=["bn_out"],
        name="BN1",
    )
    # We need BN initializers
    scale = numpy_helper.from_array(np.ones(8, dtype="float32"), name="bn_scale")
    bias = numpy_helper.from_array(np.zeros(8, dtype="float32"), name="bn_b")
    mean = numpy_helper.from_array(np.zeros(8, dtype="float32"), name="bn_mean")
    var = numpy_helper.from_array(np.ones(8, dtype="float32"), name="bn_var")

    graph = helper.make_graph(
        [conv_node, gap_node, pool_node, bn_node],
        "test_unsupported",
        [X],
        [Y],
        [weight, scale, bias, mean, var],
    )
    model = helper.make_model(graph, producer_name="test")
    model = onnx.shape_inference.infer_shapes(model)
    return model.SerializeToString()


# ---------------------------------------------------------------------------
# Tests — parser unit tests
# ---------------------------------------------------------------------------

class TestParseONNX:
    def test_conv_model_returns_layers(self):
        model_bytes = _make_conv_model()
        layers, skipped_ops, model_name = parse_onnx(model_bytes)
        assert len(layers) == 1
        assert layers[0]["type"] == "conv2d"

    def test_conv_layer_has_correct_fields(self):
        model_bytes = _make_conv_model()
        layers, _, _ = parse_onnx(model_bytes)
        layer = layers[0]
        assert layer["filters"] == 16
        assert layer["input_channels"] == 3
        assert layer["kernel_size"] == 3
        assert layer["stride"] == 1
        assert layer["padding"] == "valid"
        assert layer["activation"] == "relu"
        assert layer["precision"] == "int8"
        assert layer["parallelism_factor"] == 4

    def test_gemm_model_returns_layers(self):
        model_bytes = _make_gemm_model()
        layers, skipped_ops, model_name = parse_onnx(model_bytes)
        assert len(layers) == 1
        assert layers[0]["type"] == "dense"

    def test_dense_layer_has_correct_fields(self):
        model_bytes = _make_gemm_model()
        layers, _, _ = parse_onnx(model_bytes)
        layer = layers[0]
        assert layer["input_neurons"] > 0
        assert layer["output_neurons"] > 0
        assert layer["activation"] == "softmax"  # merged from Softmax node
        assert layer["precision"] == "int8"
        assert layer["parallelism_factor"] == 4

    def test_unsupported_ops_in_skipped_list(self):
        model_bytes = _make_unsupported_ops_model()
        layers, skipped_ops, _ = parse_onnx(model_bytes)
        assert "GlobalAveragePool" in skipped_ops
        assert "MaxPool" in skipped_ops
        assert "BatchNormalization" in skipped_ops
        # The Conv should still be parsed
        assert any(l["type"] == "conv2d" for l in layers)

    def test_unsupported_ops_dont_crash_parser(self):
        model_bytes = _make_unsupported_ops_model()
        # Just calling parser should not raise
        layers, skipped, _ = parse_onnx(model_bytes)
        assert isinstance(layers, list)
        assert isinstance(skipped, list)


# ---------------------------------------------------------------------------
# Tests — API endpoint tests
# ---------------------------------------------------------------------------

class TestImportONNXEndpoint:
    def test_valid_onnx_file_returns_200(self):
        model_bytes = _make_conv_model()
        r = client.post(
            "/api/import-onnx",
            files={"file": ("model.onnx", io.BytesIO(model_bytes), "application/octet-stream")},
        )
        assert r.status_code == 200

    def test_response_has_required_keys(self):
        model_bytes = _make_conv_model()
        data = client.post(
            "/api/import-onnx",
            files={"file": ("model.onnx", io.BytesIO(model_bytes), "application/octet-stream")},
        ).json()
        assert "layers" in data
        assert "skipped_ops" in data
        assert "model_name" in data

    def test_invalid_file_returns_422(self):
        r = client.post(
            "/api/import-onnx",
            files={"file": ("model.txt", io.BytesIO(b"this is not onnx"), "text/plain")},
        )
        assert r.status_code == 422

    def test_non_onnx_extension_rejected(self):
        r = client.post(
            "/api/import-onnx",
            files={"file": ("model.bin", io.BytesIO(b"\x00\x01\x02"), "application/octet-stream")},
        )
        assert r.status_code == 422

    def test_layers_match_backend_schema(self):
        """Parsed layers must be compatible with Conv2DLayer / DenseLayer models."""
        from models.request import EstimateRequest
        model_bytes = _make_conv_model()
        resp = client.post(
            "/api/import-onnx",
            files={"file": ("model.onnx", io.BytesIO(model_bytes), "application/octet-stream")},
        ).json()
        # Construct a full request and validate via Pydantic
        payload = {
            "fpga_target": "zynq_ultrascale_zu3eg",
            "clock_mhz": 200,
            "layers": resp["layers"],
        }
        req = EstimateRequest(**payload)  # will raise if schema mismatch
        assert len(req.layers) == 1

    def test_gemm_endpoint_returns_dense(self):
        model_bytes = _make_gemm_model()
        data = client.post(
            "/api/import-onnx",
            files={"file": ("model.onnx", io.BytesIO(model_bytes), "application/octet-stream")},
        ).json()
        assert len(data["layers"]) == 1
        assert data["layers"][0]["type"] == "dense"

    def test_skipped_ops_returned(self):
        model_bytes = _make_unsupported_ops_model()
        data = client.post(
            "/api/import-onnx",
            files={"file": ("model.onnx", io.BytesIO(model_bytes), "application/octet-stream")},
        ).json()
        assert len(data["skipped_ops"]) > 0
