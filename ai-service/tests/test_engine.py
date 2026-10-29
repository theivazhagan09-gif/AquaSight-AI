from fastapi.testclient import TestClient
from app.main import app
from app import engine
c = TestClient(app)
def test_deficit(): assert engine.deficit_mld(100, 120) == 0 and engine.deficit_mld(120, 100) == 20
def test_classify(): assert [engine.classify(x) for x in (0.1, 0.3, 0.5, 0.9)] == ["Low", "Moderate", "High", "Severe"]
def test_severe():
    r = engine.assess(-200, 0, 12, 100, 50); assert r["stress_score"] == 1.0 and r["risk_category"] == "Severe"
def test_low():
    r = engine.assess(200, 100, 2, 100, 120); assert r["stress_score"] == 0 and r["risk_category"] == "Low"
def test_missing_not_zero():
    r = engine.assess(None, 50, None, 100, 80); assert set(r["missing_factors"]) == {"rainfall", "groundwater"}
    assert abs(sum(f["weight_effective"] for f in r["factors"]) - 1) < 1e-3
def test_insufficient(): assert engine.assess(storage_pct=50)["risk_category"] == "Insufficient data"
def test_api():
    assert c.get("/health").json()["trained"] is False
    assert c.post("/predict/risk", json={"storage_pct": 150}).status_code == 422
    assert c.post("/predict/risk", json={"storage_pct": 50, "demand_mld": 10, "supply_mld": 9}).status_code == 200
    assert c.post("/predict/risk", json={"storage_pct": 50, "demand_mld": 10, "supply_mld": 9, "weights": {"x": 1}}).status_code == 422
