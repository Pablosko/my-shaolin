let shaolinId = null;
let oponenteSeleccionado = null;
let modoBot = false;
let miShaolinInfo = null;
let miHpMax = 0;
let opHpMax = 0;
let rangoActual = 3;

const RANGO_NOMBRE = ['Contacto', 'Corta', 'Media', 'Guardia', 'Larga'];
const RANGO_PX = [0, 1, 2, 3, 4];

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
    const miAvatarEl = document.getElementById('mi-avatar');
    miAvatarEl.innerHTML = '';
    miAvatarEl.appendChild(crearAvatarImg(miShaolinInfo.genero, miShaolinInfo.skin));

    const weaponsEl = document.getElementById('mi-weapons');
    if (miShaolinInfo.armas && miShaolinInfo.armas.length > 0) {
      weaponsEl.innerHTML = miShaolinInfo.armas.map(a => `<span class="reserva-item">🗡️ ${a.nombre}</span>`).join('');
    }

    miHpMax = miShaolinInfo.max_hp;
    actualizarBarraHP('mi', miShaolinInfo.hp, miHpMax);

    const hoy = new Date().toISOString().split('T')[0];
    const restantes = 500 - (miShaolinInfo.ultimo_combate === hoy ? miShaolinInfo.combates_hoy : 0);
    document.getElementById('combates-restantes').textContent = Math.max(0, restantes);
  } catch (err) {
    if (err.message.includes('Token')) { logout(); }
    else { alert('Error: ' + err.message); }
  }

  cargarOponentes();
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

async function cargarOponentes() {
  try {
    const oponentes = await API.get('/arena/oponentes');
    const listEl = document.getElementById('oponentes-lista');

    if (oponentes.length === 0) {
      listEl.innerHTML = `
        <div class="card" style="text-align:center;grid-column:1/-1">
          <div style="font-size:48px;margin-bottom:12px">😴</div>
          <div style="color:#8b6fa0;margin-bottom:16px">No hay guerreros disponibles...</div>
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
    const bots = await API.get('/arena/bots');
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
      Nv.${op.level} · ❤️${op.hp} · 💪${op.fuerza} · 🏃${op.agilidad} · ⚡${op.velocidad}
    </div>
    ${op.armas && op.armas.length > 0 ? '<div style="font-size:11px;color:#8b6fa0">🗡️ ' + op.armas.map(a => a.nombre).join(', ') + '</div>' : ''}
    <button class="btn btn-combatir mt-12" style="width:100%">⚔️ Combatir</button>
  `;
  card.querySelector('button').addEventListener('click', () => iniciarCombate(op, esBot));
  return card;
}

async function iniciarCombate(oponente, esBot = false) {
  oponenteSeleccionado = oponente;
  modoBot = esBot;

  document.getElementById('seleccion-oponentes').classList.add('hidden');
  document.getElementById('pantalla-combate').classList.remove('hidden');

  document.getElementById('op-nombre').textContent = oponente.name;
  const opAvatarEl = document.getElementById('op-avatar');
  opAvatarEl.innerHTML = '';
  opAvatarEl.appendChild(crearAvatarImg(oponente.genero, oponente.skin));

  const opWeaponsEl = document.getElementById('op-weapons');
  if (oponente.armas && oponente.armas.length > 0) {
    opWeaponsEl.innerHTML = oponente.armas.map(a => `<span class="reserva-item">🗡️ ${a.nombre}</span>`).join('');
  }

  opHpMax = oponente.max_hp || oponente.hp;
  actualizarBarraHP('op', opHpMax, opHpMax);

  document.getElementById('log-combate').innerHTML = '<div style="text-align:center;color:#8b6fa0">⚔️ Preparando combate...</div>';
  document.getElementById('resultado').classList.add('hidden');
  document.getElementById('btn-volver-arena').classList.add('hidden');

  try {
    const body = { shaolin_id: shaolinId };
    if (modoBot) body.oponente_data = oponente;
    const result = await API.post(`/arena/combatir/${oponente.id}`, body);
    renderCombate(result);
  } catch (err) {
    alert('Error en combate: ' + err.message);
    document.getElementById('seleccion-oponentes').classList.remove('hidden');
    document.getElementById('pantalla-combate').classList.add('hidden');
  }
}

async function renderCombate(result) {
  const log = result.log;
  const logEl = document.getElementById('log-combate');
  const miNombre = miShaolinInfo.name;
  const miCol = document.getElementById('luchador-mi');
  const opCol = document.getElementById('luchador-op');
  const paMiEl = document.getElementById('pa-mi-valor');
  const paOpEl = document.getElementById('pa-op-valor');
  const rangoInd = document.getElementById('rango-indicator');

  logEl.innerHTML = '';
  rangoActual = 3;
  actualizarPosicion(miCol, opCol, rangoActual);

  function actualizarPosicion(l, r, rango) {
    l.style.setProperty('--pos', rango);
    r.style.setProperty('--pos', rango);
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

  for (const entry of log) {
    const esMi = entry.actor === miNombre || entry.atacante_nombre === miNombre || entry.target === miNombre;
    const esMiPersonaje = entry.actor === miNombre || entry.nombre === miNombre || entry.atacante_nombre === miNombre;

    switch (entry.type) {
      case 'combat_start':
        rangoActual = entry.rango;
        actualizarPosicion(miCol, opCol, rangoActual);
        rangoInd.textContent = `Rango ${entry.rango} · ${entry.rangoNombre}`;
        break;

      case 'turn_start':
        await delay(300);
        break;

      case 'pa':
        if (esMiPersonaje) {
          paMiEl.textContent = entry.pa;
        } else {
          paOpEl.textContent = entry.pa;
        }
        break;

      case 'draw_weapon':
      case 'switch_weapon': {
        await delay(200);
        const col = esMiPersonaje ? miCol : opCol;
        const equipadaId = esMiPersonaje ? 'mi-equipada' : 'op-equipada';
        const eq = document.getElementById(equipadaId);
        if (entry.type === 'switch_weapon') {
          mostrarFloat(col, '🔄', '#fbbf24', 1.2);
          eq.innerHTML = `⚔️ ${entry.arma_nueva}`;
          addLog(logEl, `<span class="info">🔄 ${entry.actor} cambió ${entry.arma_vieja} por ${entry.arma_nueva}</span>`);
        } else {
          mostrarFloat(col, '🗡️', '#fbbf24', 1.3);
          eq.innerHTML = `⚔️ ${entry.arma}`;
          addLog(logEl, `<span class="info">🗡️ ${entry.actor} sacó ${entry.arma}</span>`);
        }
        eq.classList.remove('hidden');
        break;
      }

      case 'move': {
        await delay(300);
        const col = esMiPersonaje ? miCol : opCol;
        const dir = !esMiPersonaje;
        if (dir) col.classList.add('atacando-izq');
        else col.classList.add('atacando-der');
        await delay(300);
        rangoActual = entry.to;
        actualizarPosicion(miCol, opCol, rangoActual);
        rangoInd.textContent = `Rango ${entry.to} · ${RANGO_NOMBRE[entry.to]}`;
        col.classList.remove('atacando-izq', 'atacando-der');
        addLog(logEl, `<span class="info">${entry.actor} avanza</span>`);
        await delay(200);
        break;
      }

      case 'hit':
      case 'critical_hit': {
        await delay(200);
        const atkCol = esMi ? miCol : opCol;
        const defCol = esMi ? opCol : miCol;
        const atkDir = esMi;
        atkCol.classList.add(atkDir ? 'atacando-der' : 'atacando-izq');
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

      case 'dodge': {
        await delay(100);
        addLog(logEl, `<span class="esquiva">${entry.actor} esquivó</span>`);
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
        const equipadaId = esMiPersonaje ? 'mi-equipada' : 'op-equipada';
        document.getElementById(equipadaId).classList.add('hidden');
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
        addLog(logEl, `<span style="color:#f97316">⚠️ ${entry.mensaje}</span>`);
        break;

      case 'combat_end':
        await delay(400);
        const resultadoEl = document.getElementById('resultado');
        resultadoEl.classList.remove('hidden');
        if (entry.winner === miShaolinInfo.id) {
          resultadoEl.className = 'resultado-combate victoria';
          resultadoEl.innerHTML = `🏆 ¡VICTORIA! +2 XP${result.subio_nivel ? '<div class="level-up mt-12">⬆️ ¡SUBISTE DE NIVEL!</div>' : ''}`;
          miCol.classList.add('anim-victoria');
          opCol.classList.add('anim-derrota');
        } else {
          resultadoEl.className = 'resultado-combate derrota';
          resultadoEl.innerHTML = `💀 DERROTA +1 XP${result.subio_nivel ? '<div class="level-up mt-12">⬆️ ¡SUBISTE DE NIVEL!</div>' : ''}`;
          opCol.classList.add('anim-victoria');
          miCol.classList.add('anim-derrota');
        }
        if (result.tiene_nivel_pendiente) {
          const msg = document.createElement('div');
          msg.style.cssText = 'margin-top:12px;padding:12px;background:rgba(245,158,11,0.15);border:1px solid #f59e0b;border-radius:8px;text-align:center';
          msg.innerHTML = `⬆️ ¡Nivel pendiente! <a href="/shaolin.html?id=${shaolinId}" class="btn btn-primario" style="display:inline-block;margin-left:8px;padding:4px 16px;font-size:14px">Subir nivel</a>`;
          resultadoEl.appendChild(msg);
        }
        document.getElementById('btn-volver-arena').classList.remove('hidden');
        break;

      default:
        break;
    }

    await delay(300);
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
