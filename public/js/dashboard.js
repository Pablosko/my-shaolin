async function loadShaolins() {
  try {
    const shaolins = await API.get('/shaolins');
    const container = document.getElementById('shaolins-container');
    const username = localStorage.getItem('username');

    document.getElementById('user-name').textContent = username;

    container.innerHTML = '';

    shaolins.forEach(b => {
      const color = getColor(b.genero);

      const card = document.createElement('div');
      card.className = 'shaolin-card';
      card.innerHTML = `
        <div class="shaolin-avatar" style="background: ${color}20; border: 2px solid ${color}">
        </div>
        <div class="shaolin-name">${b.name}</div>
        <div class="shaolin-level">Nivel ${b.level} · ${b.genero === 'femenino' ? '♀' : '♂'}</div>
        <div class="shaolin-stats">
          <span>❤️ HP <b>${b.hp}/${b.real_max_hp || b.max_hp}</b></span>
          <span>💪 Fuerza <b>${b.real_fuerza || b.fuerza}</b></span>
          <span>🏃 Agilidad <b>${b.real_agilidad || b.agilidad}</b></span>
          <span>⚡ Velocidad <b>${b.real_velocidad || b.velocidad}</b></span>
        </div>
      `;
      card.querySelector('.shaolin-avatar').appendChild(crearAvatarImg(b.genero, b.skin));
      card.addEventListener('click', () => {
        window.location.href = `/shaolin.html?id=${b.id}`;
      });
      container.appendChild(card);
    });

    if (shaolins.length < 3) {
      const nuevoCard = document.createElement('div');
      nuevoCard.className = 'nuevo-shaolin-card';
      nuevoCard.innerHTML = '➕<br>Nuevo Guerrero';
      nuevoCard.addEventListener('click', () => {
        window.location.href = '/crear-shaolin.html';
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
  loadShaolins();
});
