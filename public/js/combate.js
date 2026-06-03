let shaolinId = null;
let oponenteSeleccionado = null;
let modoBot = false;
let miShaolinInfo = null;

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

    actualizarBarraHP('mi', miShaolinInfo.hp, miShaolinInfo.max_hp);

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
          <div style="color:#8b6fa0;margin-bottom:16px">No hay guerreros disponibles en la arena...</div>
          <button class="btn btn-combatir" onclick="cargarBots()">🤖 Generar bots de práctica</button>
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
    botBtn.innerHTML = `<button class="btn btn-secundario" onclick="cargarBots()">🤖 O practicar contra bots</button>`;
    listEl.appendChild(botBtn);
  } catch (err) {
    if (err.message.includes('Token')) { logout(); }
    else { alert('Error: ' + err.message); }
  }
}

async function cargarBots() {
  const listEl = document.getElementById('oponentes-lista');
  listEl.innerHTML = '<div style="text-align:center;color:#8b6fa0;grid-column:1/-1">Generando guerreros de práctica...</div>';

  try {
    const bots = await API.get('/arena/bots');
    listEl.innerHTML = '';
    bots.forEach(bot => {
      const card = crearCardOponente(bot);
      listEl.appendChild(card);
    });
  } catch (err) {
    alert('Error al generar bots: ' + err.message);
  }
}

function crearCardOponente(op) {
  const esBot = op.id < 0;
  const avatar = op.genero === 'femenino' ? '👩' : '👨';

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

  const opHpMax = oponente.max_hp || oponente.hp;
  actualizarBarraHP('op', opHpMax, opHpMax);

  document.getElementById('log-combate').innerHTML = '<div style="text-align:center;color:#8b6fa0">⚔️ Preparando combate...</div>';
  document.getElementById('resultado').classList.add('hidden');
  document.getElementById('btn-volver-arena').classList.add('hidden');

  try {
    const body = { shaolin_id: shaolinId };
    if (modoBot) {
      body.oponente_data = oponente;
    }
    const result = await API.post(`/arena/combatir/${oponente.id}`, body);

    if (result.tiene_nivel_pendiente) {
      // auto-refresh in background
    }

    renderResultadoVisual(result);
  } catch (err) {
    alert('Error en combate: ' + err.message);
    document.getElementById('seleccion-oponentes').classList.remove('hidden');
    document.getElementById('pantalla-combate').classList.add('hidden');
  }
}

async function renderResultadoVisual(result) {
  const log = result.log;
  const logEl = document.getElementById('log-combate');
  const miNombre = miShaolinInfo.name;
  const miHpMax = miShaolinInfo.max_hp;
  const opHpMax = oponenteSeleccionado.max_hp || oponenteSeleccionado.hp;
  const miCol = document.getElementById('luchador-mi');
  const opCol = document.getElementById('luchador-op');
  let hpMiActual = miHpMax;
  let hpOpActual = opHpMax;

  logEl.innerHTML = '';
  document.getElementById('mi-equipada').classList.add('hidden');
  document.getElementById('op-equipada').classList.add('hidden');

  function quitarAnimaciones() {
    document.querySelectorAll('.luchador-col').forEach(c => {
      c.classList.remove('atacando-der', 'atacando-izq', 'golpeado', 'flash-critico', 'anim-victoria', 'anim-derrota');
    });
  }

  for (let i = 0; i < log.length; i++) {
    const entry = log[i];
    await delay(900);

    const esMiAtacante = entry.atacante_nombre === miNombre;
    const atacanteCol = esMiAtacante ? miCol : opCol;
    const defensorCol = esMiAtacante ? opCol : miCol;

    if (esMiAtacante) {
      hpOpActual = entry.hp_defensor;
      hpMiActual = entry.hp_atacante;
    } else {
      hpMiActual = entry.hp_defensor;
      hpOpActual = entry.hp_atacante;
    }

    quitarAnimaciones();
    atacanteCol.classList.add(esMiAtacante ? 'atacando-der' : 'atacando-izq');

    if (entry.usaArma && entry.nombreArma) {
      mostrarFloat(atacanteCol, '🗡️', '#fbbf24', 1.8);
      const equipadaId = esMiAtacante ? 'mi-equipada' : 'op-equipada';
      const equipadaEl = document.getElementById(equipadaId);
      equipadaEl.innerHTML = `⚔️ ${entry.nombreArma}`;
      equipadaEl.classList.remove('hidden');
    }

    await delay(350);

    if (entry.esquivo || entry.daño === 0) {
      mostrarFloat(defensorCol, 'ESQUIVA!', '#60a5fa', 1.2);
    } else {
      const color = entry.critico ? '#f59e0b' : '#ef4444';
      const icono = entry.critico ? '🔥 ' : '';
      mostrarFloat(defensorCol, `${icono}-${entry.daño}`, color, entry.critico ? 1.5 : 1);
      if (entry.critico) {
        defensorCol.classList.add('flash-critico');
      }
    }

    defensorCol.classList.add('golpeado');
    actualizarBarraHP('mi', hpMiActual, miHpMax);
    actualizarBarraHP('op', hpOpActual, opHpMax);

    await delay(500);
    quitarAnimaciones();

    if (entry.contraataca && entry.daño_contra > 0) {
      await delay(300);
      defensorCol.classList.add(esMiAtacante ? 'atacando-izq' : 'atacando-der');
      mostrarFloat(atacanteCol, `⚡-${entry.daño_contra}`, '#f97316');
      await delay(400);
      defensorCol.classList.remove('atacando-izq', 'atacando-der');
    }

    if (entry.robo_vida > 0) {
      mostrarFloat(atacanteCol, `💚 +${entry.robo_vida}`, '#34d399');
    }

    let texto = '';
    if (entry.esquivo || entry.daño === 0) {
      texto = `<span class="esquiva">${entry.atacante_nombre} falló el golpe</span>`;
    } else {
      const armaTexto = entry.usaArma && entry.nombreArma ? ` con ${entry.nombreArma}` : ' con puños';
      texto = `<span class="${entry.critico ? 'critico' : 'danio'}">${entry.atacante_nombre} ${entry.accion} a ${entry.defensor_nombre} -${entry.daño}HP${armaTexto}</span>`;
    }
    if (entry.contraataca && entry.daño_contra > 0) {
      texto += `<br><span class="danio">⚡ ${entry.defensor_nombre} contraataca -${entry.daño_contra}HP</span>`;
    }
    if (entry.robo_vida > 0) {
      texto += `<br><span class="danio" style="color:#34d399">💚 ${entry.atacante_nombre} robó ${entry.robo_vida}HP</span>`;
    }

    const entryEl = document.createElement('div');
    entryEl.className = 'log-entry';
    entryEl.innerHTML = `⚔️ ${texto}`;
    logEl.appendChild(entryEl);
    logEl.scrollTop = logEl.scrollHeight;
  }

  await delay(600);

  const resultadoEl = document.getElementById('resultado');
  resultadoEl.classList.remove('hidden');

  if (result.resultado === 'victoria') {
    resultadoEl.className = 'resultado-combate victoria';
    resultadoEl.innerHTML = `
      🏆 ¡VICTORIA! +2 XP
      ${result.subio_nivel ? '<div class="level-up mt-12">⬆️ ¡SUBISTE DE NIVEL!</div>' : ''}
    `;
    miCol.classList.add('anim-victoria');
    opCol.classList.add('anim-derrota');
  } else {
    resultadoEl.className = 'resultado-combate derrota';
    resultadoEl.innerHTML = `
      💀 DERROTA +1 XP
      ${result.subio_nivel ? '<div class="level-up mt-12">⬆️ ¡SUBISTE DE NIVEL!</div>' : ''}
    `;
    opCol.classList.add('anim-victoria');
    miCol.classList.add('anim-derrota');
  }

  if (result.tiene_nivel_pendiente) {
    const msg = document.createElement('div');
    msg.style.cssText = 'margin-top:12px;padding:12px;background:rgba(245,158,11,0.15);border:1px solid #f59e0b;border-radius:8px;text-align:center';
    msg.innerHTML = `⬆️ ¡Tienes un nivel pendiente! <a href="/shaolin.html?id=${shaolinId}" class="btn btn-primario" style="display:inline-block;margin-left:8px;padding:4px 16px;font-size:14px">Subir nivel</a>`;
    resultadoEl.appendChild(msg);
  }

  document.getElementById('btn-volver-arena').classList.remove('hidden');
}

function mostrarFloat(columna, texto, color, escala = 1) {
  const el = document.createElement('div');
  el.className = 'float-dmg';
  el.textContent = texto;
  el.style.color = color;
  el.style.setProperty('--escala', escala);
  columna.appendChild(el);
  setTimeout(() => el.remove(), 1200);
}

async function renderResultadoDirecto(result) {
  const log = result.log;
  const logEl = document.getElementById('log-combate');

  logEl.innerHTML = '<div style="text-align:center;color:#8b6fa0">⚔️ Resultado del combate</div>';

  for (const entry of log) {
    let texto = '';
    if (entry.esquivo || entry.daño === 0) {
      texto = `<span class="esquiva">${entry.atacante_nombre} falló el golpe</span>`;
    } else {
      const armaTexto = entry.usaArma && entry.nombreArma ? ` con ${entry.nombreArma}` : ' con puños';
      texto = `<span class="${entry.critico ? 'critico' : 'danio'}">${entry.atacante_nombre} ${entry.accion} a ${entry.defensor_nombre} -${entry.daño}HP${armaTexto}</span>`;
    }
    const entryEl = document.createElement('div');
    entryEl.className = 'log-entry';
    entryEl.innerHTML = `⚔️ ${texto}`;
    logEl.appendChild(entryEl);
  }

  const resultadoEl = document.getElementById('resultado');
  if (resultadoEl) {
    resultadoEl.classList.remove('hidden');
    if (result.resultado === 'victoria') {
      resultadoEl.className = 'resultado-combate victoria';
      resultadoEl.innerHTML = `🏆 ¡VICTORIA! +2 XP${result.subio_nivel ? '<div class="level-up mt-12">⬆️ ¡SUBISTE DE NIVEL!</div>' : ''}`;
    } else {
      resultadoEl.className = 'resultado-combate derrota';
      resultadoEl.innerHTML = `💀 DERROTA +1 XP${result.subio_nivel ? '<div class="level-up mt-12">⬆️ ¡SUBISTE DE NIVEL!</div>' : ''}`;
    }
  }

  const btnVolver = document.getElementById('btn-volver-arena');
  if (btnVolver) btnVolver.classList.remove('hidden');
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadArena();
});
