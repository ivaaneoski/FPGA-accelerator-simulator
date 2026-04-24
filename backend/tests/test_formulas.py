import pytest
import math
from engine.formulas import estimate_conv2d, estimate_dense, estimate_brams, compute_roofline_bound

class TestConv2DEstimation:
    def test_basic_output_dims_same_padding(self):
        r = estimate_conv2d(input_w=28, input_h=28, input_channels=1,
                            filters=32, kernel_size=3, stride=1,
                            padding="same", activation="relu",
                            precision="int8", parallelism_factor=1, clock_mhz=200)
        assert r["output_w"] == 28
        assert r["output_h"] == 28

    def test_basic_output_dims_valid_padding(self):
        r = estimate_conv2d(input_w=28, input_h=28, input_channels=1,
                            filters=32, kernel_size=3, stride=1,
                            padding="valid", activation="relu",
                            precision="int8", parallelism_factor=1, clock_mhz=200)
        assert r["output_w"] == 26
        assert r["output_h"] == 26

    def test_all_resources_positive(self):
        r = estimate_conv2d(input_w=28, input_h=28, input_channels=1,
                            filters=32, kernel_size=3, stride=1,
                            padding="same", activation="relu",
                            precision="int8", parallelism_factor=1, clock_mhz=200)
        assert r["luts"] >= 1
        assert r["ffs"] >= 1
        assert r["dsps"] >= 1
        assert r["brams"] >= 1
        assert r["latency_cycles"] >= 1
        assert r["latency_us"] > 0
        assert r["macs"] > 0

    def test_precision_ordering_luts(self):
        base = dict(input_w=28, input_h=28, input_channels=1, filters=32,
                    kernel_size=3, stride=1, padding="same", activation="relu",
                    parallelism_factor=1, clock_mhz=200)
        fp32 = estimate_conv2d(**base, precision="fp32")
        int8 = estimate_conv2d(**base, precision="int8")
        int4 = estimate_conv2d(**base, precision="int4")
        assert fp32["luts"] > int8["luts"]
        assert int8["luts"] > int4["luts"]

    def test_precision_ordering_dsps(self):
        base = dict(input_w=28, input_h=28, input_channels=1, filters=32,
                    kernel_size=3, stride=1, padding="same", activation="relu",
                    parallelism_factor=1, clock_mhz=200)
        fp32 = estimate_conv2d(**base, precision="fp32")
        int8 = estimate_conv2d(**base, precision="int8")
        int4 = estimate_conv2d(**base, precision="int4")
        assert fp32["dsps"] > int8["dsps"]
        assert int8["dsps"] >= int4["dsps"]

    def test_higher_parallelism_reduces_latency(self):
        base = dict(input_w=28, input_h=28, input_channels=1, filters=64,
                    kernel_size=3, stride=1, padding="same", activation="relu",
                    precision="int8", clock_mhz=200)
        r1 = estimate_conv2d(**base, parallelism_factor=1)
        r8 = estimate_conv2d(**base, parallelism_factor=8)
        assert r8["latency_cycles"] < r1["latency_cycles"]

    def test_higher_parallelism_increases_luts(self):
        base = dict(input_w=28, input_h=28, input_channels=1, filters=64,
                    kernel_size=3, stride=1, padding="same", activation="relu",
                    precision="int8", clock_mhz=200)
        r1 = estimate_conv2d(**base, parallelism_factor=1)
        r8 = estimate_conv2d(**base, parallelism_factor=8)
        assert r8["luts"] > r1["luts"]

    def test_memory_bound_diminishing_returns(self):
        # Memory-bound layers should have sublinear speedup
        base = dict(input_w=112, input_h=112, input_channels=3, filters=64,
                    kernel_size=3, stride=1, padding="same", activation="relu",
                    precision="fp32", clock_mhz=200)
        r1 = estimate_conv2d(**base, parallelism_factor=1)
        r16 = estimate_conv2d(**base, parallelism_factor=16)
        speedup = r1["latency_cycles"] / r16["latency_cycles"]
        # Memory-bound: speedup should be much less than 16x
        assert speedup < 16

    def test_routing_overhead_applied(self):
        # LUTs should include routing overhead â€” base logic alone would be lower
        r = estimate_conv2d(input_w=28, input_h=28, input_channels=1,
                            filters=32, kernel_size=3, stride=1,
                            padding="same", activation="none",
                            precision="int8", parallelism_factor=1, clock_mhz=200)
        assert r["luts"] > 0

    def test_confidence_margin_present(self):
        r = estimate_conv2d(input_w=28, input_h=28, input_channels=1,
                            filters=32, kernel_size=3, stride=1,
                            padding="same", activation="relu",
                            precision="int8", parallelism_factor=1, clock_mhz=200)
        assert "confidence_margin" in r
        assert r["confidence_margin"] == "±20%"


class TestDenseEstimation:
    def test_basic_dense_all_positive(self):
        r = estimate_dense(input_neurons=128, output_neurons=64,
                           activation="relu", precision="int8",
                           parallelism_factor=1, clock_mhz=200)
        assert r["luts"] >= 1
        assert r["dsps"] >= 1
        assert r["brams"] >= 1
        assert r["latency_cycles"] >= 1
        assert r["macs"] == 128 * 64

    def test_tiny_dense_bram_minimum_one(self):
        # Even a tiny 10-neuron output layer must consume at least 1 BRAM
        r = estimate_dense(input_neurons=10, output_neurons=10,
                           activation="softmax", precision="int8",
                           parallelism_factor=1, clock_mhz=200)
        assert r["brams"] >= 1

    def test_precision_ordering_dense(self):
        base = dict(input_neurons=256, output_neurons=128,
                    activation="relu", parallelism_factor=1, clock_mhz=200)
        fp32 = estimate_dense(**base, precision="fp32")
        int8 = estimate_dense(**base, precision="int8")
        int4 = estimate_dense(**base, precision="int4")
        assert fp32["luts"] > int8["luts"] > int4["luts"]

    def test_parallelism_reduces_latency_dense(self):
        base = dict(input_neurons=512, output_neurons=256,
                    activation="relu", precision="int8", clock_mhz=200)
        r1 = estimate_dense(**base, parallelism_factor=1)
        r4 = estimate_dense(**base, parallelism_factor=4)
        assert r4["latency_cycles"] < r1["latency_cycles"]


class TestBRAMEstimation:
    def test_zero_bits_returns_zero(self):
        assert estimate_brams(0) == 0

    def test_minimum_one_tile(self):
        assert estimate_brams(1) == 1  # 1 bit still needs 1 tile

    def test_efficiency_factor_applied(self):
        # Without efficiency factor, 36864 bits = 1 tile exactly
        # With 0.7 factor, 36864 bits = ceil(36864 / (36864*0.7)) = ceil(1.43) = 2 tiles
        assert estimate_brams(36864) == 2

    def test_large_weight_matrix(self):
        # 1M bits with 0.7 efficiency
        result = estimate_brams(1_000_000)
        expected = math.ceil(1_000_000 / (36864 * 0.7))
        assert result == expected


class TestRooflineModel:
    def test_compute_bound_classification(self):
        # High arithmetic intensity â†’ compute-bound
        result = compute_roofline_bound(
            macs=10_000_000, weight_bits=32768,
            activation_bits=8192, clock_mhz=200, dsps=360)
        assert result["bound"] == "compute"

    def test_memory_bound_classification(self):
        # Low arithmetic intensity â†’ memory-bound
        result = compute_roofline_bound(
            macs=100, weight_bits=10_000_000,
            activation_bits=1_000_000, clock_mhz=200, dsps=360)
        assert result["bound"] == "memory"

    def test_arithmetic_intensity_never_zero(self):
        result = compute_roofline_bound(
            macs=0, weight_bits=0, activation_bits=0,
            clock_mhz=200, dsps=360)
        assert result["arithmetic_intensity"] >= 0.001

    def test_attainable_performance_never_zero(self):
        result = compute_roofline_bound(
            macs=1, weight_bits=1, activation_bits=1,
            clock_mhz=200, dsps=360)
        assert result["attainable_performance_gops"] >= 0.001

    def test_attainable_capped_at_compute_roof(self):
        # Attainable performance cannot exceed compute roof
        result = compute_roofline_bound(
            macs=10_000_000_000, weight_bits=100,
            activation_bits=100, clock_mhz=200, dsps=360)
        assert result["attainable_performance_gops"] <= result["compute_roof_gops"] + 0.001
