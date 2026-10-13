let manifest = {};
let currentScenario = null;
let historyStack = [];

async function init() {
    try {
        const response = await fetch('prototype-manifest.json');
        manifest = await response.json();
        renderGallery();
    } catch (e) {
        console.error("Failed to load manifest", e);
    }
    setupEventListeners();
}

function renderGallery() {
    const list = document.getElementById('scenario-list');
    list.innerHTML = '';
    manifest.scenarios.forEach(scen => {
        const card = document.createElement('div');
        card.className = 'scenario-card';
        card.innerHTML = `
            <h3>${scen.id}: ${scen.title}</h3>
            <p>${scen.description}</p>
            <button class="scenario-btn" onclick="startScenario('${scen.id}')">Start</button>
            <button class="nav-btn" onclick="resumeScenario('${scen.id}')">Resume</button>
        `;
        list.appendChild(card);
    });
}

function startScenario(id) {
    const scenario = manifest.scenarios.find(s => s.id === id);
    if (!scenario) return;
    currentScenario = scenario;
    historyStack = [scenario.screens[0].id];
    loadScreen(scenario.screens[0].id);
    switchView('scenario-view');
}

function resumeScenario(id) {
    const savedScreen = localStorage.getItem(`resume_${id}`);
    const scenario = manifest.scenarios.find(s => s.id === id);
    if (!scenario) return;
    currentScenario = scenario;
    const startId = savedScreen || scenario.screens[0].id;
    historyStack = [startId];
    loadScreen(startId);
    switchView('scenario-view');
}

function loadScreen(screenId) {
    const screen = currentScenario.screens.find(s => s.id === screenId);
    if (!screen) return;
    
    localStorage.setItem(`resume_${currentScenario.id}`, screenId);
    
    document.getElementById('scenario-title').innerText = `${currentScenario.id} - ${currentScenario.title}`;
    document.getElementById('screen-image').src = screen.image;
    
    document.getElementById('guide-task').innerText = screen.guideTask || "";
    document.getElementById('guide-action').innerText = screen.guideAction || "";
    document.getElementById('guide-control').innerText = screen.guideControl || "";
    const index = currentScenario.screens.indexOf(screen) + 1;
    document.getElementById('guide-progress').innerText = `${index} of ${currentScenario.screens.length}`;

    renderHotspots(screen.hotspots);
}

function renderHotspots(hotspots) {
    const container = document.getElementById('hotspot-container');
    container.innerHTML = '';
    const img = document.getElementById('screen-image');
    
    const isDevMode = document.getElementById('toggle-dev-mode').checked;
    const isGuideOn = document.getElementById('toggle-guide').checked;

    hotspots.forEach(hs => {
        const btn = document.createElement('button');
        btn.className = `hotspot ${isDevMode ? 'dev-mode' : ''} ${hs.isNext ? 'next-action' : ''}`;
        if (isGuideOn && hs.isNext) btn.classList.add('guide-on');
        
        btn.style.left = `${hs.x}%`;
        btn.style.top = `${hs.y}%`;
        btn.style.width = `${hs.w}%`;
        btn.style.height = `${hs.h}%`;
        btn.setAttribute('aria-label', hs.label);
        
        btn.onclick = () => {
            historyStack.push(hs.next);
            loadScreen(hs.next);
        };
        container.appendChild(btn);
    });
}

function switchView(viewId) {
    document.querySelectorAll('.view-container').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
}

function setupEventListeners() {
    document.getElementById('btn-gallery').onclick = () => switchView('gallery-view');
    document.getElementById('btn-restart').onclick = () => startScenario(currentScenario.id);
    document.getElementById('btn-back').onclick = () => {
        if (historyStack.length > 1) {
            historyStack.pop();
            loadScreen(historyStack[historyStack.length - 1]);
        }
    };
    
    document.getElementById('toggle-guide').onchange = (e) => {
        const guideContent = document.querySelector('.guide-content');
        guideContent.style.display = e.target.checked ? 'block' : 'none';
        const activeHotspot = document.querySelector('.next-action');
        if (activeHotspot) {
            e.target.checked ? activeHotspot.classList.add('guide-on') : activeHotspot.classList.remove('guide-on');
        }
    };
    
    document.getElementById('toggle-dev-mode').onchange = (e) => {
        document.querySelectorAll('.hotspot').forEach(h => {
            e.target.checked ? h.classList.add('dev-mode') : h.classList.remove('dev-mode');
        });
    };
    
    window.addEventListener('resize', () => {
        const currentScreenId = historyStack[historyStack.length - 1];
        if (currentScreenId) loadScreen(currentScreenId);
    });
}

document.addEventListener('DOMContentLoaded', init);