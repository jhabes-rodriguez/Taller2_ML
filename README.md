# Taller 2 - Predicción y Análisis (Machine Learning) - Premier League Datos Opta

## Integrantes
- **[Jhabes Esteban Rodriguez Enriquez]** 

## 🌐 Enlaces del Proyecto
- **Dashboard Interactivo (Netlify):** [https://lustrous-kitten-3e26b4.netlify.app/](https://lustrous-kitten-3e26b4.netlify.app/)

## 🛠 Descripción del Approach y Features
Para este proyecto se construyó un pipeline de Machine Learning estructurado para predecir eventos deportivos usando métricas avanzadas:
1. **Feature Engineering (xG):** Se calcularon las coordenadas espaciales y distancia trigonométrica minimizando el sesgo direccional de ataque, filtrando características JSON como Tiros de Esquina o Toques Previos.
2. **xG Model:** Se utilizaron ensambles de árboles (XGBoost Classifier) dado su alto rendimiento para mapear interacciones no lineales entre las coordenadas del tiro y factores como contraataques. Obtuvo el mejor ROC-AUC validado mediante Stratified K-Fold.
3. **Match Predictor:** Para evitar el "data leakage", calculamos *Rolling Averages* (promedios móviles históricos) del rendimiento de los últimos 5 partidos antes del silbatazo inicial. Usamos un XGBoost H/D/A y Ridge Regressor.
4. **Bono de Clustering (K-Means):** Aplicado sobre una base transpuesta de jugadores, agrupándolos usando métricas estandarizadas de *Expected Goals*, *Expected Assists* e *ICT Index* para descubrir a los creadores de juego vs definidores puros.

## 🚀 Instrucciones para Ejecutar
1. **Instalar dependencias:**
   ```bash
   pip install -r requirements.txt
   ```
2. **Ejecutar el pipeline (Opcional):**
   Abre y ejecuta las celdas de `Taller2_Main_Notebook.ipynb` para regenerar el análisis y los modelos.

3. **Ver el Dashboard Localmente:**
   Para visualizar la interfaz Cyberpunk con los escudos oficiales:
   ```bash
   cd Dashboard
   python -m http.server 8000
   ```
   Luego abre `http://localhost:8000` en tu navegador.

## 📦 Despliegue
El proyecto está configurado para desplegarse automáticamente en **Netlify** apuntando a la carpeta `/Dashboard`. Se incluye un archivo `netlify.toml` para automatizar este proceso.
