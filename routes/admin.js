const express = require('express');
const db = require('../db/database');
const router = express.Router();

const ADMIN_KEY = process.env.ADMIN_KEY || 'admin123';

function adminAuth(req, res, next) {
  const key = req.headers['x-admin-key'];
  if (!key || key !== ADMIN_KEY) {
    return res.status(403).json({ error: 'Clave admin inválida' });
  }
  next();
}

router.post('/login', (req, res) => {
  const { key } = req.body;
  if (key === ADMIN_KEY) {
    return res.json({ ok: true });
  }
  res.status(403).json({ error: 'Clave incorrecta' });
});

router.get('/users', adminAuth, (req, res) => {
  const users = db.query('SELECT id, username, email, created_at FROM users ORDER BY id');
  const result = users.map(u => {
    const brutos = db.query('SELECT id, name, level, genero FROM brutos WHERE user_id = ?', [u.id]);
    const comboatesCount = db.query(`
      SELECT COUNT(*) as total FROM combates c
      JOIN brutos b ON b.id IN (c.bruto1_id, c.bruto2_id)
      WHERE b.user_id = ?
    `, [u.id]);
    return { ...u, brutos, combates: comboatesCount[0]?.total || 0 };
  });
  res.json(result);
});

router.get('/brutos', adminAuth, (req, res) => {
  const brutos = db.query(`
    SELECT b.*, u.username FROM brutos b
    JOIN users u ON b.user_id = u.id
    ORDER BY b.id
  `);
  const result = brutos.map(b => {
    const combates = db.query(`
      SELECT COUNT(*) as total FROM combates WHERE bruto1_id = ? OR bruto2_id = ?
    `, [b.id, b.id]);
    return { ...b, combates: combates[0]?.total || 0 };
  });
  res.json(result);
});

router.delete('/users/:id', adminAuth, (req, res) => {
  const userId = parseInt(req.params.id);
  const user = db.get('SELECT id, username FROM users WHERE id = ?', [userId]);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  const brutos = db.query('SELECT id FROM brutos WHERE user_id = ?', [userId]);
  for (const b of brutos) {
    db.run('DELETE FROM armas WHERE bruto_id = ?', [b.id]);
    db.run('DELETE FROM habilidades WHERE bruto_id = ?', [b.id]);
    db.run('DELETE FROM mascotas WHERE bruto_id = ?', [b.id]);
    db.run('DELETE FROM combates WHERE bruto1_id = ? OR bruto2_id = ?', [b.id, b.id]);
    db.run('DELETE FROM alumnos WHERE maestro_id = ? OR alumno_id = ?', [b.id, b.id]);
  }
  db.run('DELETE FROM brutos WHERE user_id = ?', [userId]);
  db.run('DELETE FROM users WHERE id = ?', [userId]);

  res.json({ ok: true, deleted_user: user.username });
});

router.delete('/brutos/:id', adminAuth, (req, res) => {
  const brutoId = parseInt(req.params.id);
  const bruto = db.get('SELECT id, name FROM brutos WHERE id = ?', [brutoId]);
  if (!bruto) return res.status(404).json({ error: 'Bruto no encontrado' });

  db.run('DELETE FROM armas WHERE bruto_id = ?', [brutoId]);
  db.run('DELETE FROM habilidades WHERE bruto_id = ?', [brutoId]);
  db.run('DELETE FROM mascotas WHERE bruto_id = ?', [brutoId]);
  db.run('DELETE FROM combates WHERE bruto1_id = ? OR bruto2_id = ?', [brutoId, brutoId]);
  db.run('DELETE FROM alumnos WHERE maestro_id = ? OR alumno_id = ?', [brutoId, brutoId]);
  db.run('DELETE FROM brutos WHERE id = ?', [brutoId]);

  res.json({ ok: true, deleted_bruto: bruto.name });
});

router.get('/combates', adminAuth, (req, res) => {
  const combates = db.query(`
    SELECT c.*, b1.name as b1_name, b2.name as b2_name
    FROM combates c
    JOIN brutos b1 ON c.bruto1_id = b1.id
    JOIN brutos b2 ON c.bruto2_id = b2.id
    ORDER BY c.created_at DESC LIMIT 50
  `);
  res.json(combates);
});

module.exports = router;
