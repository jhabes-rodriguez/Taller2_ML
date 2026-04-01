import os
import pandas as pd
import numpy as np
import time

DATA_DIR = "../DB"
events_path = os.path.join(DATA_DIR, "events.csv")
matches_path = os.path.join(DATA_DIR, "matches.csv")
shots_out_path = os.path.join(DATA_DIR, "shots_processed.csv")

def feature_engineering_xg():
    import requests, json
    print("Iniciando Feature Engineering para el Modelo xG (Tiros)...")
    start_time = time.time()
    
    print("Descargando tiros directamente de la API JSON...")
    base_url = "https://premier.72-60-245-2.sslip.io"
    shots_data = requests.get(f"{base_url}/events?is_shot=true&limit=10000").json()
    df_shots = pd.DataFrame(shots_data['events'])
    print(f"Total de tiros encontrados: {df_shots.shape[0]:,}")
    
    df_shots['qualifiers_str'] = df_shots['qualifiers'].apply(json.dumps)
    
    q = df_shots['qualifiers_str']
    print("Extrayendo Qualifiers JSON usando Vectorización...")
    df_shots['is_big_chance'] = q.str.contains('BigChance', na=False, case=False).astype(int)
    df_shots['is_header'] = q.str.contains('"Head"', na=False, case=False).astype(int)
    df_shots['is_right_foot'] = q.str.contains('RightFoot', na=False, case=False).astype(int)
    df_shots['is_left_foot'] = q.str.contains('LeftFoot', na=False, case=False).astype(int)
    df_shots['is_counter'] = q.str.contains('FastBreak', na=False, case=False).astype(int)
    df_shots['from_corner'] = q.str.contains('FromCorner', na=False, case=False).astype(int)
    df_shots['is_penalty'] = q.str.contains('Penalty', na=False, case=False).astype(int)
    df_shots['is_volley'] = q.str.contains('Volley', na=False, case=False).astype(int)
    df_shots['first_touch'] = q.str.contains('FirstTouch', na=False, case=False).astype(int)
    df_shots['is_freekick'] = q.str.contains('DirectFreekick', na=False, case=False).astype(int)
    
    if 'is_goal' in df_shots.columns:
        df_shots['is_goal'] = df_shots['is_goal'].astype(int)
    else:
        df_shots['is_goal'] = (df_shots['type'].apply(lambda dt: dt.get('value') if isinstance(dt, dict) else dt) == 'Goal').astype(int)
        
    print("Calculando distancias y ángulos (Geometría Espacial Corregida)...")
    df_shots['x'] = pd.to_numeric(df_shots['x'], errors='coerce')
    df_shots['y'] = pd.to_numeric(df_shots['y'], errors='coerce')
    
    # NUEVA HEURÍSTICA DE DISTANCIA (Detectar hacia qué arco ataca midiendo mínimo al arco 0 o al 100)
    def calc_distance(row):
        x, y = row['x'], row['y']
        if pd.isna(x) or pd.isna(y): return np.nan
        dist_100 = np.sqrt((100 - x)**2 + (50 - y)**2)
        dist_0 = np.sqrt((x - 0)**2 + (50 - y)**2)
        return min(dist_100, dist_0)

    def calc_angle(row):
        x, y = row['x'], row['y']
        if pd.isna(x) or pd.isna(y): return np.nan
        dist_100 = np.sqrt((100 - x)**2 + (50 - y)**2)
        dist_0 = np.sqrt((x - 0)**2 + (50 - y)**2)
        
        if dist_100 <= dist_0: # Ataca a X=100
            return np.abs(np.arctan2(50 - y, 100 - x)) * (180 / np.pi)
        else: # Ataca a X=0
            return np.abs(np.arctan2(50 - y, x)) * (180 / np.pi)
            
    df_shots['distance_to_goal'] = df_shots.apply(calc_distance, axis=1)
    df_shots['angle_to_goal'] = df_shots.apply(calc_angle, axis=1)
    
    df_shots = df_shots.dropna(subset=['distance_to_goal', 'angle_to_goal', 'is_goal'])
    
    if 'qualifiers' in df_shots.columns:
        df_shots = df_shots.drop(columns=['qualifiers'])
    
    df_shots.to_csv(shots_out_path, index=False)
    print(f"Dataset tiros: {df_shots.shape[0]} registros")
    return pd.DataFrame() 

def prepare_match_predictor(df_events=None):
    start_time = time.time()
    
    df_matches = pd.read_csv(matches_path)
    df_matches['date_parsed'] = pd.to_datetime(df_matches['date'], format='%d/%m/%Y', errors='coerce')
    df_matches = df_matches.sort_values(by='date_parsed').reset_index(drop=True)
    
    def get_points(res):
        if res == 'H': return 3, 0
        elif res == 'A': return 0, 3
        else: return 1, 1
    
    df_matches['home_pts'], df_matches['away_pts'] = zip(*df_matches['ftr'].map(get_points))
    
    df_rolling_list = []
    
    for match_id, row in df_matches.iterrows():
        date = row['date_parsed']
        h_team = row['home_team']
        a_team = row['away_team']
        
        past_h = df_matches[(df_matches['date_parsed'] < date) & ((df_matches['home_team'] == h_team) | (df_matches['away_team'] == h_team))]
        past_a = df_matches[(df_matches['date_parsed'] < date) & ((df_matches['home_team'] == a_team) | (df_matches['away_team'] == a_team))]
        
        past_5_h = past_h.sort_values(by='date_parsed', ascending=False).head(5)
        past_5_a = past_a.sort_values(by='date_parsed', ascending=False).head(5)
        
        h_goals_scored, h_goals_conceded, h_points = 0, 0, 0
        for _, m in past_5_h.iterrows():
            if m['home_team'] == h_team:
                h_goals_scored += m['fthg']; h_goals_conceded += m['ftag']; h_points += m['home_pts']
            else:
                h_goals_scored += m['ftag']; h_goals_conceded += m['fthg']; h_points += m['away_pts']
                
        a_goals_scored, a_goals_conceded, a_points = 0, 0, 0
        for _, m in past_5_a.iterrows():
            if m['home_team'] == a_team:
                a_goals_scored += m['fthg']; a_goals_conceded += m['ftag']; a_points += m['home_pts']
            else:
                a_goals_scored += m['ftag']; a_goals_conceded += m['fthg']; a_points += m['away_pts']
        
        k_h = max(1, len(past_5_h))
        k_a = max(1, len(past_5_a))
        
        df_rolling_list.append({
            'match_id': row['id'],
            'h_rolling_goals_scored': h_goals_scored / k_h,
            'h_rolling_goals_conceded': h_goals_conceded / k_h,
            'h_rolling_pts': h_points / k_h,
            'a_rolling_goals_scored': a_goals_scored / k_a,
            'a_rolling_goals_conceded': a_goals_conceded / k_a,
            'a_rolling_pts': a_points / k_a
        })

    df_rolling = pd.DataFrame(df_rolling_list)
    df_matches_enhanced = df_matches.join(df_rolling)
    
    enhanced_path = os.path.join(DATA_DIR, "matches_enhanced.csv")
    df_matches_enhanced.to_csv(enhanced_path, index=False)
    print(f"Dataset de partidos preparado: {df_matches_enhanced.shape[0]} registros")

if __name__ == "__main__":
    df_events = feature_engineering_xg()
    prepare_match_predictor(df_events)
    print("¡Procesamiento exitoso!")
