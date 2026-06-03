let currentShaolin = null;
let currentOpciones = null;
let currentStatOptions = null;
let selectedOpcionIndex = null;
let selectedStatIndex = null;

const SEG_COLORS = [
  '#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444',
  '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d', '#450a0a',
];

function colorForValue(val) {
  if (val <= 10) return SEG_COLORS[0];
  if (val <= 20) return SEG_COLORS[1];
  if (val <= 30) return SEG_COLORS[2];
  if (val <= 40) return SEG_COLORS[3];
  if (val <= 50) return SEG_COLORS[4];
  if (val <= 60) return SEG_COLORS[5];
  if (val <= 70) return SEG_COLORS[6];
  if (val <= 80) return SEG_COLORS[7];
  if (val <= 90) return SEG_COLORS[8];
  return SEG_COLORS[9];
}

function renderSegBar(containerId, value) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  const maxSegs = 10;
  const filled = Math.min(value, maxSegs);
  for (let i = 0; i < maxSegs; i++) {
    const seg = document.createElement('div');
    seg.className = 'seg-bar-segment';
    seg.style.background = i < filled ? colorForValue(i + 1) : '#2a1a3ab3';
    container.appendChild(seg);
  }
}

function formatStatDiff(base, real) {
  if (base === real) return `${base}`;
  const diff = real - base;
  const cls = diff > 0 ? 'stat-bonus' : 'stat-penalty';
  const signo = diff > 0 ? '+' : '';
  return `${real} <span class="${cls}">(${base} ${signo}${diff})</span>`;
}

async function loadShaolin() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) { window.location.href = '/dashboard.html'; return; }

  try {
    const b = await API.get(`/shaolins/${id}`);
    currentShaolin = b;
    const color = getColor(b.genero);
    const xpNeeded = 6 + b.level * 2;
    const xpPercent = Math.min(100, (b.xp / xpNeeded) * 100);

    document.getElementById('shaolin-title').textContent = b.name;
    document.getElementById('shaolin-name-display').textContent = b.name;
    document.getElementById('shaolin-level').textContent = `Nivel ${b.level}`;
    const avatarEl = document.getElementById('shaolin-avatar');
    avatarEl.innerHTML = '';
    avatarEl.style.borderColor = color;
    avatarEl.appendChild(crearAvatarImg(b.genero, b.skin));

    renderQi(b);
    renderStats(b);
    renderArmas(b);
    renderHabilidades(b);
    renderHistorial(b);
    checkPendingLevel(b);
  } catch (err) {
    if (err.message.includes('Token')) { logout(); }
    else { alert('Error: ' + err.message); }
  }
}

function renderQi(b) {
  const qiMeter = document.getElementById('qi-meter');
  qiMeter.classList.remove('hidden');
  const qi = b.qi || 0;
  document.getElementById('qi-text').textContent = qi + '%';
  const fill = document.getElementById('qi-fill');
  fill.style.width = qi + '%';
  if (qi < 50) fill.style.background = '#6b7280';
  else if (qi < 75) fill.style.background = '#eab308';
  else if (qi < 90) fill.style.background = '#22c55e';
  else fill.style.background = '#f59e0b';
}

function renderStats(b) {
  const hpNum = b.real_max_hp || b.max_hp;
  document.getElementById('hp-text').innerHTML = `❤️ ${hpNum}`;

  const fuerza = b.real_fuerza || b.fuerza;
  document.getElementById('fuerza-text').innerHTML = `💪 ${formatStatDiff(b.baseFuerza || b.fuerza, fuerza)}`;
  document.getElementById('fuerza-text').title = 'Daño puño = floor(Fue×0.3) + rand(5-7)\nDaño arma = Fue + dañoArma\nCrítico = daño × 1.5';
  renderSegBar('fuerza-segbar', fuerza);

  const agilidad = b.real_agilidad || b.agilidad;
  document.getElementById('agilidad-text').innerHTML = `🏃 ${formatStatDiff(b.baseAgilidad || b.agilidad, agilidad)}`;
  document.getElementById('agilidad-text').title = 'Precisión = clamp(0.20, 0.98, 0.85 + (agiAtk - agiDef) × 0.02)\nEsquiva base = 10% + habilidades';
  renderSegBar('agilidad-segbar', agilidad);

  const velocidad = b.real_velocidad || b.velocidad;
  document.getElementById('velocidad-text').innerHTML = `⚡ ${formatStatDiff(b.baseVelocidad || b.velocidad, velocidad)}`;
  document.getElementById('velocidad-text').title = 'PA/turno = clamp(100, 250, 100 + floor(sqrt(Vel) × 12))\nIniciativa: mayor Vel ataca primero\nCrítico = Vel × 1% + habilidades';
  renderSegBar('velocidad-segbar', velocidad);

  const vitalidad = b.vitalidad || 0;
  document.getElementById('vitalidad-text').innerHTML = `🛡️ ${vitalidad}`;
  document.getElementById('vitalidad-text').title = 'HP base = 50 + Vital × 3 + Nivel × 2\nLuego × habilidades de HP% × Qi';

  const xpNeeded = 6 + b.level * 2;
  const xpPercent = Math.min(100, (b.xp / xpNeeded) * 100);
  document.getElementById('xp-fill').style.width = `${xpPercent}%`;
  document.getElementById('xp-text').textContent = `${b.xp}/${xpNeeded}`;
}

function renderArmas(b) {
  const container = document.getElementById('armas-container');
  const box = document.getElementById('armas-box');
  if (!b.armas || b.armas.length === 0) {
    box.classList.add('hidden');
    return;
  }
  box.classList.remove('hidden');

  container.innerHTML = b.armas.map(a => {
    const bMin = a.dano_min - (a.nivel - 1);
    const bMax = a.dano_max - (a.nivel - 1);
    const levels = [1, 2, 3].map(l => ({
      min: bMin + l - 1,
      max: bMax + l - 1,
    }));

    return `
      <div class="arma-card">
        <div class="arma-card-icono">🗡️</div>
        <div class="arma-card-nombre">${a.nombre}</div>
        <div class="arma-card-nivel">Nv.${a.nivel}</div>
        <div class="arma-card-dano">${a.dano_min}-${a.dano_max}</div>
        <div class="arma-tooltip">
          ${levels.map((lvl, i) => {
            const n = i + 1;
            const cls = n === a.nivel ? 'actual' : n < a.nivel ? 'pasado' : 'futuro';
            return `<div class="arma-tooltip-row ${cls}"><span>Nv.${n}</span><span>${lvl.min}-${lvl.max}</span></div>`;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');
}

function renderHabilidades(b) {
  const container = document.getElementById('habilidades-container');
  const box = document.getElementById('habilidades-box');
  if (!b.habilidades || b.habilidades.length === 0) {
    box.classList.add('hidden');
    return;
  }
  box.classList.remove('hidden');

  container.innerHTML = b.habilidades.map(h => {
    let efectoActual = '?';
    let levels = [];
    try {
      const e = JSON.parse(h.efecto);
      for (let n = 1; n <= 3; n++) {
        const v = e.valorPorNivel ? (e.valorPorNivel[n] || 0) : 0;
        if (e.stat === 'qi_boost') {
          levels.push(`×${(1 + v).toFixed(2)} Qi`);
        } else if (e.stat.includes('porcentual')) {
          levels.push(`+${Math.round(v * 100)}% ${capitalizeStat(e.stat.replace('_porcentual', ''))}`);
        } else if (['defensa', 'resistencia'].includes(e.stat)) {
          levels.push(`-${Math.round(v * 100)}% daño`);
        } else if (e.stat === 'robo_vida') {
          levels.push(`Robo ${Math.round(v * 100)}%`);
        } else if (e.stat === 'combo') {
          levels.push(`+${Math.round(v * 100)}% combo`);
        } else {
          levels.push(`+${Math.round(v * 100)}%`);
        }
      }
      const v = e.valorPorNivel ? (e.valorPorNivel[h.nivel] || e.valorPorNivel[1] || 0) : 0;
      if (e.stat === 'qi_boost') efectoActual = `×${(1 + v).toFixed(2)} Qi`;
      else if (e.stat.includes('porcentual')) efectoActual = `+${Math.round(v * 100)}%`;
      else if (['defensa', 'resistencia'].includes(e.stat)) efectoActual = `-${Math.round(v * 100)}% daño`;
      else efectoActual = `+${Math.round(v * 100)}%`;
    } catch (_) {}

    return `
      <div class="hab-card">
        <div class="hab-card-icono">✨</div>
        <div class="hab-card-nombre">${h.nombre}</div>
        <div class="hab-card-nivel">Nv.${h.nivel || 1}</div>
        <div class="hab-card-efecto">${efectoActual}</div>
        <div class="hab-tooltip">
          ${levels.map((text, i) => {
            const n = i + 1;
            const cls = n === h.nivel ? 'actual' : n < h.nivel ? 'pasado' : 'futuro';
            return `<div class="hab-tooltip-row ${cls}"><span>Nv.${n}</span><span>${text}</span></div>`;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');
}

function capitalizeStat(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function renderHistorial(b) {
  const combates = API.get(`/arena/historial/${b.id}`);
  combates.then(cc => {
    const historialEl = document.getElementById('historial-combates');
    if (cc && cc.length > 0) {
      historialEl.innerHTML = cc.map(c => {
        const ganada = c.winner_id === b.id;
        const oponente = c.shaolin1_id === b.id ? c.b2_name : c.b1_name;
        return `
          <div class="historial-item">
            <span>vs <b>${oponente}</b></span>
            <span class="${ganada ? 'ganada' : 'perdida'}">${ganada ? '🏆 Victoria' : '💀 Derrota'}</span>
          </div>
        `;
      }).join('');
    } else {
      historialEl.innerHTML = '<div style="color:#8b6fa0">Sin combates aún</div>';
    }
  }).catch(() => {});
}

function checkPendingLevel(b) {
  const container = document.getElementById('level-up-container');
  const arenaBtn = document.getElementById('arena-btn');

  if (b.pending_level) {
    container.classList.remove('hidden');
    arenaBtn.classList.add('hidden');
  } else {
    container.classList.add('hidden');
    arenaBtn.classList.remove('hidden');
    arenaBtn.href = `/arena.html?shaolin_id=${b.id}`;
  }
}

function toggleStatsInfo() {
  const panel = document.getElementById('stats-info-panel');
  panel.classList.toggle('hidden');
}

async function startLevelUp() {
  selectedOpcionIndex = null;
  selectedStatIndex = null;
  document.getElementById('level-up-modal').classList.remove('hidden');
  document.getElementById('lvl-step-1').classList.remove('hidden');
  document.getElementById('lvl-step-2').classList.add('hidden');

  try {
    const data = await API.post(`/shaolins/${currentShaolin.id}/level-up-start`, {});
    currentOpciones = data.opciones;
    currentStatOptions = data.statOptions;

    const container = document.getElementById('lvl-options');
    container.innerHTML = '';

    currentOpciones.forEach((opt, i) => {
      const card = document.createElement('div');
      card.className = 'stat-option-card';
      card.setAttribute('data-index', i);
      card.style.borderColor = '#4a3060';
      const tipoLabel = opt.tipo === 'arma' ? 'Arma' : opt.tipo === 'habilidad' ? 'Habilidad' : 'Stat';
      card.innerHTML = `
        <div class="stat-option-icono">${opt.icono}</div>
        <div class="stat-option-valor">${opt.nombre}</div>
        <div class="stat-option-desc">${opt.descripcion}</div>
        <div class="stat-option-rara" style="color:#8b6fa0">${tipoLabel}</div>
      `;
      card.addEventListener('click', () => seleccionarOpcion(i));
      container.appendChild(card);
    });
  } catch (err) {
    alert('Error: ' + err.message);
    document.getElementById('level-up-modal').classList.add('hidden');
  }
}

function seleccionarOpcion(index) {
  selectedOpcionIndex = index;
  document.querySelectorAll('#lvl-options .stat-option-card').forEach((el, i) => {
    el.style.borderColor = i === index ? '#8b5cf6' : '#4a3060';
  });
  document.getElementById('lvl-step-1-btn').style.display = 'block';
}

function mostrarPaso2() {
  if (selectedOpcionIndex === null) return;

  document.getElementById('lvl-step-1').classList.add('hidden');
  document.getElementById('lvl-step-2').classList.remove('hidden');

  const container = document.getElementById('lvl-stat-options');
  container.innerHTML = '';

  currentStatOptions.forEach((opt, i) => {
    const rarezaColor = opt.rareza === 'bronce' ? '#cd7f32' : opt.rareza === 'plata' ? '#c0c0c0' : '#ffd700';
    const rarezaIcono = opt.rareza === 'bronce' ? '🥉' : opt.rareza === 'plata' ? '🥈' : '🥇';
    const rarezaLabel = opt.rareza.charAt(0).toUpperCase() + opt.rareza.slice(1);

    const card = document.createElement('div');
    card.className = 'stat-option-card';
    card.setAttribute('data-index', i);
    card.style.borderColor = '#4a3060';
    card.innerHTML = `
      <div class="stat-option-icono">${opt.icono}</div>
      <div class="stat-option-valor" style="color:${rarezaColor}">+${opt.valor} ${opt.label}</div>
      ${opt.descHp ? `<div class="stat-option-desc">${opt.descHp}</div>` : ''}
      <div class="stat-option-rara" style="color:${rarezaColor}">${rarezaIcono} ${rarezaLabel}</div>
    `;
    card.addEventListener('click', () => seleccionarStatOption(i));
    container.appendChild(card);
  });
}

function seleccionarStatOption(index) {
  selectedStatIndex = index;
  document.querySelectorAll('#lvl-stat-options .stat-option-card').forEach((el, i) => {
    el.style.borderColor = i === index ? '#8b5cf6' : '#4a3060';
  });
  document.getElementById('lvl-step-2-btn').style.display = 'block';
}

async function confirmarLevelUp() {
  if (selectedStatIndex === null) return;

  const btn = document.getElementById('lvl-step-2-btn');
  btn.disabled = true;
  btn.textContent = 'Subiendo nivel...';

  try {
    const data = await API.post(`/shaolins/${currentShaolin.id}/level-up-confirm`, {
      opcionElegida: currentOpciones[selectedOpcionIndex],
      statChoice: currentStatOptions[selectedStatIndex],
    });

    document.getElementById('level-up-modal').classList.add('hidden');
    currentShaolin = data;
    renderStats(data);
    renderQi(data);
    renderArmas(data);
    renderHabilidades(data);
    document.getElementById('shaolin-level').textContent = `Nivel ${data.level}`;
    checkPendingLevel(data);

    if (data.easterEgg) {
      const overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:9999;animation:fadeIn 0.5s';
      const box = document.createElement('div');
      box.style.cssText = 'background:linear-gradient(135deg,#1a0a2e,#2d1b4e);border:2px solid #f59e0b;border-radius:16px;padding:40px;text-align:center;max-width:500px;box-shadow:0 0 60px rgba(245,158,11,0.3)';
      box.innerHTML = `
        <div style="font-size:72px;margin-bottom:16px">🐉</div>
        <div style="font-size:24px;font-weight:bold;color:#fbbf24;margin-bottom:12px">¡EL MAESTRO HA DESPERTADO!</div>
        <div style="color:#d4a574;font-size:16px;line-height:1.6">${data.easterEgg}</div>
        <button onclick="this.closest('div[style]').parentElement.remove()" style="margin-top:20px;padding:8px 24px;background:#f59e0b;color:#000;border:none;border-radius:8px;font-size:16px;cursor:pointer">✨ Continuar</button>
      `;
      overlay.appendChild(box);
      document.body.appendChild(overlay);
    }
  } catch (err) {
    alert('Error: ' + err.message);
    btn.disabled = false;
    btn.textContent = '✅ Confirmar nivel';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadShaolin();
});
