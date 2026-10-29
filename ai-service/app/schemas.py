from typing import Optional, Dict
from pydantic import BaseModel, Field
class RiskRequest(BaseModel):
    rainfall_anomaly_mm: Optional[float] = Field(None, ge=-3000, le=3000)
    storage_pct: Optional[float] = Field(None, ge=0, le=100)
    groundwater_m_bgl: Optional[float] = Field(None, ge=0, le=200)
    demand_mld: Optional[float] = Field(None, ge=0, le=1e6)
    supply_mld: Optional[float] = Field(None, ge=0, le=1e6)
    weights: Optional[Dict[str, float]] = None
