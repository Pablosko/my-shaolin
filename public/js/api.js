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
