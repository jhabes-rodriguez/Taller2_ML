import os
import pandas as pd
import numpy as np
import time
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import StratifiedKFold, cross_validate, train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix, roc_curve

DATA_DIR = "../DB"
MODELS_DIR = "../CODE/models"
PLOTS_DIR = "../CODE/plots"
os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(PLOTS_DIR, exist_ok=True)

shots_in_path = os.path.join(DATA_DIR, "shots_processed.csv")

def train_and_evaluate_xg():
    print("="*60)
    print(" ENTRENAMIENTO Y TOMA DE DECISIONES: MODELO xG ".center(60))
    print("="*60)
    
    # 1. Cargar Datos
    df = pd.read_csv(shots_in_path)
    print(f"Total de Tiros procesados: {len(df)}")
    
    # Análisis de Desbalance - Datos hablan por sí mismos
    goles = df['is_goal'].sum()
    no_goles = len(df) - goles
    baseline_acc = no_goles / len(df) * 100
    print(f"Distribución de Clases (Goal vs No Goal):")
    print(f"- Goles: {goles} ({goles/len(df)*100:.1f}%)")
    print(f"- No Goles: {no_goles} ({no_goles/len(df)*100:.1f}%)")
    print(f"-> Un modelo tonto que siempre diga 'No Gol' tendrá un Accuracy de: {baseline_acc:.1f}%")
    print("-> El accuracy NO es la métrica adecuada. Evaluaremos por ROC-AUC y Recall.\n")
    
    # 2. Selección de Features (Basada en correlación)
    print("Analizando correlaciones lineales (Pearson) y dependencia matemática:")
    features_candidatas = [
        'distance_to_goal', 'angle_to_goal', 'is_big_chance', 
        'is_header', 'is_right_foot', 'is_left_foot', 'is_counter', 
        'from_corner', 'is_penalty', 'is_volley', 'first_touch', 'is_freekick'
    ]
    
    corr_matrix = df[features_candidatas + ['is_goal']].corr()['is_goal'].drop('is_goal').sort_values(ascending=False)
    print("Correlación con is_goal (Targert):")
    print(corr_matrix)
    
    # 3. Preparar Matrices
    # Rellenar nulos matemáticamente seguro
    X = df[features_candidatas].fillna(0)
    y = df['is_goal']
    
    # Split train/test (80/20 estratificado para mantener proporción de goles)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    # 4. Prueba Robusta (Stratified K-Fold CV K=5)
    print("\nIniciando Validación Cruzada de 5 divisiones (K-Fold K=5).")
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    
    modelos = {
        "Regresión Logística (Requisito Base)": LogisticRegression(max_iter=1000, class_weight='balanced', random_state=42),
        "Random Forest Classifier (Avanzado)": RandomForestClassifier(n_estimators=100, max_depth=8, class_weight='balanced', random_state=42),
        "XGBoost (Avanzado)": XGBClassifier(scale_pos_weight=(no_goles/goles), max_depth=4, learning_rate=0.1, random_state=42)
    }
    
    resultados = []
    
    for nombre, modelo in modelos.items():
        print(f"Entrenando e iterando CV para: {nombre}...")
        scores = cross_validate(modelo, X_train, y_train, cv=cv, scoring=('roc_auc', 'f1', 'recall', 'accuracy'))
        
        resultados.append({
            'Modelo': nombre,
            'ROC-AUC': np.mean(scores['test_roc_auc']),
            'Recall': np.mean(scores['test_recall']),
            'F1-Score': np.mean(scores['test_f1']),
            'Accuracy': np.mean(scores['test_accuracy'])
        })
        
    df_resultados = pd.DataFrame(resultados).sort_values(by="ROC-AUC", ascending=False)
    print("\nResultados K-Fold Cross Validation (Ordenados por ROC-AUC):")
    print(df_resultados.to_string(index=False))
    
    # ==========================================
    # Decision Matematica
    # ==========================================
    # Escogemos matemáticamente el modelo con mejor ROC-AUC
    mejor_nombre = df_resultados.iloc[0]['Modelo']
    mejor_modelo = modelos[mejor_nombre]
    
    print(f"\nDECISIÓN BASADA EN DATOS: Se selecciona {mejor_nombre} porque maximiza la capacidad real de distinguir entre gol y no gol (ROC-AUC) controlando los falsos negativos.")
    
    # 5. Entrenar modelo final con todo el Train y Validar sobre Test virgen
    mejor_modelo.fit(X_train, y_train)
    y_pred = mejor_modelo.predict(X_test)
    y_proba = mejor_modelo.predict_proba(X_test)[:, 1]
    
    print(f"\nGenerando métricas Finales de {mejor_nombre} sobre Test de Validación Oculta:")
    print(f"Accuracy Final: {accuracy_score(y_test, y_pred)*100:.2f}% (Vs Baseline {baseline_acc:.1f}%)")
    print(f"ROC AUC: {roc_auc_score(y_test, y_proba):.4f}")
    print(f"Recall (Tasa verdaderos goles detectados): {recall_score(y_test, y_pred):.4f}")
    print(f"Precision: {precision_score(y_test, y_pred):.4f}")
    print(f"F1 Score: {f1_score(y_test, y_pred):.4f}")
    
    # 6. Gráfica de Importancia de Variables (Random Forest/XGBoost lo permiten por defecto)
    if hasattr(mejor_modelo, 'feature_importances_'):
        importances = mejor_modelo.feature_importances_
        indices = np.argsort(importances)[::-1]
        
        plt.figure(figsize=(10,6))
        plt.title(f"Feature Importance (Matemáticamente derivado por {mejor_nombre})")
        plt.bar(range(X.shape[1]), importances[indices], align="center")
        plt.xticks(range(X.shape[1]), X.columns[indices], rotation=45, ha='right')
        plt.tight_layout()
        plt.savefig(os.path.join(PLOTS_DIR, "xg_feature_importance.png"))
        plt.close()
        print(f"Gráfico de importancia guardado en {PLOTS_DIR}/xg_feature_importance.png")
        
        print("\nTop 3 variables predictoras reales (Matemáticas):")
        for f in range(3):
            print(f"{f+1}. {X.columns[indices][f]} (Score: {importances[indices][f]:.4f})")
            
    elif isinstance(mejor_modelo, LogisticRegression):
        coef = mejor_modelo.coef_[0]
        indices = np.argsort(np.abs(coef))[::-1]
        print("\nTop 3 variables predictoras (Coeficientes Logísticos Absolutos):")
        for f in range(3):
            print(f"{f+1}. {X.columns[indices][f]} (Coef: {coef[indices][f]:.4f})")
    
    # Matriz Confusión y ROC Curve
    cm = confusion_matrix(y_test, y_pred)
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', cbar=False)
    plt.title('Matriz de Confusión xG (Test)')
    plt.ylabel('Verdadero')
    plt.xlabel('Predicción')
    plt.savefig(os.path.join(PLOTS_DIR, "xg_confusion_matrix.png"))
    plt.close()
    
    fpr, tpr, _ = roc_curve(y_test, y_proba)
    plt.figure()
    plt.plot(fpr, tpr, color='darkorange', lw=2, label=f'ROC curve (area = {roc_auc_score(y_test, y_proba):.2f})')
    plt.plot([0, 1], [0, 1], color='navy', lw=2, linestyle='--')
    plt.xlabel('False Positive Rate')
    plt.ylabel('True Positive Rate')
    plt.title('Receiver Operating Characteristic - xG Model')
    plt.legend(loc="lower right")
    plt.savefig(os.path.join(PLOTS_DIR, "xg_roc_curve.png"))
    plt.close()
    
    # Guardar el modelo en disco para el backend/Dashboard
    joblib_path = os.path.join(MODELS_DIR, "xg_model_final.joblib")
    joblib.dump(mejor_modelo, joblib_path)
    
    # También guardamos las columnas exactas que requiere
    joblib.dump(list(X.columns), os.path.join(MODELS_DIR, "xg_features.joblib"))
    print(f"\nModelo matemático guardado en disco: {joblib_path}")
    print("Misión xG Completada.")

if __name__ == "__main__":
    train_and_evaluate_xg()
