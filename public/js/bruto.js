async function loadBruto() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) { window.location.href = '/dashboard.html'; return; }

  try {
    const b = await API.get(`/brutos/${id}`);
    const avatar = b.genero === 'femenino' ? '👩' : '👨';
    const color = b.genero === 'femenino' ? '#e879f9' : '#60a5fa';
    const xpNeeded = b.level * 10 + 10;
    const xpPercent = Math.min(100, (b.xp / xpNeeded) * 100);

    document.getElementById('bruto-title').textContent = b.name;
    document.getElementById('bruto-name-display').textContent = b.name;
    document.getElementById('bruto-level').textContent = `Nivel ${b.level}`;
    document.getElementById('bruto-avatar').innerHTML = avatar;
    document.getElementById('bruto-avatar').style.borderColor = color;

    document.getElementById('hp-fill').style.width = `${(b.hp / b.max_hp) * 100}%`;
    document.getElementById('hp-text').textContent = `${b.hp}/${b.max_hp}`;
    document.getElementById('xp-fill').style.width = `${xpPercent}%`;
    document.getElementById('xp-text').textContent = `${b.xp}/${xpNeeded}`;
    document.getElementById('fuerza-fill').style.width = `${(b.fuerza / 50) * 100}%`;
    document.getElementById('fuerza-text').textContent = b.fuerza;
    document.getElementById('agilidad-fill').style.width = `${(b.agilidad / 50) * 100}%`;
    document.getElementById('agilidad-text').textContent = b.agilidad;
    document.getElementById('velocidad-fill').style.width = `${(b.velocidad / 50) * 100}%`;
    document.getElementById('velocidad-text').textContent = b.velocidad;

    if (b.armas && b.armas.length > 0) {
      document.getElementById('armas-container').innerHTML = b.armas.map(a => `
        <div class="item-card" style="${a.equipada ? 'border-color:#8b5cf6' : ''}">
          <div class="icono">🗡️</div>
          <div class="nombre">${a.nombre}</div>
          <div class="info">${a.dano_min}-${a.dano_max} daño</div>
        </div>
      `).join('');
    } else {
      document.getElementById('armas-container').innerHTML = '<div style="color:#8b6fa0">Sin armas</div>';
    }

    if (b.habilidades && b.habilidades.length > 0) {
      document.getElementById('habilidades-container').innerHTML = b.habilidades.map(h => `
        <div class="item-card">
          <div class="icono">✨</div>
          <div class="nombre">${h.nombre}</div>
          <div class="info">${h.descripcion || ''}</div>
        </div>
      `).join('');
    } else {
      document.getElementById('habilidades-container').innerHTML = '<div style="color:#8b6fa0">Sin habilidades</div>';
    }

    if (b.mascotas && b.mascotas.length > 0) {
      document.getElementById('mascotas-container').innerHTML = b.mascotas.map(m => `
        <div class="item-card">
          <div class="icono">🐾</div>
          <div class="nombre">${m.nombre}</div>
          <div class="info">❤️${m.hp} ⚔️${m.ataque}</div>
        </div>
      `).join('');
    } else {
      document.getElementById('mascotas-container').innerHTML = '<div style="color:#8b6fa0">Sin mascotas</div>';
    }

    document.getElementById('arena-btn').href = `/arena.html?bruto_id=${b.id}`;

    const combates = await API.get(`/arena/historial/${b.id}`);
    const historialEl = document.getElementById('historial-combates');
    if (combates && combates.length > 0) {
      historialEl.innerHTML = combates.map(c => {
        const ganada = c.winner_id === b.id;
        const oponente = c.bruto1_id === b.id ? c.bruto2_name : c.bruto1_name;
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

  } catch (err) {
    if (err.message.includes('Token')) { logout(); }
    else { alert('Error: ' + err.message); }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadBruto();
});
