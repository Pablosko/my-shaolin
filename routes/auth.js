const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db/database');
const { generarToken } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  if (password.length < 4) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 4 caracteres' });
  }

  const existing = await db.get('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
  if (existing) {
    return res.status(409).json({ error: 'El usuario o email ya existe' });
  }

  const password_hash = bcrypt.hashSync(password, 10);
  const result = await db.run('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)', [username, email, password_hash]);

  const token = generarToken(result.lastInsertRowid);
  res.json({ token, userId: result.lastInsertRowid, username });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  }

  const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  }

  const token = generarToken(user.id);
  res.json({ token, userId: user.id, username: user.username });
});

module.exports = router;
