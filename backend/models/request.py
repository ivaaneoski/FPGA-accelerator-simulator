from pydantic import BaseModel, Field
from typing import List, Union
from models.layer import Conv2DLayer, DenseLayer

class EstimateRequest(BaseModel):
    fpga_target: str
    clock_mhz: int = Field(ge=50, le=1000)
    layers: List[Union[Conv2DLayer, DenseLayer]]
