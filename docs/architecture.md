# Architecture
React (Vite) → `/api/v1` Node/Express (routes → validators → services → repositories) → Python FastAPI `/predict/risk`.
Ownership: **Python** = stress score & category. **Node** = deficit `max(0,demand-supply)`, scenario application, allocation, alerts, CSV. No logic is duplicated.
Snapshot pipeline: dataset record → scenario adjustment → Python risk → row used by map, summary, alerts, exports (one consistent source).
Graceful degradation: AI service down → rows carry "Data unavailable (AI service down)"; UI banner shown; no mock fallback.
