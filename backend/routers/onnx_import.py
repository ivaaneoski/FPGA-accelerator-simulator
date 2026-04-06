import logging

from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import Dict, List, Any

from engine.onnx_parser import parse_onnx

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/import-onnx")
def import_onnx(
    file: UploadFile = File(...),
) -> Dict[str, Any]:
    """
    Upload a .onnx file and receive a list of layers compatible
    with the existing estimator, plus a list of skipped ops.
    """
    if not file.filename or not file.filename.lower().endswith(".onnx"):
        raise HTTPException(
            status_code=422,
            detail="Invalid file type. Please upload a .onnx file."
        )

    try:
        model_bytes = file.file.read()
    except Exception:
        raise HTTPException(
            status_code=422,
            detail="Failed to read uploaded file."
        )

    try:
        layers, skipped_ops, model_name = parse_onnx(model_bytes)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.exception("Unexpected error while parsing ONNX file")
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while parsing the ONNX model."
        )

    return {
        "layers": layers,
        "skipped_ops": skipped_ops,
        "model_name": model_name,
    }
