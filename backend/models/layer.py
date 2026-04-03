from pydantic import BaseModel, Field, field_validator
from typing import Literal

class BaseLayer(BaseModel):
    name: str = Field(..., max_length=32, pattern=r'^[a-zA-Z0-9_\-]+$')
    type: Literal["conv2d", "dense"]
    activation: Literal["relu", "sigmoid", "softmax", "none"] = "relu"
    precision: Literal["fp32", "int8", "int4"] = "int8"
    parallelism_factor: int = Field(ge=1, le=16)

    @field_validator('parallelism_factor')
    @classmethod
    def check_power_of_2(cls, v):
        if v & (v - 1) != 0:
            raise ValueError('parallelism_factor must be a power of 2')
        return v

class Conv2DLayer(BaseLayer):
    type: Literal["conv2d"]
    input_width: int = Field(ge=1, le=4096)
    input_height: int = Field(ge=1, le=4096)
    input_channels: int = Field(ge=1, le=2048)
    filters: int = Field(ge=1, le=2048)
    kernel_size: int = Field(ge=1, le=7)
    stride: int = Field(ge=1, le=4)
    padding: Literal["same", "valid"] = "same"

class DenseLayer(BaseLayer):
    type: Literal["dense"]
    input_neurons: int = Field(ge=1, le=65536)
    output_neurons: int = Field(ge=1, le=65536)
