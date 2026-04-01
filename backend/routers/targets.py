from fastapi import APIRouter
from engine.fpga_targets import FPGA_TARGETS
from typing import List, Dict, Any

router = APIRouter()

@router.get("/fpga-targets", response_model=List[Dict[str, Any]])
def get_fpga_targets():
    return FPGA_TARGETS
