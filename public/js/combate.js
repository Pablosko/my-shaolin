let brutoId = null;
let oponenteSeleccionado = null;
let modoBot = false;
let miBrutoInfo = null;

async function loadArena() {
  const params = new URLSearchParams(window.location.search);
  brutoId = parseInt(params.get('bruto_id'));

  try {
    miBrutoInfo = await API.get(`/brutos/${brutoId}`);
    const avatar = miBrutoInfo.genero === 'femenino' ? '👩' : '👨';
    const color = miBrutoInfo.genero === 'femenino' ? '#e879f9' : '#60a5fa';

    document.getElementById('mi-bruto-info').innerHTML = `
      <div class="combatiente">
        <div class="avatar" style="border-color:${color}">${avatar}</div>
        <div id="mi-bruto-nombre" style="font-weight:bold">${miBrutoInfo.name}</div>
        <div style="font-size:13px;color:#8b6fa0">Nv.${miBrutoInfo.level}</div>
        <div class="stat-barra" style="margin-top:8px">
          <span class="label">HP</span>
          <div class="barra"><div id="mi-hp-fill" class="fill hp" style="width:${(miBrutoInfo.hp / miBrutoInfo.max_hp) * 100}%"></div></div>
          <span class="valor" id="mi-hp-text">${miBrutoInfo.hp}</span>
        </div>
      </div>
    `;

    const restantes = 3 - (miBrutoInfo.ultimo_combate === new Date().toISOString().split('T')[0] ? miBrutoInfo.combates_hoy : 0);
    document.getElementById('combates-restantes').textContent = Math.max(0, restantes);
  } catch (err) {
    if (err.message.includes('Token')) { logout(); }
    else { alert('Error: ' + err.message); }
  }

  cargarOponentes();
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
    ${op.mascotas && op.mascotas.length > 0 ? '<div style="font-size:11px;color:#8b6fa0">🐾 ' + op.mascotas.map(m => m.nombre).join(', ') + '</div>' : ''}
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

  const avatar = oponente.genero === 'femenino' ? '👩' : '👨';
  const color = oponente.genero === 'femenino' ? '#e879f9' : '#60a5fa';

  document.getElementById('oponente-combate').innerHTML = `
    <div class="combatiente">
      <div class="avatar" style="border-color:${color}">${avatar}</div>
      <div id="op-nombre-text" style="font-weight:bold">${oponente.name}</div>
      <div style="font-size:13px;color:#8b6fa0">${modoBot ? '🤖 Bot' : '👤 ' + (oponente.username || '')} · Nv.${oponente.level}</div>
      <div class="stat-barra" style="margin-top:8px">
        <span class="label">HP</span>
        <div class="barra"><div id="op-hp-fill" class="fill hp" style="width:100%"></div></div>
        <span class="valor" id="op-hp-text">${oponente.max_hp || oponente.hp}</span>
      </div>
    </div>
  `;

  document.getElementById('log-combate').innerHTML = '<div style="text-align:center;color:#8b6fa0">⚔️ Preparando combate...</div>';
  document.getElementById('resultado').classList.add('hidden');
  document.getElementById('btn-volver-arena').classList.add('hidden');

  try {
    const body = { bruto_id: brutoId };
    if (modoBot) {
      body.oponente_data = oponente;
    }
    const result = await API.post(`/arena/combatir/${oponente.id}`, body);
    reproducirCombate(result);
  } catch (err) {
    alert('Error: ' + err.message);
    location.reload();
  }
}

async function reproducirCombate(result) {
  const log = result.log;
  const logEl = document.getElementById('log-combate');

  const miNombre = document.getElementById('mi-bruto-nombre').textContent;
  const opNombre = document.getElementById('op-nombre-text').textContent;

  const miHpMax = miBrutoInfo.max_hp;
  const opHpMax = oponenteSeleccionado.max_hp || oponenteSeleccionado.hp;

  const miHpFill = document.getElementById('mi-hp-fill');
  const miHpText = document.getElementById('mi-hp-text');
  const opHpFill = document.getElementById('op-hp-fill');
  const opHpText = document.getElementById('op-hp-text');

  let hpMiActual = miHpMax;
  let hpOpActual = opHpMax;

  logEl.innerHTML = '<div style="text-align:center;color:#8b6fa0">⚔️ ¡Combatiendo!</div>';

  for (let i = 0; i < log.length; i++) {
    const entry = log[i];

    await delay(1200);

    if (entry.atacante_nombre === miNombre) {
      hpOpActual = entry.hp_defensor;
      hpMiActual = entry.hp_atacante;
    } else {
      hpMiActual = entry.hp_defensor;
      hpOpActual = entry.hp_atacante;
    }

    opHpFill.style.width = Math.max(0, (hpOpActual / opHpMax) * 100) + '%';
    opHpText.textContent = Math.max(0, hpOpActual);
    miHpFill.style.width = Math.max(0, (hpMiActual / miHpMax) * 100) + '%';
    miHpText.textContent = Math.max(0, hpMiActual);

    let texto = '';

    if (entry.esquivo || entry.daño === 0) {
      texto = `<span class="esquiva">${entry.atacante_nombre} falló el golpe</span>`;
    } else {
      texto = `<span class="${entry.critico ? 'critico' : 'danio'}">${entry.atacante_nombre} ${entry.accion} a ${entry.defensor_nombre}`;
      if (entry.critico) texto += ' 🔥 ¡CRÍTICO!';
      texto += ` -${entry.daño}HP</span>`;
    }

    if (entry.contraataca) {
      texto += `<br><span class="danio">⚡ ${entry.defensor_nombre} contraataca -${entry.daño_contra}HP</span>`;
    }
    if (entry.daño_mascota_atq > 0) {
      texto += `<br><span class="curacion">🐾 Mascota de ${entry.atacante_nombre} ataca -${entry.daño_mascota_atq}HP</span>`;
    }
    if (entry.daño_mascota_def > 0) {
      texto += `<br><span class="curacion">🐾 Mascota de ${entry.defensor_nombre} ataca -${entry.daño_mascota_def}HP</span>`;
    }

    const entryEl = document.createElement('div');
    entryEl.className = 'log-entry';
    entryEl.innerHTML = `⚔️ ${texto}`;
    logEl.appendChild(entryEl);
    logEl.scrollTop = logEl.scrollHeight;
  }

  await delay(500);

  const resultadoEl = document.getElementById('resultado');
  resultadoEl.classList.remove('hidden');

  if (result.resultado === 'victoria') {
    resultadoEl.className = 'resultado-combate victoria';
    resultadoEl.innerHTML = `
      🏆 ¡VICTORIA! +2 XP
      ${result.subio_nivel ? '<div class="level-up mt-12">⬆️ ¡SUBISTE DE NIVEL!</div>' : ''}
    `;
  } else {
    resultadoEl.className = 'resultado-combate derrota';
    resultadoEl.innerHTML = `
      💀 DERROTA +1 XP
      ${result.subio_nivel ? '<div class="level-up mt-12">⬆️ ¡SUBISTE DE NIVEL!</div>' : ''}
    `;
  }

  document.getElementById('btn-volver-arena').classList.remove('hidden');
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadArena();
});
