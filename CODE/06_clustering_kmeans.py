import os
import pandas as pd
import numpy as np
import json
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans

DATA_DIR = "../DB"
DASH_DATA_DIR = "../Dashboard/data"

def run_clustering():
    print("Iniciando Clustering Predictivo (Bono K-Means)...")
    players_df = pd.read_csv(os.path.join(DATA_DIR, "players.csv"))
    
    # Queremos agrupar a los perfiles ofensivos: Delanteros y Mediocampistas
    # Filtro básico: más de 500 minutos jugados
    df_cluster = players_df[(players_df['minutes'] > 500)]
    
    # Features para el clustering de estilo de juego ofensivo:
    # goals_scored, assists, expected_goals (xG), expected_assists (xA), ict_index (influence/creativity/threat)
    features = ['goals_scored', 'assists', 'xG', 'xA', 'ict_index']
    
    # Rellenar nulos
    X = df_cluster[features].fillna(0)
    
    # Escalar datos (CRUCIAL para K-Means)
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Entrenar K-Means con K=4 (ej: Elite, Creadores, Finalizadores, Promedio)
    kmeans = KMeans(n_clusters=4, random_state=42, n_init='auto')
    df_cluster['Cluster'] = kmeans.fit_predict(X_scaled)
    
    # Preparar datos visuales para el Dashboard (Scatter Plot)
    # Mostraremos xG vs xA para ver los perfiles
    # Guardaremos el json con Name, Team, xG, xA, y Cluster
    
    cluster_names = {
        0: "Promedio / Soporte",
        1: "Élite Total (Goles y Creatividad)",
        2: "Finalizadores Puros (Alta xG)",
        3: "Creadores Estelares (Alta xA)"
    }
    
    out_data = []
    for _, row in df_cluster.iterrows():
        # Tomar top 150 jugadores relevantes para no sobrecargar visualizacion
        if float(row['xG']) > 1.5 or float(row['xA']) > 1.5:
            out_data.append({
                "name": row['web_name'],
                "team": row['team'],
                "xG": float(row['xG']),
                "xA": float(row['xA']),
                "ict": float(row['ict_index']),
                "cluster_id": int(row['Cluster']),
                "cluster_name": cluster_names.get(int(row['Cluster']), "Indefinido")
            })
        
    with open(os.path.join(DASH_DATA_DIR, "player_clusters.json"), "w") as f:
        json.dump(out_data, f)
        
    print(f"Bono de Clustering Finalizado: {len(out_data)} jugadores exportados.")

if __name__ == "__main__":
    run_clustering()
