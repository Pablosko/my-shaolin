async function loadBase() {
  const pn = window.location.pathname;
  const idx = pn.indexOf('/base/');
  const name = idx >= 0 ? decodeURIComponent(pn.slice(idx + 6).replace(/\/$/, '')) : '';
  if (!name) { renderNotFound(); return; }

  const main = document.getElementById('main-content');

  try {
    const res = await fetch(`/api/shaolins/public/${encodeURIComponent(name)}`);
    if (!res.ok) {
      if (res.status === 404) { renderNotFound(); return; }
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Error ' + res.status);
    }
    const b = await res.json();
    if (!b || !b.name) { renderNotFound(); return; }

    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const esDueno = token && String(b.user_id) === userId;

    main.innerHTML = '';

    const color = getColor(b.genero);
    const hpNum = b.real_max_hp || b.max_hp;
    const fuerza = b.real_fuerza || b.fuerza;
    const agilidad = b.real_agilidad || b.agilidad;
    const velocidad = b.real_velocidad || b.velocidad;

    main.innerHTML = `
      <div class="base-layout">
        <div class="base-profile-card">
          <div class="bp-avatar-wrap">
            <img src="${getSkinUrl(b.genero, b.skin)}" class="bp-avatar" style="border-color:${color}" onerror="this.outerHTML='<div style=font-size:80px;padding:10px>&#x1f94b;</div>'">
          </div>
          <div class="bp-name">${escapeHtml(b.name)}</div>
          <div class="bp-owner">👤 ${escapeHtml(b.username || '')}</div>
          <div class="bp-level">Nivel ${b.level}</div>
          <div class="bp-created">🐣 Creado ${formatDate(b.created_at)}</div>
          <div class="bp-winrate">
            <div class="wr-value">${b.total_combates > 0 ? Math.round((b.wins / b.total_combates) * 100) : 0}%</div>
            <div class="wr-label">🎖️ ${b.wins || 0}/${b.total_combates || 0} combates</div>
          </div>
          <div class="base-actions">
            ${esDueno ? `
              <a href="/shaolin.html?id=${b.id}" class="btn btn-primario">📋 Ir a mi perfil</a>
              <a href="/arena.html?shaolin_id=${b.id}" class="btn btn-combatir">⚔️ Ir a la arena</a>
            ` : token ? `
              <button class="btn btn-combatir" id="btn-combatir-base" data-op-name="${escapeHtml(b.name)}" data-op-id="${b.id}">⚔️ Combatir</button>
            ` : `
              <a href="/" class="btn btn-primario">🔑 Iniciar sesión</a>
            `}
          </div>
        </div>
        <div class="base-content">
          <div class="card">
            <h3>📊 Estadísticas</h3>
            <div class="stat-group" title="HP = 50 + vitalidad×3 + level×2, luego × habilidades% × Qi">
              <div class="stat-info-row">
                <span class="stat-label">❤️ Vida</span>
                <span class="stat-value hp-value">${hpNum}</span>
              </div>
            </div>
            <div class="stat-group" title="Daño puño = floor(Fue×0.3) + rand(5-7)&#10;Daño arma = Fue + dañoArma&#10;Crítico = daño × 1.5">
              <div class="stat-info-row">
                <span class="stat-label">💪 Fuerza</span>
                <span class="stat-value">${formatStatDiff(b.baseFuerza || b.fuerza, fuerza)}</span>
              </div>
              <div class="seg-bar-container">${renderSegBarStatic(fuerza)}</div>
            </div>
            <div class="stat-group" title="Precisión = clamp(0.20, 0.98, 0.85 + (agiAtk - agiDef) × 0.02)&#10;Esquiva base = 10% + habilidades">
              <div class="stat-info-row">
                <span class="stat-label">🏃 Agilidad</span>
                <span class="stat-value">${formatStatDiff(b.baseAgilidad || b.agilidad, agilidad)}</span>
              </div>
              <div class="seg-bar-container">${renderSegBarStatic(agilidad)}</div>
            </div>
            <div class="stat-group" title="PA/turno = clamp(100, 250, 100 + floor(sqrt(Vel) × 12))&#10;Iniciativa: mayor Vel ataca primero&#10;Crítico = Vel × 1% + habilidades">
              <div class="stat-info-row">
                <span class="stat-label">⚡ Velocidad</span>
                <span class="stat-value">${formatStatDiff(b.baseVelocidad || b.velocidad, velocidad)}</span>
              </div>
              <div class="seg-bar-container">${renderSegBarStatic(velocidad)}</div>
            </div>
            ${b.qi ? `
            <div class="stat-group" title="Qi = potencialSegunNivel × armoníaDeStats&#10;Multiplica stats × factor (0.5 a 1.5)">
              <div class="stat-info-row">
                <span class="stat-label">🌀 Qi</span>
                <span class="stat-value">×${b.qi.toFixed(2)}</span>
              </div>
            </div>` : ''}
          </div>
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
      const shaolins = await (await fetch('/api/shaolins', {
        headers: { 'Authorization': 'Bearer ' + token }
      })).json();
      if (Array.isArray(shaolins) && shaolins.length > 0) {
        let shaolinId = null;
        if (shaolins.length === 1) {
          shaolinId = shaolins[0].id;
        } else {
          const pick = prompt(`Elige tu guerrero:\n${shaolins.map((s,i) => `${i+1}. ${s.name}`).join('\n')}`);
          const idx = parseInt(pick) - 1;
          if (idx >= 0 && idx < shaolins.length) shaolinId = shaolins[idx].id;
        }
        if (shaolinId) {
          combatBtn.addEventListener('click', () => {
            window.location.href = `/arena.html?shaolin_id=${shaolinId}&entreno=1&oponente_name=${encodeURIComponent(b.name)}`;
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

function renderSegBarStatic(valor) {
  return colorBar(valor, 10).map(c =>
    `<span class="seg-bar-segment" style="background:${c}"></span>`
  ).join('');
}

async function renderBaseArmas(b) {
  const container = document.getElementById('base-armas-container');
  const box = document.getElementById('base-armas-box');
  box.classList.remove('hidden');

  const owned = b.armas || [];
  const ownedNames = new Set(owned.map(a => a.nombre));

  try {
    const r = await fetch('/api/shaolins/arsenal');
    const arsenal = await r.json();
    const allWeapons = arsenal.armas || [];
    container.innerHTML = allWeapons.map(w => {
      const esTuya = ownedNames.has(w.nombre);
      const own = owned.find(a => a.nombre === w.nombre);
      const nivel = own ? own.nivel : 0;
      const cls = esTuya ? 'own' : 'lock';

      let tooltipHtml = '';
      if (esTuya) {
        const bMin = own.dano_min - (nivel - 1);
        const bMax = own.dano_max - (nivel - 1);
        const levels = [1, 2, 3].map(l => ({ min: bMin + l - 1, max: bMax + l - 1 }));
        tooltipHtml = levels.map((lvl, i) => {
          const n = i + 1;
          const rowCls = n === nivel ? 'actual' : n < nivel ? 'pasado' : 'futuro';
          return `<div class="arma-tooltip-row ${rowCls}"><span>Nv.${n}</span><span>${lvl.min}-${lvl.max}</span></div>`;
        }).join('');
      } else {
        tooltipHtml = `<div class="arma-tooltip-row"><span style="color:#a080b8">${w.familia} · ${w.tier}</span></div>`;
      }

      return `
        <div class="arma-card ${cls}">
          <div class="arma-card-icono">${esTuya ? '🗡️' : '🔒'}</div>
          <div class="arma-card-nombre">${w.nombre}</div>
          <div class="arma-card-nivel">${esTuya ? 'Nv.' + nivel : '---'}</div>
          ${esTuya ? `<div class="arma-card-dano">${own.dano_min}-${own.dano_max}</div>` : ''}
          <div class="arma-familia">${w.familia} · ${w.tier}</div>
          <div class="arma-tooltip">${tooltipHtml}</div>
        </div>
      `;
    }).join('');
  } catch (_) {
    container.innerHTML = '<span style=color:#8b6fa0>Error al cargar arsenal</span>';
  }
}

let arsenalCache = null;
async function getArsenal() {
  if (arsenalCache) return arsenalCache;
  const r = await fetch('/api/shaolins/arsenal');
  arsenalCache = await r.json();
  return arsenalCache;
}

async function renderBaseHabilidades(b) {
  const container = document.getElementById('base-habilidades-container');
  const box = document.getElementById('base-habilidades-box');
  box.classList.remove('hidden');

  const owned = b.habilidades || [];
  const ownedNames = new Set(owned.map(h => h.nombre));

  try {
    const arsenal = await getArsenal();
    const allHabs = arsenal.habilidades || [];
    container.innerHTML = allHabs.map(h => {
      const esTuya = ownedNames.has(h.nombre);
      const own = owned.find(x => x.nombre === h.nombre);
      const cls = esTuya ? 'own' : 'lock';
      const nivel = own ? own.nivel : 0;

      let tooltipHtml = '';
      if (esTuya) {
        let levels = [];
        try {
          const e = JSON.parse(own.efecto);
          for (let n = 1; n <= 3; n++) {
            const v = e.valorPorNivel ? (e.valorPorNivel[n] || 0) : 0;
            if (e.stat === 'qi_boost') levels.push(`×${(1 + v).toFixed(2)} Qi`);
            else if (e.stat.includes('porcentual')) levels.push(`+${Math.round(v * 100)}% ${capitalizeStat(e.stat.replace('_porcentual', ''))}`);
            else if (['defensa', 'resistencia'].includes(e.stat)) levels.push(`-${Math.round(v * 100)}% daño`);
            else if (e.stat === 'robo_vida') levels.push(`Robo ${Math.round(v * 100)}%`);
            else if (e.stat === 'combo') levels.push(`+${Math.round(v * 100)}% combo`);
            else if (e.stat === 'contraataque') levels.push(`+${Math.round(v * 100)}% contra`);
            else levels.push(`+${Math.round(v * 100)}%`);
          }
        } catch (_) {}
        tooltipHtml = levels.map((text, i) => {
          const n = i + 1;
          const rowCls = n === nivel ? 'actual' : n < nivel ? 'pasado' : 'futuro';
          return `<div class="hab-tooltip-row ${rowCls}"><span>Nv.${n}</span><span>${text}</span></div>`;
        }).join('');
      } else {
        tooltipHtml = `<div class="hab-tooltip-row"><span style="color:#a080b8">${h.descripcion}</span></div>`;
      }

      let desc = '';
      if (esTuya) {
        try {
          const e = JSON.parse(own.efecto);
          const v = e.valorPorNivel ? (e.valorPorNivel[nivel || 1] || 0) : 0;
          if (e.stat === 'qi_boost') desc = `×${(1 + v).toFixed(2)} Qi`;
          else if (e.stat.includes('porcentual')) desc = `+${Math.round(v * 100)}% ${capitalizeStat(e.stat.replace('_porcentual', ''))}`;
          else if (['defensa', 'resistencia'].includes(e.stat)) desc = `-${Math.round(v * 100)}% daño`;
          else if (e.stat === 'robo_vida') desc = `+${Math.round(v * 100)}% robo`;
          else if (e.stat === 'critico') desc = `+${Math.round(v * 100)}% crítico`;
          else if (e.stat === 'esquiva') desc = `+${Math.round(v * 100)}% esquiva`;
          else if (e.stat === 'combo') desc = `+${Math.round(v * 100)}% combo`;
          else if (e.stat === 'contraataque') desc = `+${Math.round(v * 100)}% contra`;
        } catch (_) {}
      }

      return `
        <div class="hab-card ${cls}">
          <div class="hab-card-icono">${esTuya ? '✨' : '🔒'}</div>
          <div class="hab-card-nombre">${h.nombre}</div>
          <div class="hab-card-nivel">${esTuya ? 'Nv.' + nivel : '---'}</div>
          ${esTuya ? `<div class="hab-card-desc">${h.descripcion || ''}</div>` : ''}
          ${esTuya ? `<div class="hab-card-efecto">${desc}</div>` : ''}
          <div class="hab-tooltip">${tooltipHtml}</div>
        </div>
      `;
    }).join('');
  } catch (_) {
    container.innerHTML = '<span style=color:#8b6fa0>Error al cargar arsenal</span>';
  }
}

function capitalizeStat(s) {
  const map = { fuerza: 'Fue', agilidad: 'Agi', velocidad: 'Vel', hp: 'HP' };
  return map[s] || s.charAt(0).toUpperCase() + s.slice(1);
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

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

document.addEventListener('DOMContentLoaded', () => {
  loadBase();
});
