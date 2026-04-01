# Taller 2 - Predicción y Análisis (Machine Learning) - Premier League Datos Opta

## Integrantes
- **[Jhabes Esteban Rodriguez Enriquez]** 


## 🌐 Enlaces del Proyecto
- **Dashboard Desplegado:** [https://lustrous-kitten-3e26b4.netlify.app/](https://lustrous-kitten-3e26b4.netlify.app/)

## 🛠 Descripción del Approach y Features
Para este proyecto se construyó un pipeline de Machine Learning estructurado para predecir eventos deportivos usando métricas avanzadas:
1. **Feature Engineering (xG):** Se calcularon las coordenadas espaciales y distancia trigonométrica minimizando el sesgo direccional de ataque, filtrando características Json como Tiros de Esquina o Toques Previos.
2. **xG Model:** Se utilizaron ensambles de árboles (XGBoost Classifier) dado su alto rendimiento para mapear interacciones no lineales entre las coordenadas del tiro y factores como contraataques. Obtuvo el mejor ROC-AUC validado mediante Stratified K-Fold.
3. **Match Predictor:** Para evitar el "data leakage", calculamos *Rolling Averages* (promedios móviles históricos) del rendimiento de los últimos 5 partidos antes del silbatazo inicial. Usamos un XGBoost H/D/A y Ridge Regressor.
4. **Bono de Clustering (K-Means):** Aplicado sobre una base transpuesta de jugadores, agrupándolos usando métricas estandarizadas de *Expected Goals*, *Expected Assists* e *ICT Index* para descubrir a los creadores de juego vs definidores puros.

## 🚀 Instrucciones para Ejecutar
1. Instalar las dependencias exactas usando pip:
   ```bash
   pip install -r requirements.txt
   ```
2. Ejecutar el Notebook Principal:
   Abre y ejecuta las celdas secuencialmente el archivo `Taller2_Main_Notebook.ipynb`. Allí se incluye el pipeline consolidado desde Ingesta hasta EDA y Modelado.

3. (Opcional) Regenerar datos del Dashboard y Pipeline Local:
   Entrar a la carpeta `CODE` y correr los scripts en orden.
   ```bash
   cd CODE
   python 01_data_ingestion.py
   python 02_feature_engineering.py
   # etc...
   ```
4. Ver el Dashboard Localmente:
   Realizar host en el puerto 8000 desde la raíz del proyecto.
   ```bash
   cd Dashboard
   python -m http.server 8000
   ```
