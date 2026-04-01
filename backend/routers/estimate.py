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
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal Server Error: " + str(e))
