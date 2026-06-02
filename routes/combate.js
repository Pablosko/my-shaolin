const express = require('express');
const db = require('../db/database');
const { verificarToken } = require('../middleware/auth');
const { simularCombate } = require('../game/engine');

const router = express.Router();

router.get('/oponentes', verificarToken, (req, res) => {
  const brutos = db.query('SELECT * FROM brutos WHERE user_id != ?', [req.userId]);

  const result = brutos.map(b => {
    const armas = db.query('SELECT * FROM armas WHERE bruto_id = ?', [b.id]);
    const habilidades = db.query('SELECT * FROM habilidades WHERE bruto_id = ?', [b.id]);
    const mascotas = db.query('SELECT * FROM mascotas WHERE bruto_id = ?', [b.id]);
    const user = db.get('SELECT username FROM users WHERE id = ?', [b.user_id]);
    return {
      ...b,
      username: user ? user.username : 'Desconocido',
      armas,
      habilidades,
      mascotas,
    };
  });

  res.json(result);
});

router.get('/historial/:bruto_id', verificarToken, (req, res) => {
  const { bruto_id } = req.params;
  const combates = db.query(`
    SELECT c.*, b1.name as b1_name, b2.name as b2_name
    FROM combates c
    JOIN brutos b1 ON c.bruto1_id = b1.id
    JOIN brutos b2 ON c.bruto2_id = b2.id
    WHERE c.bruto1_id = ? OR c.bruto2_id = ?
    ORDER BY c.created_at DESC
    LIMIT 20
  `, [parseInt(bruto_id), parseInt(bruto_id)]);

  res.json(combates);
});

router.post('/combatir/:oponente_id', verificarToken, (req, res) => {
  const { bruto_id } = req.body;
  const oponente_id = parseInt(req.params.oponente_id);

  if (!bruto_id) {
    return res.status(400).json({ error: 'Selecciona un bruto para combatir' });
  }

  const miBruto = db.get('SELECT * FROM brutos WHERE id = ? AND user_id = ?', [bruto_id, req.userId]);
  if (!miBruto) {
    return res.status(404).json({ error: 'Bruto no encontrado' });
  }

  const oponente = db.get('SELECT * FROM brutos WHERE id = ?', [oponente_id]);
  if (!oponente) {
    return res.status(404).json({ error: 'Oponente no encontrado' });
  }

  if (miBruto.user_id === oponente.user_id) {
    return res.status(400).json({ error: 'No puedes combatir contra tu propio bruto' });
  }

  const hoy = new Date().toISOString().split('T')[0];

  if (miBruto.ultimo_combate === hoy && miBruto.combates_hoy >= 3) {
    return res.status(400).json({ error: 'Límite de 3 combates diarios alcanzado' });
  }

  const b1Completo = {
    ...miBruto,
    armas: db.query('SELECT * FROM armas WHERE bruto_id = ?', [miBruto.id]),
    habilidades: db.query('SELECT * FROM habilidades WHERE bruto_id = ?', [miBruto.id]),
    mascota: db.query('SELECT * FROM mascotas WHERE bruto_id = ?', [miBruto.id])[0] || null,
  };

  const b2Completo = {
    ...oponente,
    armas: db.query('SELECT * FROM armas WHERE bruto_id = ?', [oponente.id]),
    habilidades: db.query('SELECT * FROM habilidades WHERE bruto_id = ?', [oponente.id]),
    mascota: db.query('SELECT * FROM mascotas WHERE bruto_id = ?', [oponente.id])[0] || null,
  };

  const resultado = simularCombate(b1Completo, b2Completo);

  db.run(
    'INSERT INTO combates (bruto1_id, bruto2_id, winner_id, log) VALUES (?, ?, ?, ?)',
    [miBruto.id, oponente.id, resultado.winner_id, resultado.log]
  );

  if (resultado.winner_id === miBruto.id) {
    const newXp = miBruto.xp + 2;
    db.run('UPDATE brutos SET xp = ?, combates_hoy = combates_hoy + 1, ultimo_combate = ? WHERE id = ?',
      [newXp, hoy, miBruto.id]);
  } else {
    const newXp = miBruto.xp + 1;
    db.run('UPDATE brutos SET xp = ?, combates_hoy = combates_hoy + 1, ultimo_combate = ? WHERE id = ?',
      [newXp, hoy, miBruto.id]);
  }

  let miBrutoActualizado = db.get('SELECT * FROM brutos WHERE id = ?', [miBruto.id]);
  const xpParaSubir = miBrutoActualizado.level * 10 + 10;

  let subioNivel = false;
  if (miBrutoActualizado.xp >= xpParaSubir) {
    const sobrante = miBrutoActualizado.xp - xpParaSubir;
    const boostHp = Math.floor(Math.random() * 5) + 3;
    db.run(
      'UPDATE brutos SET level = level + 1, xp = ?, max_hp = max_hp + ?, hp = max_hp, fuerza = fuerza + 1, agilidad = agilidad + 1, velocidad = velocidad + 1 WHERE id = ?',
      [sobrante, boostHp, miBruto.id]
    );
    subioNivel = true;
  }

  const brutoFinal = db.get('SELECT * FROM brutos WHERE id = ?', [miBruto.id]);

  res.json({
    resultado: resultado.winner_id === miBruto.id ? 'victoria' : 'derrota',
    winner_id: resultado.winner_id,
    log: JSON.parse(resultado.log),
    bruto_actualizado: brutoFinal,
    subio_nivel: subioNivel,
  });
});

module.exports = router;
