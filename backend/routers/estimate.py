from fastapi import APIRouter, HTTPException
from models.request import EstimateRequest
from models.response import EstimationResult
from engine import estimator

router = APIRouter()

@router.post("/estimate", response_model=EstimationResult)
def estimate_resources(request: EstimateRequest):
    try:
        result = estimator.estimate_pipeline(
            layers=request.layers,
            target_id=request.fpga_target,
            clock_mhz=request.clock_mhz
        )
        return result
    except ValueError as e:
        err_str = str(e)
        if "Unknown FPGA target" in err_str:
            raise HTTPException(status_code=404, detail=err_str)
        raise HTTPException(status_code=422, detail=err_str)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal Server Error: " + str(e))
