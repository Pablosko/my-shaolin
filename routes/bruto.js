const express = require('express');
const db = require('../db/database');
const { verificarToken } = require('../middleware/auth');
const { getRandomArma, getRandomHabilidad, getRandomMascota, generarStatsIniciales } = require('../game/data');

const router = express.Router();

router.get('/', verificarToken, (req, res) => {
  const brutos = db.query('SELECT * FROM brutos WHERE user_id = ?', [req.userId]);
  const result = brutos.map(b => ({
    ...b,
    armas: db.query('SELECT * FROM armas WHERE bruto_id = ?', [b.id]),
    habilidades: db.query('SELECT * FROM habilidades WHERE bruto_id = ?', [b.id]),
    mascotas: db.query('SELECT * FROM mascotas WHERE bruto_id = ?', [b.id]),
  }));
  res.json(result);
});

router.get('/:id', verificarToken, (req, res) => {
  const bruto = db.get('SELECT * FROM brutos WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
  if (!bruto) return res.status(404).json({ error: 'Bruto no encontrado' });

  bruto.armas = db.query('SELECT * FROM armas WHERE bruto_id = ?', [bruto.id]);
  bruto.habilidades = db.query('SELECT * FROM habilidades WHERE bruto_id = ?', [bruto.id]);
  bruto.mascotas = db.query('SELECT * FROM mascotas WHERE bruto_id = ?', [bruto.id]);
  res.json(bruto);
});

router.post('/', verificarToken, (req, res) => {
  const { name, genero, eleccion } = req.body;

  if (!name || !genero || eleccion === undefined) {
    return res.status(400).json({ error: 'Nombre, género y elección son requeridos' });
  }

  if (!['masculino', 'femenino'].includes(genero)) {
    return res.status(400).json({ error: 'Género inválido' });
  }

  if (eleccion < 0 || eleccion > 2) {
    return res.status(400).json({ error: 'Elección inválida (0: arma, 1: habilidad, 2: mascota)' });
  }

  const count = db.get('SELECT COUNT(*) as count FROM brutos WHERE user_id = ?', [req.userId]);
  if (count.count >= 3) {
    return res.status(400).json({ error: 'Máximo 3 brutos por cuenta' });
  }

  const stats = generarStatsIniciales();

  const result = db.run(
    'INSERT INTO brutos (user_id, name, genero, hp, max_hp, fuerza, agilidad, velocidad) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [req.userId, name, genero, stats.hp, stats.max_hp, stats.fuerza, stats.agilidad, stats.velocidad]
  );

  const brutoId = result.lastInsertRowid;
  const item = {};

  if (eleccion === 0) {
    const arma = getRandomArma();
    db.run('INSERT INTO armas (bruto_id, nombre, tipo, dano_min, dano_max, equipada) VALUES (?, ?, ?, ?, ?, 1)',
      [brutoId, arma.nombre, arma.tipo, arma.dano_min, arma.dano_max]);
    item.tipo = 'arma';
    item.nombre = arma.nombre;
  } else if (eleccion === 1) {
    const hab = getRandomHabilidad();
    db.run('INSERT INTO habilidades (bruto_id, nombre, descripcion, efecto) VALUES (?, ?, ?, ?)',
      [brutoId, hab.nombre, hab.descripcion, hab.efecto]);
    item.tipo = 'habilidad';
    item.nombre = hab.nombre;
    item.descripcion = hab.descripcion;
  } else {
    const mascota = getRandomMascota();
    db.run('INSERT INTO mascotas (bruto_id, nombre, tipo, hp, ataque) VALUES (?, ?, ?, ?, ?)',
      [brutoId, mascota.nombre, mascota.tipo, mascota.hp, mascota.ataque]);
    item.tipo = 'mascota';
    item.nombre = mascota.nombre;
  }

  const bruto = db.get('SELECT * FROM brutos WHERE id = ?', [brutoId]);
  bruto.item = item;
  res.json(bruto);
});

router.post('/:id/equipar-arma', verificarToken, (req, res) => {
  const { arma_id } = req.body;
  const bruto = db.get('SELECT * FROM brutos WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
  if (!bruto) return res.status(404).json({ error: 'Bruto no encontrado' });

  db.run('UPDATE armas SET equipada = 0 WHERE bruto_id = ?', [bruto.id]);
  db.run('UPDATE armas SET equipada = 1 WHERE id = ? AND bruto_id = ?', [arma_id, bruto.id]);
  res.json({ ok: true });
});

module.exports = router;
