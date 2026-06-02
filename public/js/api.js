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
