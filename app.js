// ── TRIPLE-LAYER BADGE SECURITY SYSTEM ──
// Primary source: ESPN CDN (High-speed)
const teamLogos = {
    "Arsenal": "https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/359.png",
    "Aston Villa": "https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/362.png",
    "Bournemouth": "https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/349.png",
    "Brentford": "https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/337.png",
    "Brighton": "https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/331.png",
    "Burnley": "https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/379.png",
    "Chelsea": "https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/363.png",
    "Crystal Palace": "https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/384.png",
    "Everton": "https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/368.png",
    "Fulham": "https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/370.png",
    "Leeds": "https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/357.png",
    "Liverpool": "https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/364.png",
    "Man City": "https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/382.png",
    "Man United": "https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/360.png",
    "Newcastle": "https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/361.png",
    "Nott'm Forest": "https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/393.png",
    "Sunderland": "https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/366.png",
    "Tottenham": "https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/367.png",
    "West Ham": "https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/371.png",
    "Wolves": "https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/380.png"
};

// Mirror source: GitHub Raw Assets (Resilient)
const teamLogosMirror = {
    "Arsenal": "https://raw.githubusercontent.com/luukhopman/football-logos/master/logos/GB1/Arsenal.png",
    "Aston Villa": "https://raw.githubusercontent.com/luukhopman/football-logos/master/logos/GB1/Aston%20Villa.png",
    "Bournemouth": "https://raw.githubusercontent.com/luukhopman/football-logos/master/logos/GB1/AFC%20Bournemouth.png",
    "Brentford": "https://raw.githubusercontent.com/luukhopman/football-logos/master/logos/GB1/Brentford%20FC.png",
    "Brighton": "https://raw.githubusercontent.com/luukhopman/football-logos/master/logos/GB1/Brighton%20%26%20Hove%20Albion.png",
    "Burnley": "https://raw.githubusercontent.com/luukhopman/football-logos/master/logos/GB1/Burnley%20FC.png",
    "Chelsea": "https://raw.githubusercontent.com/luukhopman/football-logos/master/logos/GB1/Chelsea%20FC.png",
    "Crystal Palace": "https://raw.githubusercontent.com/luukhopman/football-logos/master/logos/GB1/Crystal%20Palace.png",
    "Everton": "https://raw.githubusercontent.com/luukhopman/football-logos/master/logos/GB1/Everton%20FC.png",
    "Fulham": "https://raw.githubusercontent.com/luukhopman/football-logos/master/logos/GB1/Fulham%20FC.png",
    "Leeds": "https://raw.githubusercontent.com/luukhopman/football-logos/master/logos/GB1/Leeds%20United.png",
    "Liverpool": "https://raw.githubusercontent.com/luukhopman/football-logos/master/logos/GB1/Liverpool%20FC.png",
    "Man City": "https://raw.githubusercontent.com/luukhopman/football-logos/master/logos/GB1/Manchester%20City.png",
    "Man United": "https://raw.githubusercontent.com/luukhopman/football-logos/master/logos/GB1/Manchester%20United.png",
    "Newcastle": "https://raw.githubusercontent.com/luukhopman/football-logos/master/logos/GB1/Newcastle%20United.png",
    "Nott'm Forest": "https://raw.githubusercontent.com/luukhopman/football-logos/master/logos/GB1/Nottingham%20Forest.png",
    "Sunderland": "https://raw.githubusercontent.com/luukhopman/football-logos/master/logos/GB1/Sunderland%20AFC.png",
    "Tottenham": "https://raw.githubusercontent.com/luukhopman/football-logos/master/logos/GB1/Tottenham%20Hotspur.png",
    "West Ham": "https://raw.githubusercontent.com/luukhopman/football-logos/master/logos/GB1/West%20Ham%20United.png",
    "Wolves": "https://raw.githubusercontent.com/luukhopman/football-logos/master/logos/GB1/Wolverhampton%20Wanderers.png"
};

function getLogos(teamName) {
    return {
        primary: teamLogos[teamName] || null,
        mirror: teamLogosMirror[teamName] || null
    };
}

let matchupsData = null;
let edaData = null;
let clusterData = null;

// ==========================================
// 1. DATA FETCHING (PREDICTOR & SHOTMAP)
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    
    // 1.1 Matchups Data
    try {
        const reqMat = await fetch('./data/matchups.json');
        const jsmat = await reqMat.json();
        matchupsData = jsmat.predictions;
        const teamsList = jsmat.teams;

        // UI Selectors
        const hSelect = document.getElementById('homeTeam');
        const aSelect = document.getElementById('awayTeam');
        hSelect.innerHTML = '<option value="">— Seleccionar —</option>';
        aSelect.innerHTML = '<option value="">— Seleccionar —</option>';
        
        teamsList.forEach(t => {
            hSelect.add(new Option(t, t));
            aSelect.add(new Option(t, t));
        });

        // Eventos para cambiar escudo con sistema de triple respaldo
        hSelect.addEventListener('change', () => {
            const hBanner = document.getElementById('hBanner');
            const team = hSelect.value;
            const logoSet = getLogos(team);
            const avatarFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(team)}&background=060608&color=b9ff4b&size=512&rounded=true&bold=true`;
            
            let attempt = 0;
            hBanner.onerror = () => {
                attempt++;
                if (attempt === 1 && logoSet.mirror) {
                    hBanner.src = logoSet.mirror;
                } else {
                    hBanner.onerror = null;
                    hBanner.src = avatarFallback;
                }
            };
            
            hBanner.src = logoSet.primary || avatarFallback;
            hBanner.style.display = 'block';
            runPredictor();
        });
        
        aSelect.addEventListener('change', () => {
            const aBanner = document.getElementById('aBanner');
            const team = aSelect.value;
            const logoSet = getLogos(team);
            const avatarFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(team)}&background=060608&color=ff4b6e&size=512&rounded=true&bold=true`;
            
            let attempt = 0;
            aBanner.onerror = () => {
                attempt++;
                if (attempt === 1 && logoSet.mirror) {
                    aBanner.src = logoSet.mirror;
                } else {
                    aBanner.onerror = null;
                    aBanner.src = avatarFallback;
                }
            };
            
            aBanner.src = logoSet.primary || avatarFallback;
            aBanner.style.display = 'block';
            runPredictor();
        });
        
        // Trigger setup inicial
        if(teamsList.length > 0) {
            hSelect.value = teamsList[0];
            aSelect.value = teamsList[1] || teamsList[0];
            hSelect.dispatchEvent(new Event('change'));
            aSelect.dispatchEvent(new Event('change'));
        }
        
    } catch (err) {
        console.error("Matchups load err:", err);
    }
    
    // Boton Ejecutar Manual
    document.getElementById('predictBtn').addEventListener('click', runPredictor);
    
    // 1.2 Shot Map y EDA
    try {
        const shotreq = await fetch('./data/shots_map.json');
        const shots = await shotreq.json();
        generateShotMap(shots);
        
        const edareq = await fetch('./data/eda_stats.json');
        edaData = await edareq.json();
        
        try {
            const clusreq = await fetch('./data/player_clusters.json');
            clusterData = await clusreq.json();
        } catch(e) { console.warn("No cluster data yet"); }
        
        generateEDA();
    } catch(err) {
        console.error("Dashboard JSON load error:", err);
    }
});


// ==========================================
// 2. LOGICA NUCLEAR DEL PREDICCIÓN CON DATA REAL
// ==========================================
function runPredictor() {
    const home = document.getElementById('homeTeam').value;
    const away = document.getElementById('awayTeam').value;
    const btn = document.getElementById('predictBtn');
    
    if(!home || !away || home === away || !matchupsData) { 
        return; 
    }
    
    btn.disabled = true;
    const predData = matchupsData[home][away];
    
    // Probabilidades exportadas del modelo ML real
    let h = predData.probs.HomeWin;
    let d = predData.probs.Draw;
    let a = predData.probs.AwayWin;
    const goals = predData.expected_total_goals.toFixed(1);

    const ph = document.getElementById('prob-home');
    const pd = document.getElementById('prob-draw');
    const pa = document.getElementById('prob-away');
    const pg = document.getElementById('exp-goals');
    const bh = document.getElementById('bar-home');
    const bd = document.getElementById('bar-draw');
    const ba = document.getElementById('bar-away');

    // Animación counter fluidos
    function countUp(el, target, suffix, duration){
        const start = performance.now();
        const from = parseFloat(el.textContent) || 0;
        function step(now){
            const p = Math.min((now-start)/duration, 1);
            const ease = 1 - Math.pow(1-p, 3);
            el.textContent = (from + (target-from)*ease).toFixed(1) + suffix;
            if(p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    countUp(ph, h, '%', 800);
    countUp(pd, d, '%', 900);
    countUp(pa, a, '%', 1000);
    
    setTimeout(() => { pg.textContent = goals; }, 600);
    setTimeout(() => {
        bh.style.width = Math.round(h) + '%';
        bd.style.width = Math.round(d) + '%';
        ba.style.width = Math.round(a) + '%';
        btn.disabled = false;
    }, 300);
}


// ==========================================
// 3. SHOT MAP REAL GENERATOR
// ==========================================
function generateShotMap(shotsData) {
    const container = document.getElementById('shot-dots');
    container.innerHTML = '';
    const tooltip = document.getElementById('tooltip');

    shotsData.forEach((shot, i) => {
        const isGoal = shot.is_goal === 1;
        
        // Coordenadas: X va de arco izquierdo a derecho (100).
        // Y va de borde superior a inferior.
        const x = shot.x;
        const y = shot.y;
        const xg = shot.xg_prob;
        
        const dot = document.createElement('div');
        dot.className = 'shot-dot ' + (isGoal ? 'goal' : 'miss');
        
        const size = Math.max(5, Math.min(20, xg * 24)); // Normalización estetica del tamaño
        
        dot.style.cssText = `
            left:${x}%; top:${y}%;
            width:${size}px; height:${size}px;
            background-color: ${isGoal ? 'rgba(185, 255, 75, 0.8)' : 'rgba(255, 75, 110, 0.5)'};
            border: 1px solid #000;
            box-shadow: ${isGoal ? '0 0 8px rgba(185,255,75,0.4)' : 'none'};
            animation: dotAppear 0.3s ${i * 4}ms both;
        `;
        
        // Tooltip Interacciones
        dot.addEventListener('mouseenter', (e) => {
            document.getElementById('tt-player').innerText = shot.player_name || 'Desconocido';
            document.getElementById('tt-team').innerText = shot.team_name;
            document.getElementById('tt-match').innerText = shot.match_name || 'Desconocido';
            document.getElementById('tt-date').innerText = shot.date || '';
            document.getElementById('tt-xg').innerText = (xg * 100).toFixed(2) + '%';
            document.getElementById('tt-goal').innerText = isGoal ? 'SÍ (Gol)' : 'Fallo';
            tooltip.classList.add('visible');
            tooltip.style.left = `${e.clientX + 15}px`;
            tooltip.style.top = `${e.clientY + 15}px`;
        });
        
        dot.addEventListener('mouseout', () => {
            tooltip.classList.remove('visible');
        });

        container.appendChild(dot);
    });
}


function generateEDA() {
    if(!edaData) return;
    
    // ---- CHARTS CONFIGURATION ----
    try {
        if(typeof window.ChartDataLabels !== 'undefined') {
            Chart.register(window.ChartDataLabels);
        }
        Chart.defaults.color = 'rgba(232, 232, 240, 0.4)';
        Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.08)';
        Chart.defaults.font.family = "'JetBrains Mono', monospace";

        // 1. Gráfico Real vs xG
        const labels1 = edaData.team_xg.map(t => t.team_name);
        const real_g = edaData.team_xg.map(t => t.real_goals);
        const exp_g = edaData.team_xg.map(t => parseFloat(t.expected_goals.toFixed(1)));

        new Chart(document.getElementById('xgChart').getContext('2d'), {
            type: 'bar',
            data: {
                labels: labels1,
                datasets: [
                    {
                        label: 'Goles Reales',
                        data: real_g,
                        backgroundColor: '#b9ff4b',
                        borderRadius: 2
                    },
                    {
                        label: 'Expected Goals',
                        data: exp_g,
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        borderColor: 'rgba(255,255,255,0.5)',
                        borderWidth: 1,
                        borderRadius: 2
                    }
                ]
            },
            options: { 
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' }, datalabels: { display: false } }
            }
        });

        // 2. Tasa de Conversión x Distancia
        const labels2 = edaData.distance_conversion.map(d => d.distance_bin);
        const conv_rates = edaData.distance_conversion.map(d => (d.conversion_rate * 100).toFixed(1));

        new Chart(document.getElementById('distChart').getContext('2d'), {
            type: 'line',
            data: {
                labels: labels2,
                datasets: [{
                    label: 'Conversión %',
                    data: conv_rates,
                    borderColor: '#4b8fff',
                    backgroundColor: 'rgba(75, 143, 255, 0.1)',
                    fill: true, tension: 0.4,
                    pointBackgroundColor: '#b9ff4b',
                    pointHoverRadius: 8
                }]
            },
            options: { 
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false }, datalabels: { display: false } },
                scales: { y: { beginAtZero: true, suggestedMax: 40, ticks: { callback: v => v + '%' }} }
            }
        });

        // 3. Imbalance (Goles vs Fallos)
        const pieLabels = edaData.imbalance.map(d => d.name);
        const pieData = edaData.imbalance.map(d => d.value);

        new Chart(document.getElementById('pieChart').getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: pieLabels,
                datasets: [{
                    data: pieData,
                    backgroundColor: ['#b9ff4b', '#ff4b6e'],
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: { 
                responsive: true, maintainAspectRatio: false, cutout: '75%',
                plugins: { legend: { position: 'bottom' }, datalabels: { display: false } }
            }
        });
        
        // 4. Scatter Plot: K-Means Clustering
        if (clusterData && document.getElementById('clusterChart')) {
            const colors = ['rgba(232, 232, 240, 0.4)', '#b9ff4b', '#ff4b6e', '#4b8fff'];
            const datasets = [0,1,2,3].map(cid => {
                const players = clusterData.filter(p => p.cluster_id === cid);
                return {
                    label: players.length > 0 ? players[0].cluster_name : 'Clúster ' + cid,
                    data: players.map(p => ({ x: p.xA, y: p.xG, player: p.name, team: p.team })),
                    backgroundColor: colors[cid],
                    borderColor: 'rgba(0,0,0,0.5)',
                    pointRadius: 5, pointHoverRadius: 8
                };
            }).filter(d => d.data.length > 0);

            new Chart(document.getElementById('clusterChart').getContext('2d'), {
                type: 'scatter',
                data: { datasets },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom', labels: { boxWidth: 10, padding: 10 } },
                        tooltip: {
                            callbacks: {
                                label: function(ctx) { return `${ctx.raw.player} (${ctx.raw.team}) | xA: ${ctx.raw.x.toFixed(2)} | xG: ${ctx.raw.y.toFixed(2)}`; }
                            }
                        },
                        datalabels: { display: false }
                    },
                    scales: {
                        x: { title: { display: true, text: 'Expected Assists (xA)', color: 'rgba(255,255,255,0.5)' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                        y: { title: { display: true, text: 'Expected Goals (xG)', color: 'rgba(255,255,255,0.5)' }, grid: { color: 'rgba(255,255,255,0.05)' } }
                    }
                }
            });
        }
        
    } catch(err) {
        console.error("Error generating EDA Charts:", err);
    }
}

// ==========================================
// 4. ANIMATED CANVAS BACKGROUND
// ==========================================
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let W, H, particles=[], gridLines=[];
let scrollY = 0;
let mouseX = 0.5, mouseY = 0.5;

function initCanvasSizes(){
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
}
initCanvasSizes();
window.addEventListener('resize', initCanvasSizes);
window.addEventListener('scroll', () => { scrollY = window.scrollY; });
window.addEventListener('mousemove', e => { mouseX=e.clientX/W; mouseY=e.clientY/H; });

class Particle {
    constructor(){ this.reset(); }
    reset(){
        this.x = Math.random()*W;
        this.y = Math.random()*H;
        this.vx = (Math.random()-0.5)*0.4;
        this.vy = (Math.random()-0.5)*0.4;
        this.size = Math.random()*1.5+0.3;
        this.alpha = Math.random()*0.4+0.1;
        this.color = Math.random()<0.6 ? '185,255,75' : Math.random()<0.5 ? '75,143,255' : '255,75,110';
        this.life = 0;
        this.maxLife = 200+Math.random()*300;
    }
    update(){
        this.x += this.vx + (mouseX-0.5)*0.3;
        this.y += this.vy + (mouseY-0.5)*0.2;
        this.life++;
        if(this.x<0||this.x>W||this.y<0||this.y>H||this.life>this.maxLife) this.reset();
    }
    draw(){
        const progress = this.life/this.maxLife;
        const fade = progress<0.1 ? progress/0.1 : progress>0.9 ? (1-progress)/0.1 : 1;
        ctx.globalAlpha = this.alpha*fade;
        ctx.fillStyle = `rgb(${this.color})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI*2);
        ctx.fill();
    }
}
for(let i=0; i<30; i++) particles.push(new Particle());

class GridLine {
    constructor(){ this.reset(); }
    reset(){
        this.x = Math.random()*W;
        this.y = Math.random()*H;
        this.len = 40+Math.random()*120;
        this.angle = Math.random()<0.5 ? 0 : Math.PI/2;
        this.alpha = 0;
        this.speed = 0.003+Math.random()*0.003;
        this.progress = 0;
    }
    update(){
        this.progress += this.speed;
        if(this.progress>=1){ this.reset(); }
    }
    draw(){
        const p = this.progress;
        const fade = p<0.2 ? p/0.2 : p>0.8 ? (1-p)/0.2 : 1;
        ctx.globalAlpha = 0.08*fade;
        ctx.strokeStyle = '#b9ff4b';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        const end = p*this.len;
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + Math.cos(this.angle)*end, this.y + Math.sin(this.angle)*end);
        ctx.stroke();
    }
}
for(let i=0; i<8; i++) gridLines.push(new GridLine());

function drawHexGrid(){
    const size = 120; // Aumentar tamaño para dibujar muchos menos hexágonos
    const cols = Math.ceil(W/size)+2;
    const rows = Math.ceil(H/size)+2;
    const scrollOffset = (scrollY*0.05)%(size*1.732);

    ctx.globalAlpha = 0.03;
    ctx.strokeStyle = '#b9ff4b';
    ctx.lineWidth = 0.5;

    for(let row=0; row<rows+1; row++){
        for(let col=0; col<cols; col++){
            const x = col*size*1.5 - size + (mouseX-0.5)*20;
            const y = row*size*0.866*2 - scrollOffset + (row%2)*size*0.866 + (mouseY-0.5)*15;
            ctx.beginPath();
            for(let i=0; i<6; i++){
                const a = (i*60-30)*Math.PI/180;
                const px = x+size*0.8*Math.cos(a);
                const py = y+size*0.8*Math.sin(a);
                i===0 ? ctx.moveTo(px,py) : ctx.lineTo(px,py);
            }
            ctx.closePath();
            ctx.stroke();
        }
    }
}

class FlowLine {
    constructor(){ this.reset(); }
    reset(){
        this.x = -200;
        this.y = Math.random()*H;
        this.width = 0.5+Math.random();
        this.speed = 1+Math.random()*2;
        this.alpha = 0.03+Math.random()*0.05;
        this.color = Math.random()<0.7 ? '185,255,75' : '75,143,255';
        this.points = [{x:this.x, y:this.y}];
        this.waviness = (Math.random()-0.5)*0.5;
    }
    update(){
        const last = this.points[this.points.length-1];
        const nx = last.x + this.speed;
        const ny = last.y + Math.sin(nx*0.01+this.waviness*10)*0.8;
        this.points.push({x:nx, y:ny});
        if(this.points.length > 150) this.points.shift();
        if(last.x > W+200) this.reset();
    }
    draw(){
        if(this.points.length<2) return;
        ctx.globalAlpha = this.alpha;
        ctx.strokeStyle = `rgba(${this.color},1)`;
        ctx.lineWidth = this.width;
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
        for(let i=1;i<this.points.length;i++){ ctx.lineTo(this.points[i].x, this.points[i].y); }
        ctx.stroke();
    }
}
const flowLines = [];
for(let i=0; i<5; i++){
    const fl = new FlowLine();
    fl.x = Math.random()*W;
    fl.points = [{x:fl.x, y:fl.y}];
    flowLines.push(fl);
}

function connectParticles(){
    for(let i=0; i<particles.length; i++){
        for(let j=i+1; j<particles.length; j++){
            const dx = particles[i].x-particles[j].x;
            const dy = particles[i].y-particles[j].y;
            const dist = Math.sqrt(dx*dx+dy*dy);
            if(dist<100){
                ctx.globalAlpha = (1-dist/100)*0.06;
                ctx.strokeStyle='#b9ff4b';
                ctx.lineWidth=0.3;
                ctx.beginPath();
                ctx.moveTo(particles[i].x,particles[i].y);
                ctx.lineTo(particles[j].x,particles[j].y);
                ctx.stroke();
            }
        }
    }
}

function animCanvas(){
    ctx.clearRect(0,0,W,H);
    const grad = ctx.createRadialGradient(W*mouseX, H*mouseY, 0, W*0.5, H*0.5, Math.max(W,H));
    grad.addColorStop(0, 'rgba(15,25,10,0.95)');
    grad.addColorStop(1, 'rgba(6,6,8,0.98)');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,W,H);

    drawHexGrid();
    flowLines.forEach(fl=>{ fl.update(); fl.draw(); });
    gridLines.forEach(gl=>{ gl.update(); gl.draw(); });
    ctx.globalAlpha=1;
    particles.forEach(p=>{ p.update(); p.draw(); });
    connectParticles();

    requestAnimationFrame(animCanvas);
}
animCanvas();


// ==========================================
// 6. SCROLL ANIMATIONS / REVEALS / OBSERVERS
// ==========================================
function animateCounter(el){
    const target = parseFloat(el.dataset.target);
    const prefix = el.dataset.prefix||'';
    const suffix = el.dataset.suffix||'';
    const duration = 1500;
    const start = performance.now();
  
    function step(now){
        const p = Math.min((now-start)/duration,1);
        const ease = 1-Math.pow(1-p,4);
        const val = ease*target;
        
        if (prefix === '0.') {
            el.textContent = '0.' + String(Math.round(val)).padStart(3,'0');
        } else {
            // Keep decimals for exact metrics if needed
            el.textContent = prefix + (val % 1 !== 0 ? val.toFixed(1) : Math.round(val)) + suffix;
        }
        if(p<1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

const navbar = document.getElementById('navbar');
const reveals = document.querySelectorAll('.reveal');

const observer = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
        if(e.isIntersecting){
            e.target.classList.add('visible');
            // Trigger counter animation
            const counter = e.target.querySelector('.counter');
            if(counter && !counter.dataset.counted){
                counter.dataset.counted = true;
                animateCounter(counter);
            }
        }
    });
}, { threshold:0.15 });

reveals.forEach(el=>observer.observe(el));

document.querySelectorAll('.metric-card').forEach(card => { observer.observe(card); });

window.addEventListener('scroll',()=>{
    navbar.classList.toggle('scrolled', window.scrollY>50);
});

// VS Bar Animator
const vsObserver = new IntersectionObserver(entries=>{
    entries.forEach(e=>{
        if(e.isIntersecting){
            setTimeout(()=>{
                const barOurs = document.getElementById('bar-ours');
                const barBet = document.getElementById('bar-bet');
                if(barOurs) barOurs.style.width='86.4%'; // 43.3 relative to 50.1
                if(barBet) barBet.style.width='100%';
            }, 400);
            vsObserver.disconnect();
        }
    });
}, {threshold:0.3});

const vsSection = document.getElementById('vs');
if(vsSection) vsObserver.observe(vsSection);
