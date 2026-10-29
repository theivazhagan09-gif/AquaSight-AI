# AquaSight AI — Tamil Nadu Water Intelligence Platform
*Predict Water. Prevent Scarcity.* — hackathon prototype (React/Vite → Node/Express → Python/FastAPI).

**Honest status:** the risk engine is a **rule-based prototype, not trained AI**. No forecast accuracy is claimed ("Forecast model not yet validated"). The supplied water CSV has undocumented provenance and is labelled *estimated demo data*, never a live government feed. All scenario / allocation outputs are simulations.

## Run (3 terminals, open this folder in VS Code)
```bash
# 1) AI service (Python 3.10+)
cd ai-service && pip install -r requirements.txt && uvicorn app.main:app --port 8000
# 2) Backend (Node 18+)
cd backend && npm install && npm start            # http://localhost:4000/api/v1/health
# 3) Frontend
cd frontend && npm install && npm run dev         # http://localhost:5173
```
Copy `.env.example` files if you need to change ports/URLs. No API keys needed. If the AI service is down, the UI shows a visible banner and risk scores show "Data unavailable" (no silent mock data).

## Tests
```bash
cd ai-service && python -m pytest -q      # engine + API (7 tests)
cd backend && npm test                   # formula, allocation invariants, validation, district match, Node->Python (run ai-service first)
cd frontend && npm run build
```

## Adding new / future data
Append rows (same columns, missing values left blank) to `data-input/TN_Water_Shortage_ML_ready.csv` — or pass your own paths — then:
```bash
python scripts/prepare_data.py [water.csv] [telemetry.csv]
```
This validates required columns, duplicates, missing values, district-name matching and polygon coverage; regenerates `backend/data/district-water-data.json`, `frontend/public/data/tamil-nadu-districts.geojson` and `docs/validation-report.json`. Missing values stay `null` and are excluded from scoring (not zero-filled). Restart the backend after re-running.

## Geography
37 of 38 districts have boundaries (source: github.com/udit-001/india-maps-data, check its license before redistributing). **Mayiladuthurai has no polygon** in that file; it appears in tables/charts and is flagged "no boundary" on the map. No geometry was invented. Name aliases (e.g. Kancheepuram→Kanchipuram) live in `scripts/prepare_data.py`.

## Structure
`ai-service/` FastAPI risk engine (single source of truth for score) · `backend/` Express API `/api/v1` (owns deficit, allocation, alerts, CSV) · `frontend/` React UI · `scripts/` data pipeline · `docs/`.

## Synthetic / illustrative values
Allocation demo deficits (Chennai 120, Madurai 70, Coimbatore 50 MLD) and 100 MLD pool; factor weights/thresholds; scenario sliders; the entire water CSV (unverified).

## Not done / outstanding
Real IMD / CWC / CGWB / TN-WRD integrations; verified 38-district boundaries; a trained & chronologically validated forecasting model; river telemetry (4 stations only) is displayed but not used in scoring; no browser/E2E test suite (frontend verified by build + headless smoke test of all 10 pages).
