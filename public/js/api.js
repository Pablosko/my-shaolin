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
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (_) {
      throw new Error(`Respuesta inesperada del servidor (${res.status}): formato inválido`);
    }
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
  '#22c55e', '#eab308', '#f97316', '#ef4444',
  '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d', '#450a0a', '#1a0000',
];

function colorBar(value, maxSegs = 10) {
  const fullTiers = Math.floor(value / 10);
  const remainder = value % 10;
  const colors = [];
  for (let i = 0; i < maxSegs; i++) {
    const layers = fullTiers + (i < remainder ? 1 : 0);
    if (layers === 0) {
      colors.push('#2a1a3ab3');
    } else {
      colors.push(SEG_COLORS[Math.min(layers - 1, SEG_COLORS.length - 1)]);
    }
  }
  return colors;
}
