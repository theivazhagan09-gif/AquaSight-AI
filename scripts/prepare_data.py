"""Data pipeline: CSV -> backend JSON + GeoJSON with district_id + validation report.
Usage: python scripts/prepare_data.py [water_csv] [telemetry_csv]
Append future rows to the water CSV (same columns) and re-run; missing values stay null."""
import json, sys, re, pandas as pd
from pathlib import Path
R = Path(__file__).resolve().parent.parent
water_csv = sys.argv[1] if len(sys.argv) > 1 else R/'data-input/TN_Water_Shortage_ML_ready.csv'
tele_csv = sys.argv[2] if len(sys.argv) > 2 else R/'data-input/rwl_tel_hr_tamil_nadu_sw_gw_27_2026_2030__1_.csv'
REQ = ['District_ID','District_Name','Period_Start','Rainfall_mm','Estimated_Demand_MLD','Available_Supply_MLD','Reservoir_Storage_Pct','Groundwater_Level_m_bgl']
# name normalisation / aliases (dedicated mapping module)
ALIAS = {'kancheepuram':'kanchipuram','thiruvallur':'tiruvallur','thoothukkudi':'thoothukudi','thiruvarur':'tiruvarur','villupuram':'viluppuram'}
norm = lambda s: ALIAS.get(re.sub(r'[^a-z]','',str(s).lower()), re.sub(r'[^a-z]','',str(s).lower()))
d = pd.read_csv(water_csv)
miss = [c for c in REQ if c not in d.columns]
if miss: sys.exit(f'Missing required columns: {miss}')
rep = {'water_csv':str(Path(water_csv).name),'rows':len(d),'required_columns_ok':True}
dup = d[d.duplicated(['District_ID','Period_Start'],keep=False)]
rep['duplicate_district_period_rows'] = len(dup)
d = d.drop_duplicates(['District_ID','Period_Start'])
rep['missing_values_by_column'] = {c:int(v) for c,v in d[REQ].isna().sum().items() if v}
# geography
g = json.load(open(R/'scripts/source-udit-001-tamil-nadu.geojson'))
idmap = {norm(n):i for i,n in d[['District_ID','District_Name']].drop_duplicates().values}
matched, bad = [], []
feats = []
for f in g['features']:
    k = norm(f['properties']['district'])
    if k in idmap:
        f['properties'] = {'district_id':idmap[k],'name':f['properties']['district']}; feats.append(f); matched.append(idmap[k])
    else: bad.append(f['properties']['district'])
no_poly = sorted(set(idmap.values())-set(matched))
names = {i:n for i,n in d[['District_ID','District_Name']].drop_duplicates().values}
rep['geo'] = {'features_in_file':len(g['features']),'matched_to_water_records':len(matched),'unmatched_polygons':bad,
 'districts_without_polygon':[{'district_id':i,'name':names[i]} for i in no_poly],'water_districts':len(idmap)}
json.dump({'type':'FeatureCollection','features':feats},open(R/'frontend/public/data/tamil-nadu-districts.geojson','w'))
# water records
cols = ['District_ID','Period_Start','Year','Quarter','Season','Is_Projected']+REQ[3:]+['Rainfall_Anomaly_mm','Shortage_Severity']
cols = [c for c in cols if c in d.columns]
recs = json.loads(d[cols].astype(object).where(d[cols].notna(), None).to_json(orient='records'))
districts = [{'district_id':i,'name':n,'has_polygon':i in matched} for i,n in sorted(names.items())]
# telemetry
t = pd.read_csv(tele_csv); t['ts'] = pd.to_datetime(t['Data Acquisition Time'], format='%d-%m-%Y %H:%M', errors='coerce')
col = 'River Water Level Telemetry Hourly (meter)'
tele = []
for (dist, st), x in t.groupby(['District','Station']):
    x = x.dropna(subset=['ts', col]).sort_values('ts')
    m = x.set_index('ts')[col].resample('MS').mean().round(2)
    tele.append({'district_name':dist,'district_id':idmap.get(norm(dist)),'station':st,'river':x['River'].iloc[0],'agency':x['Agency'].iloc[0],
      'lat':float(x['Latitude'].iloc[0]),'lon':float(x['Longitude'].iloc[0]),'n_readings':len(x),'first':str(x.ts.min()),'last':str(x.ts.max()),
      'mean_m':round(x[col].mean(),2),'min_m':float(x[col].min()),'max_m':float(x[col].max()),'last_value_m':float(x[col].iloc[-1]),
      'monthly_mean_m':[{'month':str(k)[:7],'value':None if pd.isna(v) else float(v)} for k,v in m.items()]})
rep['telemetry'] = {'rows':len(t),'stations':len(tele),'unparsed_timestamps':int(t.ts.isna().sum()),'unmatched_districts':[x['district_name'] for x in tele if not x['district_id']]}
rep['periods'] = sorted(d.Period_Start.unique().tolist())
rep['groundwater_range_m'] = [float(d.Groundwater_Level_m_bgl.min()), float(d.Groundwater_Level_m_bgl.max())]
json.dump({'districts':districts,'records':recs,'telemetry':tele},open(R/'backend/data/district-water-data.json','w'))
json.dump(rep,open(R/'docs/validation-report.json','w'),indent=1)
print(json.dumps(rep,indent=1)[:1800])
