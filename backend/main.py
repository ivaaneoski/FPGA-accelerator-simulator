import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routers import estimate, targets

load_dotenv()

app = FastAPI(
    title="FPGA-NN Accelerator Simulator API",
    version="1.0.0"
)

# CORS — must be added BEFORE any route registration
origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(estimate.router, prefix="/api")
app.include_router(targets.router, prefix="/api")

@app.get("/api/health")
def health():
    return {"status": "ok"}
