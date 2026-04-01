document.addEventListener("DOMContentLoaded", async () => {
    // ---- 1. EXTRACCIÓN Y CATA DE LOS DATOS JSON (Fast Fetch API) ----
    const basePath = './data/';
    
    // Mostramos estado de carga general (opcional, por si el usuario tiene mala conexión)
    const probHome = document.getElementById('prob-home');
    const probDraw = document.getElementById('prob-draw');
    const probAway = document.getElementById('prob-away');
    const expGoals = document.getElementById('exp-goals');
    
    let matchupsData, edaData, shotsData, clusterData;
    try {
        [matchupsData, edaData, shotsData, clusterData] = await Promise.all([
            fetch(basePath + 'matchups.json').then(r => r.json()),
            fetch(basePath + 'eda_stats.json').then(r => r.json()),
            fetch(basePath + 'shots_map.json').then(r => r.json()),
            fetch(basePath + 'player_clusters.json').then(r => r.json())
        ]);
        console.log("Datos ML cargados exitosamente de memoria estática (Cero latencia).");
    } catch (e) {
        console.error("No se pudieron cargar los datos del Pipeline.", e);
        probHome.innerText = "Error";
        return;
    }

    // ---- 2. MATCH PREDICTOR ENGINE ----
    const homeSelect = document.getElementById('homeTeam');
    const awaySelect = document.getElementById('awayTeam');
    
    // Poblar las listas desplegables
    matchupsData.teams.forEach(team => {
        homeSelect.add(new Option(team, team));
        awaySelect.add(new Option(team, team));
    });
    // Por default enfrentamos a 2 equipos distintos (índice 0 vs 1 por ej.)
    homeSelect.selectedIndex = Math.min(0, matchupsData.teams.length-2);
    awaySelect.selectedIndex = Math.min(1, matchupsData.teams.length-1);

    document.getElementById('predictBtn').addEventListener('click', () => {
        const home = homeSelect.value;
        const away = awaySelect.value;
        
        if (home === away) {
            alert('Lógica de datos irracional: Un equipo no puede jugar contra sí mismo.');
            return;
        }

        // Consultamos la matriz matemática hiper-cruzada exportada desde Python
        const match = matchupsData.predictions[home]?.[away];
        
        if (match) {
            // Animación suave de porcentaje
            probHome.innerText = match.probs.HomeWin.toFixed(1) + '%';
            probDraw.innerText = match.probs.Draw.toFixed(1) + '%';
            probAway.innerText = match.probs.AwayWin.toFixed(1) + '%';
            expGoals.innerText = match.expected_total_goals.toFixed(2);
            
            // Highlight efímero
            [probHome, probDraw, probAway].forEach(el => {
                el.classList.add('scale-110', 'text-yellow-400');
                setTimeout(() => el.classList.remove('scale-110', 'text-yellow-400'), 400);
            });
            expGoals.classList.add('animate-pulse');
            setTimeout(() => expGoals.classList.remove('animate-pulse'), 800);
        } else {
            probHome.innerText = 'N/A';
            probDraw.innerText = 'N/A';
            probAway.innerText = 'N/A';
            expGoals.innerText = 'Sin Datos';
        }
    });

    // ---- 3. SHOT MAP INTERACTIVO (CANCHA) ----
    const shotDots = document.getElementById('shot-dots');
    const tooltip = document.getElementById('tooltip');
    
    // Iteramos los tiros y generamos puntos SPAN en las coordenadas relativas 
    // Recuerda que el Dataset tiene [0...100] de x e y. En CSS usamos 'left' (top al arco rival).
    shotsData.forEach(shot => {
        const dot = document.createElement('div');
        dot.className = 'shot-point';
        
        // Tamaño según probabilidad (Entre 4px mínimo y 24px máximo de círculo)
        const renderSize = Math.max(6, Math.min(24, shot.xg_prob * 30));
        dot.style.width = `${renderSize}px`;
        dot.style.height = `${renderSize}px`;
        
        // La cancha es vertical según nuestro css, pero los datos X van de arco local a rival, e Y de lateral a lateral.
        // Si usamos aspect-(2/1), la pintamos apaisada (largo izquierda a derecha).
        // X = Izquierda (0) a Derecha (100) -> goal rival
        // Y = Arriba (0) a Abajo (100) 
        dot.style.left = `${shot.x}%`;
        dot.style.top = `${shot.y}%`;
        
        // Color basado en is_goal real
        if (shot.is_goal) {
            dot.style.backgroundColor = '#10b981'; // Primary green
            dot.style.border = '2px solid white';
            dot.style.zIndex = '20'; // Los goles siempre encima
        } else {
            dot.style.backgroundColor = 'rgba(239, 68, 68, 0.45)'; // Rojo semi translúcido
            dot.style.zIndex = '5';
        }

        // Interacciones de Tooltip Hover Custom
        dot.addEventListener('mouseenter', (e) => {
            const rect = dot.getBoundingClientRect();
            document.getElementById('tt-player').innerText = shot.player_name || 'Desconocido';
            document.getElementById('tt-team').innerText = shot.team_name;
            document.getElementById('tt-match').innerText = shot.match_name || 'Desconocido';
            document.getElementById('tt-date').innerText = shot.date || '';
            document.getElementById('tt-xg').innerText = (shot.xg_prob * 100).toFixed(2) + '%';
            document.getElementById('tt-goal').innerText = shot.is_goal ? 'SÍ (Gol)' : 'Fallo';
            tooltip.classList.remove('opacity-0', 'hidden');
            tooltip.classList.add('opacity-100');
            
            // Posicionamiento dinámicobase (pequeño offset)
            tooltip.style.left = `${e.clientX + 15}px`;
            tooltip.style.top = `${e.clientY + 15}px`;
        });
        
        dot.addEventListener('mouseout', () => {
            tooltip.classList.remove('opacity-100');
            tooltip.classList.add('opacity-0', 'hidden');
        });

        shotDots.appendChild(dot);
    });

    // ---- 4. DUAL CHARTS (EDA) - Usando Chart.js ----
    Chart.register(ChartDataLabels);
    // Set global theme to fit darkmode
    Chart.defaults.color = '#9ca3af';
    Chart.defaults.borderColor = 'rgba(75, 85, 99, 0.3)';
    Chart.defaults.font.family = 'Inter, sans-serif';

    // Gráfico 1: Real vs Expected Goals
    const labels1 = edaData.team_xg.map(t => t.team_name);
    const real_goals = edaData.team_xg.map(t => t.real_goals);
    const exp_goals = edaData.team_xg.map(t => parseFloat(t.expected_goals.toFixed(1)));

    new Chart(document.getElementById('xgChart').getContext('2d'), {
        type: 'bar',
        data: {
            labels: labels1,
            datasets: [
                {
                    label: 'Goles Verdaderos Anotados',
                    data: real_goals,
                    backgroundColor: '#10b981',
                    borderRadius: 4
                },
                {
                    label: 'Goles Esperados (Modelo xG)',
                    data: exp_goals,
                    backgroundColor: '#3b82f6',
                    borderRadius: 4
                }
            ]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' },
                title: { display:false },
                datalabels: { display: false }
            }
        }
    });

    // Gráfico 2: Línea de distancia (Cómo decae el éxito lejos del arco)
    const labels2 = edaData.distance_conversion.map(d => d.distance_bin);
    const conv_rates = edaData.distance_conversion.map(d => (d.conversion_rate * 100).toFixed(1));

    new Chart(document.getElementById('distChart').getContext('2d'), {
        type: 'line',
        data: {
            labels: labels2,
            datasets: [{
                label: 'Tasa % de Gol',
                data: conv_rates,
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#ffffff',
                pointHoverRadius: 8
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                datalabels: { display: false }
            },
            scales: {
                y: { beginAtZero: true, suggestedMax: 40, ticks: { callback: v => v + '%' }}
            }
        }
    });

    // Gráfico 2B: Clustering Scatter Plot
    const clustersMap = {};
    clusterData.forEach(p => {
        if(!clustersMap[p.cluster_name]) clustersMap[p.cluster_name] = [];
        clustersMap[p.cluster_name].push({ x: p.xA, y: p.xG, name: p.name });
    });
    
    // Asignar colores vibrantes a los 4 clusters
    const cColors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];
    const clusterDatasets = Object.keys(clustersMap).map((k, i) => ({
        label: k,
        data: clustersMap[k],
        backgroundColor: cColors[i % 4],
        pointRadius: 4,
        pointHoverRadius: 6
    }));

    new Chart(document.getElementById('clusterChart').getContext('2d'), {
        type: 'scatter',
        data: { datasets: clusterDatasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                datalabels: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.raw.name}: xG ${ctx.raw.y.toFixed(2)}, xA ${ctx.raw.x.toFixed(2)}`
                    }
                }
            },
            scales: {
                x: { title: {display: true, text: 'Expected Assists (xA)'} },
                y: { title: {display: true, text: 'Expected Goals (xG)'} }
            }
        }
    });

    // Gráfico 3: La crueldad del fútbol (Goles vs Fallos Grales) Pie Chart
    const pieLabels = edaData.imbalance.map(d => d.name);
    const pieData = edaData.imbalance.map(d => d.value);
    const pieColors = edaData.imbalance.map(d => d.fill);

    new Chart(document.getElementById('pieChart').getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: pieLabels,
            datasets: [{
                data: pieData,
                backgroundColor: pieColors,
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            cutout: '75%',
            plugins: {
                legend: { position: 'bottom' },
                datalabels: { display: false }
            }
        }
    });

    // Ejecutar una predicción initial default para no ver interfaces vacías
    document.getElementById('predictBtn').click();
});
