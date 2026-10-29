from fastapi import FastAPI, HTTPException
from .schemas import RiskRequest
from . import engine
app = FastAPI(title="AquaSight AI service", version=engine.MODEL_VERSION)
@app.get("/health")
def health(): return {"status": "ok", "model_version": engine.MODEL_VERSION, "model_type": "rule-based prototype", "trained": False}
@app.post("/predict/risk")
def predict(req: RiskRequest):
    if req.weights and (any(k not in engine.WEIGHTS for k in req.weights) or any(v < 0 for v in req.weights.values())):
        raise HTTPException(422, "weights keys must be rainfall|storage|groundwater|demand and non-negative")
    return engine.assess(**req.model_dump())
