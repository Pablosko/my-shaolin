async function loadBase() {
  const pathParts = window.location.pathname.split('/');
  const name = pathParts[pathParts.length - 1];
  if (!name) { renderNotFound(); return; }

  const main = document.getElementById('main-content');

  try {
    const res = await fetch(`/api/shaolins/public/${encodeURIComponent(name)}`);
    if (!res.ok) {
      if (res.status === 404) { renderNotFound(); return; }
      throw new Error('Error al cargar');
    }
    const data = await res.json();
    const b = data;

    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const esDueno = token && String(b.user_id) === userId;

    main.innerHTML = '';

    const color = getColor(b.genero);

    const statsHtml = renderBaseStats(b);

    main.innerHTML = `
      <div class="base-layout">
        <div class="base-profile-card">
          <div class="bp-avatar-wrap">
            <img src="${getSkinUrl(b.genero, b.skin)}" class="bp-avatar" style="border-color:${color}" onerror="this.style.display='none';this.parentElement.innerHTML='<div style=\\'font-size:80px;padding:10px\\'>🥋</div>'">
          </div>
          <div class="bp-name">${b.name}</div>
          <div class="bp-owner">👤 ${b.username}</div>
          <div class="bp-level">Nivel ${b.level}</div>
          <div class="bp-created">🐣 Creado ${formatDate(b.created_at)}</div>
          <div class="bp-winrate">
            <div class="wr-value">${b.total_combates > 0 ? Math.round((b.wins / b.total_combates) * 100) : 0}%</div>
            <div class="wr-label">🎖️ ${b.wins}/${b.total_combates} combates</div>
          </div>
          <div class="base-actions">
            ${esDueno ? `
              <a href="/shaolin.html?id=${b.id}" class="btn btn-primario">📋 Ir a mi perfil</a>
              <a href="/arena.html?shaolin_id=${b.id}" class="btn btn-combatir">⚔️ Ir a la arena</a>
            ` : token ? `
              <button class="btn btn-combatir" id="btn-combatir-base" data-op-name="${b.name}" data-op-id="${b.id}">⚔️ Combatir</button>
            ` : `
              <a href="/" class="btn btn-primario">🔑 Iniciar sesión</a>
            `}
          </div>
        </div>
        <div class="base-content">
          ${statsHtml}
          <div id="base-armas-box" class="${!b.armas || b.armas.length === 0 ? 'hidden' : ''}">
            <div class="card">
              <h3>🗡️ Armas</h3>
              <div id="base-armas-container" class="armas-grid"></div>
            </div>
          </div>
          <div id="base-habilidades-box" class="${!b.habilidades || b.habilidades.length === 0 ? 'hidden' : ''}">
            <div class="card">
              <h3>✨ Habilidades</h3>
              <div id="base-habilidades-container" class="hab-grid"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    renderBaseArmas(b);
    renderBaseHabilidades(b);

    const combatBtn = document.getElementById('btn-combatir-base');
    if (combatBtn && token) {
      const userIdLocal = localStorage.getItem('userId');
      const shaolins = await (await fetch('/api/shaolins', {
        headers: { 'Authorization': 'Bearer ' + token }
      })).json();
      if (Array.isArray(shaolins) && shaolins.length > 0) {
        let shaolinId = null;
        if (shaolins.length === 1) {
          shaolinId = shaolins[0].id;
        } else {
          const pick = prompt(`Elige tu guerrero (ID):\n${shaolins.map((s,i) => `${i+1}. ${s.name}`).join('\n')}`);
          const idx = parseInt(pick) - 1;
          if (idx >= 0 && idx < shaolins.length) shaolinId = shaolins[idx].id;
        }
        if (shaolinId) {
          combatBtn.addEventListener('click', () => {
            window.location.href = `/arena.html?shaolin_id=${shaolinId}`;
          });
        }
      }
    }

  } catch (err) {
    console.error('Base load error:', err);
    main.innerHTML = `
      <div class="not-found-page">
        <div class="nf-icon">💀</div>
        <div class="nf-title">Error del destino</div>
        <div class="nf-sub">${err.message}</div>
        <p style="color:#6a3a8a;font-size:12px;margin-top:16px">Los dioses del templo están confundidos. Intenta de nuevo más tarde.</p>
      </div>
    `;
  }
}

function renderBaseStats(b) {
  const hpNum = b.real_max_hp || b.max_hp;
  const fuerza = b.real_fuerza || b.fuerza;
  const agilidad = b.real_agilidad || b.agilidad;
  const velocidad = b.real_velocidad || b.velocidad;

  return `
    <div class="card">
      <h3>📊 Estadísticas</h3>
      <div class="stat-group" title="HP = 50 + vitalidad×3 + level×2\nLuego × habilidades de HP% × Qi">
        <div class="stat-info-row">
          <span class="stat-label">❤️ Vida</span>
          <span class="stat-value">${hpNum}</span>
        </div>
      </div>
      <div class="stat-group" title="Daño puño = floor(Fue×0.3) + rand(5-7)\nDaño arma = Fue + dañoArma\nCrítico = daño × 1.5">
        <div class="stat-info-row">
          <span class="stat-label">💪 Fuerza</span>
          <span class="stat-value">${formatStatDiff(b.baseFuerza || b.fuerza, fuerza)}</span>
        </div>
        <div class="seg-bar-container">${renderSegBarStatic(fuerza)}</div>
      </div>
      <div class="stat-group" title="Precisión = clamp(0.20, 0.98, 0.85 + (agiAtk - agiDef) × 0.02)\nEsquiva base = 10% + habilidades">
        <div class="stat-info-row">
          <span class="stat-label">🏃 Agilidad</span>
          <span class="stat-value">${formatStatDiff(b.baseAgilidad || b.agilidad, agilidad)}</span>
        </div>
        <div class="seg-bar-container">${renderSegBarStatic(agilidad)}</div>
      </div>
      <div class="stat-group" title="PA/turno = clamp(100, 250, 100 + floor(sqrt(Vel) × 12))\nIniciativa: mayor Vel ataca primero\nCrítico = Vel × 1% + habilidades">
        <div class="stat-info-row">
          <span class="stat-label">⚡ Velocidad</span>
          <span class="stat-value">${formatStatDiff(b.baseVelocidad || b.velocidad, velocidad)}</span>
        </div>
        <div class="seg-bar-container">${renderSegBarStatic(velocidad)}</div>
      </div>
      ${b.qi ? `
      <div class="stat-group" title="Qi = potencialSegunNivel × armoníaDeStats\nMultiplica stats × factor (0.5 a 1.5)">
        <div class="stat-info-row">
          <span class="stat-label">🌀 Qi</span>
          <span class="stat-value">×${b.qi.toFixed(2)}</span>
        </div>
      </div>` : ''}
    </div>
  `;
}

function renderSegBarStatic(valor) {
  const segs = 10;
  const filled = Math.min(segs, Math.max(0, Math.round(valor)));
  let html = '';
  for (let i = 0; i < segs; i++) {
    const ratio = (i + 1) / segs;
    if (i < filled) {
      const r = Math.round(255 * (1 - ratio));
      const g = Math.round(200 * ratio);
      html += `<span class="seg seg-filled" style="background:rgb(${r},${g},80)"></span>`;
    } else {
      html += `<span class="seg seg-empty"></span>`;
    }
  }
  return html;
}

function renderBaseArmas(b) {
  const container = document.getElementById('base-armas-container');
  const box = document.getElementById('base-armas-box');
  if (!b.armas || b.armas.length === 0) { box.classList.add('hidden'); return; }
  box.classList.remove('hidden');
  container.innerHTML = b.armas.map(a => {
    const bMin = a.dano_min - (a.nivel - 1);
    const bMax = a.dano_max - (a.nivel - 1);
    const levels = [1,2,3].map(l => ({
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

function renderBaseHabilidades(b) {
  const container = document.getElementById('base-habilidades-container');
  const box = document.getElementById('base-habilidades-box');
  if (!b.habilidades || b.habilidades.length === 0) { box.classList.add('hidden'); return; }
  box.classList.remove('hidden');
  container.innerHTML = b.habilidades.map(h => {
    let efectoActual = '?';
    let levels = [];
    try {
      const e = JSON.parse(h.efecto);
      for (let n = 1; n <= 3; n++) {
        const v = e.valorPorNivel ? (e.valorPorNivel[n] || 0) : 0;
        if (e.stat === 'qi_boost') levels.push(`×${(1 + v).toFixed(2)} Qi`);
        else if (e.stat.includes('porcentual')) levels.push(`+${Math.round(v * 100)}% ${capitalizeStat(e.stat.replace('_porcentual', ''))}`);
        else if (['defensa', 'resistencia'].includes(e.stat)) levels.push(`-${Math.round(v * 100)}% daño`);
        else if (e.stat === 'robo_vida') levels.push(`Robo ${Math.round(v * 100)}%`);
        else if (e.stat === 'combo') levels.push(`+${Math.round(v * 100)}% combo`);
        else levels.push(`+${Math.round(v * 100)}%`);
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
        <div class="hab-card-desc">${h.descripcion || ''}</div>
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

function renderNotFound() {
  const frases = [
    'Este guerrero está entrenando en una dimensión paralela... 🌀',
    'Ni el Oráculo de Shaolin sabe dónde está. 🤔',
    'Quizás se fue a por noodles y no volvió. 🍜',
    '404: Este shaolin eligió el camino del silencio. 🧘',
    'El templo no tiene registro de ese nombre... 👻',
    'Se teletransportó a la cueva de los 1000 golpes. 🥋',
    'Debe estar en el baño. Vuelve más tarde. 🚽',
  ];
  const frase = frases[Math.floor(Math.random() * frases.length)];
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div class="not-found-page">
      <div class="nf-icon">👻</div>
      <div class="nf-title">Guerrero no encontrado</div>
      <div class="nf-sub">${frase}</div>
      <a href="/dashboard.html" class="btn btn-primario" style="margin-top:24px">📋 Volver a mis guerreros</a>
    </div>
  `;
}

function formatDate(dateStr) {
  if (!dateStr) return 'desconocido';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

function capitalizeStat(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

document.addEventListener('DOMContentLoaded', () => {
  loadBase();
});
