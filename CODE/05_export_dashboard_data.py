import os
import pandas as pd
import numpy as np
import joblib
import json

class NpEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer): return int(obj)
        if isinstance(obj, np.floating): return float(obj)
        if isinstance(obj, np.ndarray): return obj.tolist()
        return super(NpEncoder, self).default(obj)

DATA_DIR = "../DB"
MODELS_DIR = "../CODE/models"
DASH_DATA_DIR = "../Dashboard/data"
os.makedirs(DASH_DATA_DIR, exist_ok=True)

def export_dashboard_data():

    print("Exportando datos para el Dashboard Interactivo...")
    
    # 1. SHOTS + xG Probabilities para el Shot Map
    shots_df = pd.read_csv(os.path.join(DATA_DIR, "shots_processed.csv"))
    matches_df = pd.read_csv(os.path.join(DATA_DIR, "matches_enhanced.csv"))
    xg_model = joblib.load(os.path.join(MODELS_DIR, "xg_model_final.joblib"))
    xg_features = joblib.load(os.path.join(MODELS_DIR, "xg_features.joblib"))
    
    # Computar xG
    X_shots = shots_df[xg_features].fillna(0)
    shots_df['xg_prob'] = xg_model.predict_proba(X_shots)[:, 1]
    
    # Exportar solo muestra representativa para no saturar el navegador (top 500 goles y 500 fallos, o random 2000)
    # Para el Shot Map, mantendremos las coordenadas reales (0-100 x, 0-100 y)
    shots_df = shots_df.merge(matches_df[['match_id', 'home_team', 'away_team', 'date']], on='match_id', how='left')
    shots_df['match_name'] = shots_df['home_team'] + ' vs ' + shots_df['away_team']
    
    shots_export = shots_df[['x', 'y', 'is_goal', 'xg_prob', 'player_name', 'team_name', 'match_name', 'date']].dropna()
    # Tomamos muestras representativas para el mapa
    shots_sample = pd.concat([
        shots_export[shots_export['is_goal'] == 1].sample(n=min(500, len(shots_export[shots_export['is_goal'] == 1])), random_state=42),
        shots_export[shots_export['is_goal'] == 0].sample(n=min(1500, len(shots_export[shots_export['is_goal'] == 0])), random_state=42)
    ]).sample(frac=1).to_dict(orient='records')
    
    with open(os.path.join(DASH_DATA_DIR, "shots_map.json"), "w") as f:
        json.dump(shots_sample, f, cls=NpEncoder)
        
    print(f"-> Exportados {len(shots_sample)} tiros para el Shot Map interactivo.")

    # 2. EDA Data (Gráficas)
    # EDA 1: Goles Esperados (xG promedio) vs Goles Reales por Equipo
    team_xg = shots_df.groupby('team_name').agg(
        real_goals=('is_goal', 'sum'),
        expected_goals=('xg_prob', 'sum')
    ).reset_index().sort_values('real_goals', ascending=False).head(10).to_dict(orient='records')
    
    # EDA 2: Tasa de conversión por métricas (Distancia)
    shots_df['distance_bin'] = pd.cut(shots_df['distance_to_goal'], bins=[0, 10, 20, 30, 100], labels=['<10m', '10-20m', '20-30m', '>30m']).astype(str)
    dist_conv = shots_df.groupby('distance_bin')['is_goal'].mean().reset_index().rename(columns={'is_goal': 'conversion_rate'}).to_dict(orient='records')

    # EDA 3: Desbalance del Dataset
    imbalance = [
        {"name": "Goles Reales", "value": shots_df['is_goal'].sum(), "fill": "#10b981"},
        {"name": "Tiros Fallados", "value": len(shots_df) - shots_df['is_goal'].sum(), "fill": "#ef4444"}
    ]
    
    with open(os.path.join(DASH_DATA_DIR, "eda_stats.json"), "w") as f:
        json.dump({"team_xg": team_xg, "distance_conversion": dist_conv, "imbalance": imbalance}, f, cls=NpEncoder)
    print("-> Exportados datos de EDA estáticos.")

    # 3. PREDICTOR MATRIZ (Todos contra Todos)
    hda_model = joblib.load(os.path.join(MODELS_DIR, "match_hda_classifier.joblib"))
    goals_model = joblib.load(os.path.join(MODELS_DIR, "match_goals_regressor.joblib"))
    match_features = joblib.load(os.path.join(MODELS_DIR, "match_features.joblib"))
    
    teams = list(set(matches_df['home_team'].unique()) | set(matches_df['away_team'].unique()))
    
    # Extraer el ÚLTIMO 'rolling average' conocido de cada equipo
    team_latest_stats = {}
    for team in teams:
        h_games = matches_df[matches_df['home_team'] == team].sort_values('date_parsed')
        a_games = matches_df[matches_df['away_team'] == team].sort_values('date_parsed')
        
        last_h = h_games.iloc[-1] if len(h_games) > 0 else None
        last_a = a_games.iloc[-1] if len(a_games) > 0 else None
        
        if last_h is not None and (last_a is None or last_h['date_parsed'] > last_a['date_parsed']):
            # su ultimo juego fue de local
            team_latest_stats[team] = {
                'goals_scored': last_h['h_rolling_goals_scored'],
                'goals_conceded': last_h['h_rolling_goals_conceded'],
                'pts': last_h['h_rolling_pts']
            }
        elif last_a is not None:
             team_latest_stats[team] = {
                'goals_scored': last_a['a_rolling_goals_scored'],
                'goals_conceded': last_a['a_rolling_goals_conceded'],
                'pts': last_a['a_rolling_pts']
            }
            
    # Promedio de odds del dataset (imputar cuando predecimos)
    avg_odds = {}
    for c in match_features:
        if c.lower() not in ['h_rolling_goals_scored', 'h_rolling_goals_conceded', 'h_rolling_pts', 'a_rolling_goals_scored', 'a_rolling_goals_conceded', 'a_rolling_pts']:
             avg_odds[c] = matches_df[c].mean()
             
    predictions = {}
    for home_t in teams:
        predictions[home_t] = {}
        for away_t in teams:
            if home_t == away_t: continue
            if home_t not in team_latest_stats or away_t not in team_latest_stats: continue
            
            row = {}
            for col in match_features:
                if col == 'h_rolling_goals_scored': row[col] = team_latest_stats[home_t]['goals_scored']
                elif col == 'h_rolling_goals_conceded': row[col] = team_latest_stats[home_t]['goals_conceded']
                elif col == 'h_rolling_pts': row[col] = team_latest_stats[home_t]['pts']
                elif col == 'a_rolling_goals_scored': row[col] = team_latest_stats[away_t]['goals_scored']
                elif col == 'a_rolling_goals_conceded': row[col] = team_latest_stats[away_t]['goals_conceded']
                elif col == 'a_rolling_pts': row[col] = team_latest_stats[away_t]['pts']
                else: row[col] = avg_odds[col] # usar cuotas medias imparciales para la prediccion pura de stats
                
            input_df = pd.DataFrame([row]).fillna(0)
            
            # Predict
            probs = hda_model.predict_proba(input_df)[0]
            # Clases: {0: H, 1: D, 2: A}  <-- Map hecho en train
            # El orden de predict_proba corresponde a classes_
            # Revisamos el orden por si acaso
            cls_order = list(hda_model.classes_)
            
            prob_dict = {
                'HomeWin': float(probs[cls_order.index(0)]) * 100,
                'Draw': float(probs[cls_order.index(1)]) * 100,
                'AwayWin': float(probs[cls_order.index(2)]) * 100
            }
            
            pred_goals = float(goals_model.predict(input_df)[0])
            predictions[home_t][away_t] = {
                'probs': prob_dict,
                'expected_total_goals': max(0.5, pred_goals) # Nunca predecir < 0.5 goles
            }
            
    with open(os.path.join(DASH_DATA_DIR, "matchups.json"), "w") as f:
        json.dump({"teams": sorted(teams), "predictions": predictions}, f, cls=NpEncoder)
        
    print(f"-> Exportada Matriz de Predicción ({len(teams)}x{len(teams)} combinaciones).")

if __name__ == "__main__":
    export_dashboard_data()
    print("TODO EXPORTADO CORRECTAMENTE.")
