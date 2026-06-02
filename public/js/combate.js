let brutoId = null;
let oponenteSeleccionado = null;

async function loadArena() {
  const params = new URLSearchParams(window.location.search);
  brutoId = parseInt(params.get('bruto_id'));

  try {
    const miBruto = await API.get(`/brutos/${brutoId}`);
    const avatar = miBruto.genero === 'femenino' ? '👩' : '👨';
    const color = miBruto.genero === 'femenino' ? '#e879f9' : '#60a5fa';

    document.getElementById('mi-bruto-info').innerHTML = `
      <div class="combatiente">
        <div class="avatar" style="border-color:${color}">${avatar}</div>
        <div style="font-weight:bold">${miBruto.name}</div>
        <div style="font-size:13px;color:#8b6fa0">Nv.${miBruto.level}</div>
        <div class="stat-barra" style="margin-top:8px">
          <span class="label">HP</span>
          <div class="barra"><div class="fill hp" style="width:${(miBruto.hp / miBruto.max_hp) * 100}%"></div></div>
          <span class="valor">${miBruto.hp}</span>
        </div>
      </div>
    `;
  } catch (err) {
    if (err.message.includes('Token')) { logout(); }
    else { alert('Error: ' + err.message); }
  }

  try {
    const oponentes = await API.get('/arena/oponentes');
    const listEl = document.getElementById('oponentes-lista');

    oponentes.forEach(op => {
      const card = document.createElement('div');
      card.className = 'oponente-card';
      card.innerHTML = `
        <div class="nombre">${op.name}</div>
        <div class="dueño">👤 ${op.username}</div>
        <div style="font-size:13px;margin-top:8px">
          Nv.${op.level} · ❤️${op.hp} · 💪${op.fuerza} · 🏃${op.agilidad} · ⚡${op.velocidad}
        </div>
        <button class="btn btn-combatir mt-12" style="width:100%">Combatir</button>
      `;
      card.querySelector('button').addEventListener('click', () => iniciarCombate(op));
      listEl.appendChild(card);
    });
  } catch (err) {
    if (err.message.includes('Token')) { logout(); }
    else { alert('Error: ' + err.message); }
  }
}

async function iniciarCombate(oponente) {
  oponenteSeleccionado = oponente;

  document.getElementById('seleccion-oponentes').classList.add('hidden');
  document.getElementById('pantalla-combate').classList.remove('hidden');

  const avatar = oponente.genero === 'femenino' ? '👩' : '👨';
  const color = oponente.genero === 'femenino' ? '#e879f9' : '#60a5fa';

  document.getElementById('oponente-combate').innerHTML = `
    <div class="combatiente">
      <div class="avatar" style="border-color:${color}">${avatar}</div>
      <div style="font-weight:bold">${oponente.name}</div>
      <div style="font-size:13px;color:#8b6fa0">Nv.${oponente.level} · ${oponente.username}</div>
      <div class="stat-barra" style="margin-top:8px">
        <span class="label">HP</span>
        <div class="barra"><div id="op-hp-fill" class="fill hp" style="width:100%"></div></div>
        <span class="valor" id="op-hp-text">${oponente.hp}</span>
      </div>
    </div>
  `;

  document.getElementById('log-combate').innerHTML = '<div style="text-align:center;color:#8b6fa0">⚔️ Preparando combate...</div>';
  document.getElementById('resultado').classList.add('hidden');

  try {
    const result = await API.post(`/arena/combatir/${oponente.id}`, { bruto_id: brutoId });
    reproducirCombate(result);
  } catch (err) {
    alert('Error: ' + err.message);
    location.reload();
  }
}

async function reproducirCombate(result) {
  const log = result.log;
  const logEl = document.getElementById('log-combate');
  const hpOpText = document.getElementById('op-hp-text');
  const hpOpFill = document.getElementById('op-hp-fill');
  const hpMiFill = document.querySelector('#mi-bruto-info .fill.hp');
  const hpMiText = document.querySelector('#mi-bruto-info .valor');

  let hpMiActual = log.length > 0 ? log[0].hp_atacante : 0;
  let hpOpActual = log.length > 0 ? log[0].hp_defensor : 0;
  const hpMiMax = parseInt(hpMiText.textContent);
  const hpOpMax = oponenteSeleccionado ? oponenteSeleccionado.max_hp : oponenteSeleccionado.hp;

  logEl.innerHTML = '<div style="text-align:center;color:#8b6fa0">⚔️ ¡Combatiendo!</div>';

  for (let i = 0; i < log.length; i++) {
    const entry = log[i];

    await delay(1200);

    if (entry.atacante_nombre === document.querySelector('#mi-bruto-info div:first-child').textContent) {
      hpOpActual = entry.hp_defensor;
    } else {
      hpMiActual = entry.hp_atacante;
    }

    const hpOpPercent = Math.max(0, (hpOpActual / hpOpMax) * 100);
    const hpMiPercent = Math.max(0, (hpMiActual / hpMiMax) * 100);

    hpOpFill.style.width = `${hpOpPercent}%`;
    hpOpText.textContent = Math.max(0, hpOpActual);
    hpMiFill.style.width = `${hpMiPercent}%`;
    hpMiText.textContent = Math.max(0, hpMiActual);

    let clase = 'danio';
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
