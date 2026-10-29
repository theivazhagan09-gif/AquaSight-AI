# API (all under /api/v1, JSON `{ok, data, meta}`; errors `{ok:false, error:{message}}`)
Common query: `period=YYYY-MM-DD` (quarter start), `demandGrowth` [-50,100], `supplyChange` [-80,100], `rainfallChange` [-100,200].
GET /health · /periods · /districts · /districts/:id · /water/summary · /water/trend · /water/map?metric=rainfall|availability|demand|supply|deficit|risk|scenario|priority|coverage · /analytics/rainfall · /analytics/demand-supply · /telemetry · /alerts?severity=&district= · /reports/export (CSV with metadata header)
POST /predictions/assess `{rainfall_anomaly_mm, storage_pct, groundwater_m_bgl, demand_mld, supply_mld, demand_growth_pct?}` (nulls = missing)
POST /allocations/simulate `{period?, scenario?, pool_mld, essential_weight, districts:[{district_id, essential_factor, deficit_override_mld?}]}`
Python: GET /health, POST /predict/risk (Pydantic-validated, 422 on bad input).
