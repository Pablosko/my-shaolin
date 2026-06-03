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

router.get('/users', adminAuth, async (req, res) => {
  const users = await db.query('SELECT id, username, email, created_at FROM users ORDER BY id');
  const result = await Promise.all(users.map(async u => {
    const shaolins = await db.query('SELECT id, name, level, genero FROM shaolins WHERE user_id = ?', [u.id]);
    const combatesCount = await db.query(`
      SELECT COUNT(*) as total FROM combates c
      JOIN shaolins b ON b.id IN (c.shaolin1_id, c.shaolin2_id)
      WHERE b.user_id = ?
    `, [u.id]);
    return { ...u, shaolins, combates: combatesCount[0]?.total || 0 };
  }));
  res.json(result);
});

router.get('/shaolins', adminAuth, async (req, res) => {
  const shaolins = await db.query(`
    SELECT b.*, u.username FROM shaolins b
    JOIN users u ON b.user_id = u.id
    ORDER BY b.id
  `);
  const result = await Promise.all(shaolins.map(async b => {
    const combates = await db.query(`
      SELECT COUNT(*) as total FROM combates WHERE shaolin1_id = ? OR shaolin2_id = ?
    `, [b.id, b.id]);
    return { ...b, combates: combates[0]?.total || 0 };
  }));
  res.json(result);
});

router.post('/reset-stats', adminAuth, async (req, res) => {
  const jugadores = await db.query('SELECT id, genero FROM shaolins WHERE user_id > 0');
  let reseteados = 0;

  for (const b of jugadores) {
    const def = b.genero === 'masculino'
      ? { hp: 55, max_hp: 55, fuerza: 3, agilidad: 2, velocidad: 2 }
      : { hp: 50, max_hp: 50, fuerza: 2, agilidad: 3, velocidad: 3 };

    await db.run(
      'UPDATE shaolins SET hp = ?, max_hp = ?, fuerza = ?, agilidad = ?, velocidad = ?, vitalidad = 0, level = 1, xp = 0, pending_level = 0 WHERE id = ?',
      [def.hp, def.max_hp, def.fuerza, def.agilidad, def.velocidad, b.id]
    );
    reseteados++;
  }

  res.json({ ok: true, reseteados });
});

router.delete('/users/:id', adminAuth, async (req, res) => {
  const userId = parseInt(req.params.id);
  const user = await db.get('SELECT id, username FROM users WHERE id = ?', [userId]);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  const shaolins = await db.query('SELECT id FROM shaolins WHERE user_id = ?', [userId]);
  for (const b of shaolins) {
    await db.run('DELETE FROM armas WHERE shaolin_id = ?', [b.id]);
    await db.run('DELETE FROM habilidades WHERE shaolin_id = ?', [b.id]);
    await db.run('DELETE FROM combates WHERE shaolin1_id = ? OR shaolin2_id = ?', [b.id, b.id]);
  }
  await db.run('DELETE FROM shaolins WHERE user_id = ?', [userId]);
  await db.run('DELETE FROM users WHERE id = ?', [userId]);

  res.json({ ok: true, deleted_user: user.username });
});

router.delete('/shaolins/:id', adminAuth, async (req, res) => {
  const shaolinId = parseInt(req.params.id);
  const shaolin = await db.get('SELECT id, name FROM shaolins WHERE id = ?', [shaolinId]);
  if (!shaolin) return res.status(404).json({ error: 'Shaolin no encontrado' });

  await db.run('DELETE FROM armas WHERE shaolin_id = ?', [shaolinId]);
  await db.run('DELETE FROM habilidades WHERE shaolin_id = ?', [shaolinId]);
  await db.run('DELETE FROM combates WHERE shaolin1_id = ? OR shaolin2_id = ?', [shaolinId, shaolinId]);
  await db.run('DELETE FROM shaolins WHERE id = ?', [shaolinId]);

  res.json({ ok: true, deleted_shaolin: shaolin.name });
});

router.get('/combates', adminAuth, async (req, res) => {
  const combates = await db.query(`
    SELECT c.*, b1.name as b1_name, b2.name as b2_name
    FROM combates c
    JOIN shaolins b1 ON c.shaolin1_id = b1.id
    JOIN shaolins b2 ON c.shaolin2_id = b2.id
    ORDER BY c.created_at DESC LIMIT 50
  `);
  res.json(combates);
});

module.exports = router;
