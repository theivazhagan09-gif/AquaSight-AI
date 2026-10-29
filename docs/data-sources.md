# Data sources
| Dataset | Type | Notes |
|---|---|---|
| TN_Water_Shortage_ML_ready.csv | estimated / unverified | 38 districts × 24 quarters (2021-Q1…2026-Q4). 2026-Q4 rows flagged `Is_Projected=1`. Provenance undocumented; no retrieval date or URL claimed. |
| rwl_tel_hr_tamil_nadu_sw_gw CSV | observed telemetry (hourly river level, m) | 4 stations (Chennai, Cuddalore, Ramanathapuram, Sivaganga), 2026-01-01→2026-10-27. Displayed only; not in score. |
| District boundaries | external GeoJSON | udit-001/india-maps-data, 37 districts; license to be confirmed. |
Future adapters (IMD, CWC, CGWB, TN-WRD) are NOT integrated or tested. See `validation-report.json`.
