import streamlit as st
import streamlit.components.v1 as components
import os

# 1. Configuración de la Página
st.set_page_config(
    page_title="Premier League Predictor - Cyberpunk Dashboard",
    page_icon="⚽",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Estilo para eliminar márgenes de Streamlit y que el dashboard ocupe todo
st.markdown("""
    <style>
    .main {
        padding: 0rem 0rem;
    }
    iframe {
        border: none;
    }
    </style>
    """, unsafe_allow_html=True)

# 2. Carga del Dashboard Autónomo
def load_dashboard():
    base_path = os.path.dirname(__file__)
    html_path = os.path.join(base_path, "Dashboard", "standalone_dashboard.html")
    
    if os.path.exists(html_path):
        with open(html_path, "r", encoding="utf-8") as f:
            return f.read()
    return "<h1>Error: Standalone dashboard not found. Run bundle_dashboard.py first.</h1>"

html_content = load_dashboard()

# 3. Renderizado Identico
# El alto de 1200px suele cubrir la mayoría de las secciones, ajustable según necesidad.
components.html(html_content, height=1200, scrolling=True)
