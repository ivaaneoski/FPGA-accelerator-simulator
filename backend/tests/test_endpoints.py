import pytest
import time
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

VALID_CONV2D_LAYER = {
    "type": "conv2d", "name": "Conv2D-1",
    "input_width": 28, "input_height": 28, "input_channels": 1,
    "filters": 32, "kernel_size": 3, "stride": 1,
    "padding": "same", "activation": "relu",
    "precision": "int8", "parallelism_factor": 1
}

VALID_DENSE_LAYER = {
    "type": "dense", "name": "Dense-1",
    "input_neurons": 128, "output_neurons": 64,
    "activation": "relu", "precision": "int8", "parallelism_factor": 1
}


class TestHealthEndpoint:
    def test_health_returns_200(self):
        r = client.get("/api/health")
        assert r.status_code == 200

    def test_health_returns_ok_status(self):
        r = client.get("/api/health")
        assert r.json()["status"] == "ok"


class TestFPGATargetsEndpoint:
    def test_returns_200(self):
        r = client.get("/api/fpga-targets")
        assert r.status_code == 200

    def test_returns_five_targets(self):
        r = client.get("/api/fpga-targets")
        assert len(r.json()) == 5

    def test_each_target_has_required_fields(self):
        r = client.get("/api/fpga-targets")
        for target in r.json():
            assert "id" in target
            assert "name" in target
            assert "luts" in target
            assert "ffs" in target
            assert "dsps" in target
            assert "brams" in target
            assert target["luts"] > 0


class TestEstimateEndpoint:
    def test_single_conv2d_returns_200(self):
        payload = {"fpga_target": "zynq_ultrascale_zu3eg",
                   "clock_mhz": 200, "layers": [VALID_CONV2D_LAYER]}
        r = client.post("/api/estimate", json=payload)
        assert r.status_code == 200

    def test_response_has_required_top_level_keys(self):
        payload = {"fpga_target": "zynq_ultrascale_zu3eg",
                   "clock_mhz": 200, "layers": [VALID_CONV2D_LAYER]}
        data = client.post("/api/estimate", json=payload).json()
        assert "total" in data
        assert "layers" in data
        assert "fpga_utilization" in data

    def test_total_has_required_fields(self):
        payload = {"fpga_target": "zynq_ultrascale_zu3eg",
                   "clock_mhz": 200, "layers": [VALID_CONV2D_LAYER]}
        total = client.post("/api/estimate", json=payload).json()["total"]
        for field in ["luts", "ffs", "dsps", "brams", "latency_cycles",
                      "latency_us", "throughput_inf_per_sec", "macs"]:
            assert field in total
            assert total[field] > 0

    def test_layer_result_has_confidence_margin(self):
        payload = {"fpga_target": "zynq_ultrascale_zu3eg",
                   "clock_mhz": 200, "layers": [VALID_CONV2D_LAYER]}
        layer = client.post("/api/estimate", json=payload).json()["layers"][0]
        assert layer["confidence_margin"] == "±20%"

    def test_layer_result_has_roofline_bound(self):
        payload = {"fpga_target": "zynq_ultrascale_zu3eg",
                   "clock_mhz": 200, "layers": [VALID_CONV2D_LAYER]}
        layer = client.post("/api/estimate", json=payload).json()["layers"][0]
        assert layer["roofline_bound"] in ["compute", "memory"]

    def test_utilization_percentages_are_valid(self):
        payload = {"fpga_target": "zynq_ultrascale_zu3eg",
                   "clock_mhz": 200, "layers": [VALID_CONV2D_LAYER]}
        util = client.post("/api/estimate", json=payload).json()["fpga_utilization"]
        for pct in [util["lut_pct"], util["ff_pct"], util["dsp_pct"], util["bram_pct"]]:
            assert pct >= 0

    def test_mixed_layer_stack(self):
        payload = {"fpga_target": "zynq_ultrascale_zu3eg", "clock_mhz": 200,
                   "layers": [VALID_CONV2D_LAYER, VALID_DENSE_LAYER]}
        data = client.post("/api/estimate", json=payload).json()
        assert len(data["layers"]) == 2
        assert data["total"]["luts"] > 0

    def test_total_luts_equals_sum_of_layers(self):
        payload = {"fpga_target": "zynq_ultrascale_zu3eg", "clock_mhz": 200,
                   "layers": [VALID_CONV2D_LAYER, VALID_DENSE_LAYER]}
        data = client.post("/api/estimate", json=payload).json()
        layer_lut_sum = sum(l["luts"] for l in data["layers"])
        assert data["total"]["luts"] == layer_lut_sum

    def test_empty_layers_rejected(self):
        payload = {"fpga_target": "zynq_ultrascale_zu3eg",
                   "clock_mhz": 200, "layers": []}
        r = client.post("/api/estimate", json=payload)
        assert r.status_code == 422

    def test_invalid_fpga_target_rejected(self):
        payload = {"fpga_target": "nonexistent_chip_xyz",
                   "clock_mhz": 200, "layers": [VALID_CONV2D_LAYER]}
        r = client.post("/api/estimate", json=payload)
        assert r.status_code in [404, 422]

    def test_invalid_precision_rejected(self):
        bad_layer = {**VALID_CONV2D_LAYER, "precision": "int16"}
        payload = {"fpga_target": "zynq_ultrascale_zu3eg",
                   "clock_mhz": 200, "layers": [bad_layer]}
        r = client.post("/api/estimate", json=payload)
        assert r.status_code == 422

    def test_invalid_parallelism_rejected(self):
        # 3 is not a power of 2 â€” must be rejected
        bad_layer = {**VALID_CONV2D_LAYER, "parallelism_factor": 3}
        payload = {"fpga_target": "zynq_ultrascale_zu3eg",
                   "clock_mhz": 200, "layers": [bad_layer]}
        r = client.post("/api/estimate", json=payload)
        assert r.status_code == 422

    def test_lenet5_preset_runs_successfully(self):
        lenet5 = [
            {**VALID_CONV2D_LAYER, "name": "Conv2D-1", "filters": 6, "kernel_size": 5},
            {**VALID_CONV2D_LAYER, "name": "Conv2D-2", "filters": 16, "kernel_size": 5,
             "input_channels": 6, "input_width": 12, "input_height": 12},
            {**VALID_DENSE_LAYER, "name": "Dense-1", "input_neurons": 400, "output_neurons": 120},
            {**VALID_DENSE_LAYER, "name": "Dense-2", "input_neurons": 120, "output_neurons": 84},
            {**VALID_DENSE_LAYER, "name": "Dense-3", "input_neurons": 84, "output_neurons": 10,
             "activation": "softmax"},
        ]
        payload = {"fpga_target": "zynq_ultrascale_zu3eg", "clock_mhz": 200, "layers": lenet5}
        data = client.post("/api/estimate", json=payload).json()
        assert len(data["layers"]) == 5
        assert data["total"]["luts"] > 0
        # LeNet-5 INT8 should fit on ZU3EG (70,560 LUTs available)
        assert data["fpga_utilization"]["lut_pct"] < 100

    def test_response_time_under_200ms(self):
        payload = {"fpga_target": "zynq_ultrascale_zu3eg", "clock_mhz": 200,
                   "layers": [VALID_CONV2D_LAYER] * 20}
        start = time.time()
        client.post("/api/estimate", json=payload)
        elapsed_ms = (time.time() - start) * 1000
        assert elapsed_ms < 200, f"Response took {elapsed_ms:.0f}ms â€” must be under 200ms"
