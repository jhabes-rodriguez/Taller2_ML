import os
import pandas as pd
import time
import requests

# Configuración Base
BASE_URL = "https://premier.72-60-245-2.sslip.io"
DATA_DIR = "../DB"

# Asegurarse de que el directorio DB exista
os.makedirs(DATA_DIR, exist_ok=True)

# Lista de endpoints de exportación
# Usamos los endpoints de /export para descargar los datos completos
endpoints = {
    "players": "/export/players",
    "matches": "/export/matches",
    "events": "/export/events",
    "player_history": "/export/player_history"
}

def descargar_datos():
    print("Iniciando la descarga de datos...")
    
    for name, endpoint in endpoints.items():
        url = f"{BASE_URL}{endpoint}"
        csv_path = os.path.join(DATA_DIR, f"{name}.csv")
        
        print(f"\n[{name}] Descargando desde: {url}")
        
        try:
            start_time = time.time()
            
            # Para el dataset de eventos que es muy grande, le damos un timeout generoso (o directamente usamos pd.read_csv en modo chunk)
            # Como pandas lee directamente la URL, podemos hacer:
            df = pd.read_csv(url)
            
            # Guardamos localmente para no depender de la API nunca más
            df.to_csv(csv_path, index=False)
            
            end_time = time.time()
            
            print(f"[{name}] ✓ Descarga completada exitosamente.")
            print(f"[{name}] Filas: {len(df):,}, Columnas: {len(df.columns)}")
            print(f"[{name}] Guardado en: {csv_path}")
            print(f"[{name}] Tiempo de descarga: {end_time - start_time:.2f} segundos.")
            
        except Exception as e:
            print(f"[{name}] ❌ Error al descargar: {e}")

if __name__ == "__main__":
    print("-" * 50)
    print("=== SCRIPT DE INGESTA DE PREMIER LEAGUE 2025-26 ===")
    print("-" * 50)
    print("Este script descargará automáticamente todos los conjuntos de datos de la API exclusiva del taller.")
    print("Estaremos usando endpoints Bulk (/export) en lugar de la paginación estándar para mayor eficiencia.")
    
    descargar_datos()
    
    print("-" * 50)
    print("Proceso de inyección finalizado. ¡Los datos ya están locales!")
