const API = {
  baseUrl: '/api',

  getToken() {
    return localStorage.getItem('token');
  },

  async request(method, path, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = { method, headers };
    if (body) {
      config.body = JSON.stringify(body);
    }

    const res = await fetch(this.baseUrl + path, config);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Error en la solicitud');
    }

    return data;
  },

  get(path) {
    return this.request('GET', path);
  },

  post(path, body) {
    return this.request('POST', path, body);
  },
};

function getSkinUrl(genero, skin) {
  const s = skin && skin !== 'default' && skin !== 'null' && skin !== 'undefined' ? skin : 'default';
  return `/images/skins/${s}-${genero}.png`;
}

function getColor(genero) {
  return genero === 'femenino' ? '#e879f9' : '#60a5fa';
}

function crearAvatarImg(genero, skin) {
  const img = document.createElement('img');
  img.src = getSkinUrl(genero, skin);
  img.alt = genero === 'femenino' ? 'Femenino' : 'Masculino';
  img.onerror = function() {
    this.onerror = null;
    this.style.display = 'none';
    this.parentElement.innerHTML = genero === 'femenino' ? '👩' : '👨';
  };
  return img;
}

function formatStatDiff(base, real) {
  if (base === real) return `${base}`;
  const diff = real - base;
  const cls = diff > 0 ? 'stat-bonus' : 'stat-penalty';
  const signo = diff > 0 ? '+' : '';
  return `${real} <span class="${cls}">(${base} ${signo}${diff})</span>`;
}

const SEG_COLORS = [
  '#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444',
  '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d', '#450a0a',
];

function colorForValue(val) {
  if (val <= 10) return SEG_COLORS[0];
  if (val <= 20) return SEG_COLORS[1];
  if (val <= 30) return SEG_COLORS[2];
  if (val <= 40) return SEG_COLORS[3];
  if (val <= 50) return SEG_COLORS[4];
  if (val <= 60) return SEG_COLORS[5];
  if (val <= 70) return SEG_COLORS[6];
  if (val <= 80) return SEG_COLORS[7];
  if (val <= 90) return SEG_COLORS[8];
  return SEG_COLORS[9];
}
