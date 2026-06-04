let shaolinId = null;
let oponenteSeleccionado = null;
let modoBot = false;
let esModoEntreno = false;
let miShaolinInfo = null;
let miHpMax = 0;
let opHpMax = 0;
let p1 = 2;
let p2 = 2;
let oponenteNameForPost = null;
let oponenteIdForPost = null;

const DIST_NOMBRES = ['', 'Contacto', 'Corta', 'Corta', 'Media', 'Media', 'Guardia', 'Guardia', 'Larga', 'Larga'];
const FAMILIA_ICONO = { puño: '🥊', dao: '🗡️', jian: '⚔️', gun: '🔱', shuanggou: '⛓️', fei_biao: '🏹' };

function weaponIcon(familia) {
  return FAMILIA_ICONO[familia] || '🗡️';
}

function setFighterFrame(spriteId, skin, frame, genero) {
  const el = document.getElementById(spriteId);
  if (!el) return;
  const url = `/images/skins/${skin}/${frame}.png`;
  el.onerror = function() {
    this.onerror = null;
    const legacyUrl = getSkinUrl(genero, skin);
    this.onerror = function() {
      this.onerror = null;
      this.src = getSkinUrl(genero, 'default');
    };
    this.src = legacyUrl;
  };
  el.src = url;
}

async function loadArena() {
  const params = new URLSearchParams(window.location.search);
  shaolinId = parseInt(params.get('shaolin_id'));

  try {
    miShaolinInfo = await API.get(`/shaolins/${shaolinId}`);

    if (miShaolinInfo.pending_level) {
      document.getElementById('seleccion-oponentes').innerHTML = `
        <div class="card" style="text-align:center;padding:40px">
          <div style="font-size:48px;margin-bottom:12px">⬆️</div>
          <h2>Tienes un nivel pendiente</h2>
          <p style="color:#8b6fa0;margin-bottom:16px">Debes subir de nivel antes de combatir.</p>
          <a href="/shaolin.html?id=${shaolinId}" class="btn btn-primario">Subir de nivel</a>
        </div>
      `;
      return;
    }

    document.getElementById('mi-nombre').textContent = miShaolinInfo.name;
    setFighterFrame('mi-sprite', miShaolinInfo.skin, 'idle', miShaolinInfo.genero);
    renderWeaponStrip('mi-weapons-strip', miShaolinInfo.armas || [], null);
    miHpMax = miShaolinInfo.real_max_hp || miShaolinInfo.max_hp;
    actualizarBarraHP('mi', miShaolinInfo.hp, miHpMax);

    const hoy = new Date().toISOString().split('T')[0];
    const restantes = 500 - (miShaolinInfo.ultimo_combate === hoy ? miShaolinInfo.combates_hoy : 0);
    document.getElementById('combates-restantes').textContent = Math.max(0, restantes);

    localStorage.setItem('lastShaolin', JSON.stringify({
      id: miShaolinInfo.id,
      name: miShaolinInfo.name,
      genero: miShaolinInfo.genero,
      skin: miShaolinInfo.skin,
    }));
  } catch (err) {
    if (err.message.includes('Token')) { logout(); }
    else { alert('Error: ' + err.message); }
  }

  setupTabs();
  cargarOponentes();

  const entrenoParam = params.get('entreno');
  const oponenteName = params.get('oponente_name');
  if (entrenoParam === '1' && oponenteName) {
    esModoEntreno = true;
    document.querySelectorAll('.arena-tab').forEach(t => t.classList.remove('active'));
    const entrenoTab = document.querySelector('[data-tab="entreno"]');
    if (entrenoTab) entrenoTab.classList.add('active');
    document.getElementById('combates-restantes-box').classList.add('hidden');
    document.getElementById('entreno-info').classList.remove('hidden');

    try {
      const res = await fetch(`/api/shaolins/public/${encodeURIComponent(oponenteName)}`);
      if (res.ok) {
        const opData = await res.json();
        await iniciarCombate(opData, false);
      }
    } catch (_) {}
  }
}

function setupTabs() {
  const tabs = document.querySelectorAll('.arena-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      esModoEntreno = tab.dataset.tab === 'entreno';

      document.getElementById('combates-restantes-box').classList.toggle('hidden', esModoEntreno);
      document.getElementById('entreno-info').classList.toggle('hidden', !esModoEntreno);

      cargarOponentes();
    });
  });
}

function actualizarBarraHP(lado, actual, maximo) {
  const pct = Math.max(0, Math.min(100, (actual / maximo) * 100));
  const relleno = document.getElementById(`${lado}-hp-relleno`);
  const texto = document.getElementById(`${lado}-hp-texto`);
  if (relleno) relleno.style.width = pct + '%';
  if (texto) texto.textContent = `${actual}/${maximo}`;
  if (relleno) {
    relleno.className = 'hp-relleno';
    if (pct > 50) relleno.classList.add('hp-verde');
    else if (pct > 25) relleno.classList.add('hp-naranja');
    else relleno.classList.add('hp-rojo');
  }
}

function renderWeaponStrip(containerId, armas, equipadaNombre) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = armas
    .filter(a => a.nombre !== equipadaNombre)
    .map(a => `<span class="ws-icon" data-nombre="${a.nombre}">${weaponIcon(a.familia)}</span>`)
    .join('');
  if (el.innerHTML === '' && (!armas || armas.length === 0)) {
    el.innerHTML = '';
  }
}

async function cargarOponentes() {
  try {
    let oponentes;
    if (esModoEntreno) {
      oponentes = await API.get('/arena/oponentes-todos');
    } else {
      oponentes = await API.get(`/arena/oponentes?level=${miShaolinInfo.level}`);
    }
    const listEl = document.getElementById('oponentes-lista');

    if (oponentes.length === 0) {
      listEl.innerHTML = `
        <div class="card" style="text-align:center;grid-column:1/-1">
          <div style="font-size:48px;margin-bottom:12px">😴</div>
          <div style="color:#8b6fa0;margin-bottom:16px">${esModoEntreno ? 'No hay guerreros disponibles para entrenar...' : 'No hay oponentes de tu nivel...'}</div>
          <button class="btn btn-combatir" onclick="cargarBots()">🤖 Generar bots</button>
        </div>
      `;
      return;
    }

    listEl.innerHTML = '';
    oponentes.forEach(op => {
      const card = crearCardOponente(op);
      listEl.appendChild(card);
    });

    const botBtn = document.createElement('div');
    botBtn.style.cssText = 'grid-column:1/-1;text-align:center;margin-top:12px';
    botBtn.innerHTML = `<button class="btn btn-secundario" onclick="cargarBots()">🤖 Practicar contra bots</button>`;
    listEl.appendChild(botBtn);
  } catch (err) {
    if (err.message.includes('Token')) { logout(); }
    else { alert('Error: ' + err.message); }
  }
}

async function cargarBots() {
  const listEl = document.getElementById('oponentes-lista');
  listEl.innerHTML = '<div style="text-align:center;color:#8b6fa0;grid-column:1/-1">Generando...</div>';
  try {
    const bots = await API.get(`/arena/bots?level=${miShaolinInfo.level}`);
    listEl.innerHTML = '';
    bots.forEach(bot => {
      const card = crearCardOponente(bot);
      listEl.appendChild(card);
    });
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

function crearCardOponente(op) {
  const esBot = op.id < 0;
  const card = document.createElement('div');
  card.className = 'oponente-card';
  card.innerHTML = `
    <div class="nombre">${op.name}</div>
    <div class="dueño">${esBot ? '🤖 Bot' : '👤 ' + op.username}</div>
    <div style="font-size:13px;margin-top:8px">
      Nv.${op.level} · ❤️${op.real_max_hp || op.max_hp || op.hp} · 💪${op.real_fuerza || op.fuerza} · 🏃${op.real_agilidad || op.agilidad} · ⚡${op.real_velocidad || op.velocidad}
    </div>
    ${op.armas && op.armas.length > 0 ? '<div style="font-size:11px;color:#8b6fa0">' + op.armas.map(a => weaponIcon(a.familia)).join(' ') + '</div>' : ''}
    <button class="btn btn-combatir mt-12" style="width:100%">⚔️ Combatir</button>
  `;
  card.querySelector('button').addEventListener('click', () => iniciarCombate(op, esBot));
  return card;
}

async function iniciarCombate(oponente, esBot = false) {
  oponenteSeleccionado = oponente;
  modoBot = esBot;
  oponenteNameForPost = oponente.name;
  oponenteIdForPost = oponente.id;

  document.getElementById('seleccion-oponentes').classList.add('hidden');
  document.getElementById('pantalla-combate').classList.remove('hidden');

  const label = document.getElementById('combate-mode-label');
  label.textContent = esModoEntreno ? '🥋 ENTRENAMIENTO' : '⚔️ COMBATE';

  document.getElementById('op-nombre').textContent = oponente.name;
  setFighterFrame('op-sprite', oponente.skin, 'idle', oponente.genero);
  renderWeaponStrip('op-weapons-strip', oponente.armas || [], null);

  opHpMax = oponente.real_max_hp || oponente.max_hp || oponente.hp;
  actualizarBarraHP('op', opHpMax, opHpMax);

  document.getElementById('log-combate').innerHTML = '<div style="text-align:center;color:#8b6fa0">⚔️ Preparando combate...</div>';
  document.getElementById('resultado').classList.add('hidden');
  document.getElementById('acciones-post-combate').classList.add('hidden');

  try {
    const body = { shaolin_id: shaolinId };
    if (modoBot) body.oponente_data = oponente;
    if (esModoEntreno) body.esEntrenamiento = true;
    const result = await API.post(`/arena/combatir/${oponente.id}`, body);
    renderCombate(result);
  } catch (err) {
    alert('Error en combate: ' + err.message);
    volverArena();
  }
}

function volverArena() {
  document.getElementById('seleccion-oponentes').classList.remove('hidden');
  document.getElementById('pantalla-combate').classList.add('hidden');
}

async function renderCombate(result) {
  const log = result.log;
  const logEl = document.getElementById('log-combate');
  const miNombre = miShaolinInfo.name;
  const miCol = document.getElementById('luchador-mi');
  const opCol = document.getElementById('luchador-op');
  const rangoInd = document.getElementById('rango-indicator');
  const pipsEl = document.getElementById('distance-pips');

  logEl.innerHTML = '';
  p1 = 2;
  p2 = 2;
  actualizarPosicion();

  function actualizarPosicion() {
    miCol.style.setProperty('--pos', p1);
    opCol.style.setProperty('--pos', p2);
    const dist = p1 + p2 - 1;
    if (rangoInd) rangoInd.textContent = `Distancia ${dist} · ${DIST_NOMBRES[Math.min(Math.max(1, dist), 9)]}`;
    if (pipsEl) pipsEl.textContent = '#'.repeat(Math.max(1, 9 - dist + 1)) + '○'.repeat(dist - 1);
  }

  function mostrarFloat(el, texto, color, escala = 1) {
    const f = document.createElement('div');
    f.className = 'float-dmg';
    f.textContent = texto;
    f.style.color = color;
    f.style.setProperty('--escala', escala);
    el.appendChild(f);
    setTimeout(() => f.remove(), 1000);
  }

  async function animarPaso(spriteId, skin, genero, dir) {
    setFighterFrame(spriteId, skin, 'walk_1', genero);
    await delay(150);
    setFighterFrame(spriteId, skin, 'walk_2', genero);
    await delay(150);
    setFighterFrame(spriteId, skin, 'idle', genero);
  }

  for (const entry of log) {
    const esMiPersonaje = entry.actor === miNombre || entry.nombre === miNombre || entry.atacante_nombre === miNombre;
    const esMi = esMiPersonaje;

    switch (entry.type) {
      case 'combat_start': {
        p1 = entry.p1 || 2;
        p2 = entry.p2 || 2;
        actualizarPosicion();
        const d = p1 + p2 - 1;
        rangoInd.textContent = `Distancia ${d} · ${DIST_NOMBRES[Math.min(Math.max(1, d), 9)]}`;
        break;
      }

      case 'turn_start':
        await delay(300);
        break;

      case 'pa': {
        const valEl = esMiPersonaje ? document.getElementById('pa-mi-valor') : document.getElementById('pa-op-valor');
        if (valEl) valEl.textContent = entry.pa;
        break;
      }

      case 'draw_weapon':
      case 'switch_weapon': {
        await delay(200);
        const handId = esMiPersonaje ? 'mi-equipada' : 'op-equipada';
        const hand = document.getElementById(handId);
        const stripId = esMiPersonaje ? 'mi-weapons-strip' : 'op-weapons-strip';
        const armas = esMiPersonaje ? miShaolinInfo.armas : (oponenteSeleccionado ? oponenteSeleccionado.armas : []);

        if (entry.type === 'draw_weapon') {
          const icono = weaponIcon((armas.find(a => a.nombre === entry.arma) || {}).familia || 'dao');
          hand.textContent = icono;
          hand.classList.remove('hidden');
          renderWeaponStrip(stripId, armas, entry.arma);
          mostrarFloat(esMiPersonaje ? miCol : opCol, icono, '#fbbf24', 1.3);
          addLog(logEl, `<span class="info">🗡️ ${entry.actor} sacó ${entry.arma}</span>`);
        } else {
          const iconoViejo = weaponIcon((armas.find(a => a.nombre === entry.arma_vieja) || {}).familia || 'dao');
          const iconoNuevo = weaponIcon((armas.find(a => a.nombre === entry.arma_nueva) || {}).familia || 'dao');
          hand.textContent = iconoNuevo;
          hand.classList.remove('hidden');
          renderWeaponStrip(stripId, armas, entry.arma_nueva);
          mostrarFloat(esMiPersonaje ? miCol : opCol, '🔄', '#fbbf24', 1.2);
          addLog(logEl, `<span class="info">🔄 ${entry.actor} cambió ${entry.arma_vieja} por ${entry.arma_nueva}</span>`);
        }
        break;
      }

      case 'move': {
        await delay(200);
        const col = esMiPersonaje ? miCol : opCol;
        const spriteId = esMiPersonaje ? 'mi-sprite' : 'op-sprite';
        const info = esMiPersonaje ? miShaolinInfo : oponenteSeleccionado;
        const skin = info ? info.skin : 'default';
        const gen = info ? info.genero : 'masculino';

        if (entry.p1 !== undefined) p1 = entry.p1;
        if (entry.p2 !== undefined) p2 = entry.p2;

        await animarPaso(spriteId, skin, gen, entry.retrocede ? -1 : 1);
        actualizarPosicion();
        const d = p1 + p2 - 1;
        addLog(logEl, `<span class="info">${entry.actor} se mueve (${entry.distancia !== undefined ? 'Dist ' + entry.distancia : ''})</span>`);
        await delay(200);
        break;
      }

      case 'range_change': {
        if (entry.p1 !== undefined) p1 = entry.p1;
        if (entry.p2 !== undefined) p2 = entry.p2;
        actualizarPosicion();
        const d = p1 + p2 - 1;
        addLog(logEl, `<span style="color:#8b6fa0">↔ ${entry.nombre || 'Distancia ' + d}</span>`);
        break;
      }

      case 'hit':
      case 'critical_hit': {
        await delay(200);
        const atkCol = esMi ? miCol : opCol;
        const defCol = esMi ? opCol : miCol;
        atkCol.classList.add(esMi ? 'atacando-der' : 'atacando-izq');
        await delay(250);

        const esCrit = entry.type === 'critical_hit';
        const color = esCrit ? '#f59e0b' : '#ef4444';
        const icono = esCrit ? '🔥 ' : '';
        mostrarFloat(defCol, `${icono}-${entry.damage}`, color, esCrit ? 1.5 : 1);
        defCol.classList.add('golpeado');
        if (esCrit) defCol.classList.add('flash-critico');

        const armaTxt = entry.conArma && entry.nombreArma ? ` con ${entry.nombreArma}` : '';
        const critTxt = esCrit ? ' 🔥 ¡CRÍTICO!' : '';
        addLog(logEl, `<span class="${esCrit ? 'critico' : 'danio'}">${entry.actor} ${entry.accion} a ${entry.target} -${entry.damage}HP${armaTxt}${critTxt}</span>`);

        atkCol.classList.remove('atacando-der', 'atacando-izq');
        break;
      }

      case 'miss': {
        await delay(200);
        const atkCol = esMi ? miCol : opCol;
        atkCol.classList.add(esMi ? 'atacando-der' : 'atacando-izq');
        await delay(250);
        atkCol.classList.remove('atacando-der', 'atacando-izq');
        addLog(logEl, `<span class="esquiva">${entry.actor} falló</span>`);
        break;
      }

      case 'dodge':
      case 'dodge_attempt': {
        addLog(logEl, `<span class="esquiva">🦵 ${entry.actor} intenta esquivar</span>`);
        break;
      }

      case 'dodge_success': {
        await delay(100);
        addLog(logEl, `<span class="esquiva">💨 ${entry.actor} esquivó el ataque</span>`);
        break;
      }

      case 'block_attempt': {
        addLog(logEl, `<span style="color:#94a3b8">🛡️ ${entry.actor} intenta bloquear</span>`);
        break;
      }

      case 'block_success': {
        addLog(logEl, `<span style="color:#60a5fa">🛡️ Bloqueo: ${entry.efficacy || '?'}% eficacia, daño reducido a ${entry.damageReduced}</span>`);
        break;
      }

      case 'glancing_hit': {
        await delay(150);
        const defCol = esMi ? opCol : miCol;
        defCol.classList.add('golpeado');
        mostrarFloat(defCol, `🛡️-${entry.damage}`, '#60a5fa', 0.9);
        addLog(logEl, `<span style="color:#60a5fa">🛡️ ${entry.actor} ${entry.accion} a ${entry.target} (bloqueado) -${entry.damage}HP</span>`);
        break;
      }

      case 'counter_attempt': {
        addLog(logEl, `<span style="color:#f97316">⚡ ${entry.actor} contraataca</span>`);
        break;
      }

      case 'counter_hit': {
        const col = esMi ? miCol : opCol;
        const targetCol = esMi ? opCol : miCol;
        mostrarFloat(col, `⚡-${entry.damage}`, '#f97316', 1.2);
        targetCol.classList.add('golpeado');
        addLog(logEl, `<span class="danio">⚡ ${entry.actor} contraataca -${entry.damage}HP</span>`);
        break;
      }

      case 'drop_weapon': {
        const col = esMiPersonaje ? miCol : opCol;
        mostrarFloat(col, '💔', '#ef4444', 1.3);
        const handId = esMiPersonaje ? 'mi-equipada' : 'op-equipada';
        const hand = document.getElementById(handId);
        hand.classList.add('hidden');
        const stripId = esMiPersonaje ? 'mi-weapons-strip' : 'op-weapons-strip';
        const armas = esMiPersonaje ? miShaolinInfo.armas : (oponenteSeleccionado ? oponenteSeleccionado.armas : []);
        renderWeaponStrip(stripId, armas, null);
        addLog(logEl, `<span class="danio">💔 ${entry.actor} perdió su ${entry.arma}</span>`);
        break;
      }

      case 'life_steal':
        addLog(logEl, `<span style="color:#34d399">💚 ${entry.actor} robó ${entry.amount}HP</span>`);
        break;

      case 'hp_update': {
        const lado = entry.actor === miNombre ? 'mi' : 'op';
        const maxHp = lado === 'mi' ? miHpMax : opHpMax;
        actualizarBarraHP(lado, entry.hp, maxHp);
        break;
      }

      case 'exposed':
        addLog(logEl, `<span style="color:#f97316">⚠️ ${entry.actor || ''} expuesto - defensa reducida</span>`);
        break;

      case 'combat_end':
        await delay(400);
        const resultadoEl = document.getElementById('resultado');
        resultadoEl.classList.remove('hidden');
        if (entry.winner === miShaolinInfo.id) {
          resultadoEl.className = 'resultado-combate victoria';
          let xpTexto = '';
          if (result.es_entrenamiento) {
            xpTexto = '🥋 Entrenamiento';
          } else if (result.xp_ganada > 0) {
            xpTexto = `+${result.xp_ganada} XP`;
          } else {
            xpTexto = '0 XP (oponente de nivel inferior)';
          }
          resultadoEl.innerHTML = `🏆 ¡VICTORIA! ${xpTexto}${result.tiene_nivel_pendiente ? '<div class="level-up mt-12">⬆️ ¡SUBISTE DE NIVEL!</div>' : ''}`;
          miCol.classList.add('anim-victoria');
          opCol.classList.add('anim-derrota');
        } else {
          resultadoEl.className = 'resultado-combate derrota';
          let xpTexto = result.es_entrenamiento ? '🥋 Entrenamiento' : '+1 XP';
          resultadoEl.innerHTML = `💀 DERROTA ${xpTexto}${result.tiene_nivel_pendiente ? '<div class="level-up mt-12">⬆️ ¡SUBISTE DE NIVEL!</div>' : ''}`;
          opCol.classList.add('anim-victoria');
          miCol.classList.add('anim-derrota');
        }
        if (result.tiene_nivel_pendiente && !result.es_entrenamiento) {
          const msg = document.createElement('div');
          msg.style.cssText = 'margin-top:12px;padding:12px;background:rgba(245,158,11,0.15);border:1px solid #f59e0b;border-radius:8px;text-align:center';
          msg.innerHTML = `⬆️ ¡Nivel pendiente! <a href="/shaolin.html?id=${shaolinId}" class="btn btn-primario" style="display:inline-block;margin-left:8px;padding:4px 16px;font-size:14px">Subir nivel</a>`;
          resultadoEl.appendChild(msg);
        }
        if (result.shaolin_actualizado && result.shaolin_actualizado.easterEgg) {
          const egg = document.createElement('div');
          egg.style.cssText = 'margin-top:12px;padding:16px;background:linear-gradient(135deg,rgba(245,158,11,0.2),rgba(245,158,11,0.05));border:1px solid #f59e0b;border-radius:8px;text-align:center';
          egg.innerHTML = `<div style="font-size:32px;margin-bottom:8px">🐉</div><div style="color:#fbbf24;font-weight:bold">${result.shaolin_actualizado.easterEggMsg || '🐉 El Maestro ha hablado...'}</div>`;
          resultadoEl.appendChild(egg);
        }

        const accEl = document.getElementById('acciones-post-combate');
        accEl.classList.remove('hidden');
        let btnsHtml = `<button class="btn btn-secundario" onclick="volverArena()">⬅ Elegir otro oponente</button>`;

        if (oponenteIdForPost > 0) {
          btnsHtml += `<button class="btn btn-primario" onclick="window.location.href='/base/${encodeURIComponent(oponenteNameForPost)}'">👤 Visitar base de ${oponenteNameForPost}</button>`;
        }

        btnsHtml += `<a href="/shaolin.html?id=${shaolinId}" class="btn btn-secundario">📋 Volver a mi base</a>`;
        btnsHtml += `<button class="btn btn-combatir" onclick="pelearAleatorio()">🎲 Pelear aleatorio</button>`;

        accEl.innerHTML = btnsHtml;
        break;

      default:
        break;
    }

    await delay(300);
  }
}

async function pelearAleatorio() {
  document.getElementById('acciones-post-combate').classList.add('hidden');
  document.getElementById('resultado').classList.add('hidden');
  document.getElementById('log-combate').innerHTML = '<div style="text-align:center;color:#8b6fa0">🎲 Buscando oponente...</div>';

  try {
    const data = await API.post('/arena/random', {
      shaolin_id: shaolinId,
      esEntrenamiento: esModoEntreno,
    });
    await iniciarCombate(data.opponent, data.type === 'bot');
  } catch (err) {
    alert('Error: ' + err.message);
    volverArena();
  }
}

function addLog(logEl, html) {
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.innerHTML = `⚔️ ${html}`;
  logEl.appendChild(entry);
  logEl.scrollTop = logEl.scrollHeight;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadArena();
});