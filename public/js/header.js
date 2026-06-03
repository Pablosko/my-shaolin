class AppHeader {
  static init() {
    const container = document.getElementById('app-header');
    if (!container) return;

    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const lastShaolin = JSON.parse(localStorage.getItem('lastShaolin') || 'null');

    let qaHtml = '';
    if (lastShaolin) {
      const skinUrl = getSkinUrl(lastShaolin.genero, lastShaolin.skin);
      qaHtml = `<a href="/shaolin.html?id=${lastShaolin.id}" class="header-qa" title="${lastShaolin.name} - Ir al perfil">
        <img src="${skinUrl}" class="qa-avatar" onerror="this.outerHTML='<span class=qa-avatar style=display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;background:var(--barra-fondo);font-size:16px>&#x1f94b;</span>'">
        <span class="qa-name">${lastShaolin.name}</span>
      </a>
      <a href="/arena.html?shaolin_id=${lastShaolin.id}" class="header-nav-btn header-arena-qa" title="Ir a la arena con ${lastShaolin.name}">⚔️</a>`;
    }

    container.innerHTML = `
      <div class="header-left">
        <a href="/dashboard.html" class="header-logo">🥋 My Shaolin</a>
        ${token && username ? `<span class="header-username">👤 ${escapeHtml(username)}</span>` : ''}
        <div class="header-rankings-wrap">
          <button class="header-rankings-btn" id="rankings-btn">🏆 Ranking</button>
          <div class="rankings-dropdown" id="rankings-dropdown">
            <h4>🏆 Top 10 Guerreros</h4>
            <div id="rankings-list"></div>
          </div>
        </div>
      </div>
      <div class="header-right">
        <div class="search-bar-container">
          <input type="text" id="header-search" placeholder="Buscar guerrero..." autocomplete="off">
          <div class="search-results" id="search-results"></div>
        </div>
        ${qaHtml}
        ${token ? `<a href="/dashboard.html" class="header-nav-btn">📋 Mis guerreros</a>` : ''}
        ${token ? `<button class="header-logout-btn" id="header-logout" title="Salir">🚪</button>` : `<a href="/" class="header-nav-btn">Iniciar sesión</a>`}
      </div>
    `;

    this.setupSearch();
    this.setupRankings();
    this.setupLogout();
  }

  static setupSearch() {
    const input = document.getElementById('header-search');
    const results = document.getElementById('search-results');
    if (!input) return;

    let timer = null;
    input.addEventListener('input', () => {
      clearTimeout(timer);
      const q = input.value.trim();
      if (!q) { results.classList.remove('visible'); results.innerHTML = ''; return; }
      timer = setTimeout(async () => {
        try {
          const data = await (await fetch(`/api/shaolins/search?q=${encodeURIComponent(q)}`)).json();
          if (!Array.isArray(data) || data.length === 0) {
            results.innerHTML = '<div class="search-result-item" style="color:#8b6fa0;justify-content:center">Sin resultados</div>';
            results.classList.add('visible');
            return;
          }
          results.innerHTML = data.map(s => {
            const skinUrl = getSkinUrl(s.genero, s.skin);
            return `<div class="search-result-item" data-name="${s.name}">
              <img src="${skinUrl}" class="sr-avatar" onerror="this.outerHTML='<span style=font-size:20px>&#x1f94b;</span>'">
              <span class="sr-name">${s.name}</span>
              <span class="sr-meta">Nv.${s.level} · ${s.username}</span>
            </div>`;
          }).join('');
          results.classList.add('visible');
          results.querySelectorAll('.search-result-item').forEach(el => {
            el.addEventListener('click', () => {
              input.value = '';
              results.classList.remove('visible');
              window.location.href = `/base/${encodeURIComponent(el.dataset.name)}`;
            });
          });
        } catch (_) {}
      }, 300);
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-bar-container')) {
        results.classList.remove('visible');
      }
    });
  }

  static setupRankings() {
    const btn = document.getElementById('rankings-btn');
    const dropdown = document.getElementById('rankings-dropdown');
    if (!btn) return;

    let loaded = false;
    btn.addEventListener('click', async () => {
      dropdown.classList.toggle('visible');
      if (!loaded) {
        const list = document.getElementById('rankings-list');
        try {
          const data = await (await fetch('/api/shaolins/ranking')).json();
          if (Array.isArray(data)) {
            list.innerHTML = data.map((s, i) => {
              const wr = s.total > 0 ? Math.round((s.wins / s.total) * 100) : 0;
              const medallas = ['🥇','🥈','🥉'];
              const pos = medallas[i] || `#${i+1}`;
              return `<div class="rankings-item" data-name="${s.name}">
                <span class="r-pos">${pos}</span>
                <span class="r-name">${s.name}</span>
                <span class="r-level">Nv.${s.level}</span>
                <span class="r-wr">${wr}%</span>
              </div>`;
            }).join('');
            list.querySelectorAll('.rankings-item').forEach(el => {
              el.addEventListener('click', () => {
                dropdown.classList.remove('visible');
                window.location.href = `/base/${encodeURIComponent(el.dataset.name)}`;
              });
            });
          }
        } catch (_) {
          list.innerHTML = '<div style="color:#8b6fa0;text-align:center;padding:8px">Error al cargar</div>';
        }
        loaded = true;
      }
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.header-rankings-wrap')) {
        dropdown.classList.remove('visible');
      }
    });
  }

  static setupLogout() {
    const btn = document.getElementById('header-logout');
    if (btn) {
      btn.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
        localStorage.removeItem('lastShaolin');
        window.location.href = '/';
      });
    }
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', () => AppHeader.init());
