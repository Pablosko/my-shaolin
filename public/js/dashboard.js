async function loadBrutos() {
  try {
    const brutos = await API.get('/brutos');
    const container = document.getElementById('brutos-container');
    const username = localStorage.getItem('username');

    document.getElementById('user-name').textContent = username;

    container.innerHTML = '';

    brutos.forEach(b => {
      const avatar = b.genero === 'femenino' ? '👩' : '👨';
      const color = b.genero === 'femenino' ? '#e879f9' : '#60a5fa';

      const card = document.createElement('div');
      card.className = 'bruto-card';
      card.innerHTML = `
        <div class="bruto-avatar" style="background: ${color}20; border: 2px solid ${color}">
          ${avatar}
        </div>
        <div class="bruto-name">${b.name}</div>
        <div class="bruto-level">Nivel ${b.level} · ${b.genero === 'femenino' ? '♀' : '♂'}</div>
        <div class="bruto-stats">
          <span>❤️ HP <b>${b.hp}/${b.max_hp}</b></span>
          <span>💪 Fuerza <b>${b.fuerza}</b></span>
          <span>🏃 Agilidad <b>${b.agilidad}</b></span>
          <span>⚡ Velocidad <b>${b.velocidad}</b></span>
        </div>
      `;
      card.addEventListener('click', () => {
        window.location.href = `/bruto.html?id=${b.id}`;
      });
      container.appendChild(card);
    });

    if (brutos.length < 3) {
      const nuevoCard = document.createElement('div');
      nuevoCard.className = 'nuevo-bruto-card';
      nuevoCard.innerHTML = '➕<br>Nuevo Guerrero';
      nuevoCard.addEventListener('click', () => {
        window.location.href = '/crear-bruto.html';
      });
      container.appendChild(nuevoCard);
    }
  } catch (err) {
    if (err.message.includes('Token')) {
      logout();
    } else {
      document.getElementById('error-msg').textContent = err.message;
      document.getElementById('error-msg').style.display = 'block';
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadBrutos();
});
