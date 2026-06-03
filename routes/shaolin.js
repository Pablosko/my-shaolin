const express = require('express');
const db = require('../db/database');
const { verificarToken } = require('../middleware/auth');
const { getRandomArma, getRandomHabilidad, generarStatsIniciales, generarOpcionesIniciales, generarRewardNivel, generarOpcionesRecompensa, generarStatsOpcionesNivel, aplicarSkillsYQi, getValorHabilidadPorNivel, resolverArma, calcularMaxHp, armas: armasData, habilidades: habilidadesData } = require('../game/data');

const router = express.Router();

router.get('/', verificarToken, async (req, res) => {
  const shaolins = await db.query('SELECT * FROM shaolins WHERE user_id = ?', [req.userId]);
  const result = await Promise.all(shaolins.map(async b => {
    const habilidades = await db.query('SELECT * FROM habilidades WHERE shaolin_id = ?', [b.id]);
    const armas = (await db.query('SELECT * FROM armas WHERE shaolin_id = ?', [b.id])).map(resolverArma);
    const qiData = aplicarSkillsYQi({ ...b, habilidades });
    return { ...b, armas, habilidades, ...qiData };
  }));
  res.json(result);
});

router.post('/opciones', verificarToken, (req, res) => {
  const opciones = generarOpcionesIniciales();
  res.json({ opciones });
});

router.get('/public/:name', async (req, res) => {
  const shaolin = await db.get('SELECT s.*, u.username FROM shaolins s JOIN users u ON s.user_id = u.id WHERE LOWER(s.name) = LOWER(?)', [req.params.name]);
  if (!shaolin) return res.status(404).json({ error: 'Shaolin no encontrado' });

  shaolin.armas = (await db.query('SELECT * FROM armas WHERE shaolin_id = ?', [shaolin.id])).map(resolverArma);
  shaolin.habilidades = await db.query('SELECT * FROM habilidades WHERE shaolin_id = ?', [shaolin.id]);

  const wins = await db.get('SELECT COUNT(*) as count FROM combates WHERE winner_id = ?', [shaolin.id]);
  const total = await db.get('SELECT COUNT(*) as count FROM combates WHERE shaolin1_id = ? OR shaolin2_id = ?', [shaolin.id, shaolin.id]);
  shaolin.wins = wins.count;
  shaolin.total_combates = total.count;

  const qiData = aplicarSkillsYQi(shaolin);
  Object.assign(shaolin, qiData);

  res.json(shaolin);
});

router.get('/ranking', async (req, res) => {
  const shaolins = await db.query(`
    SELECT s.*, u.username,
      (SELECT COUNT(*) FROM combates WHERE winner_id = s.id) as wins,
      (SELECT COUNT(*) FROM combates WHERE shaolin1_id = s.id OR shaolin2_id = s.id) as total
    FROM shaolins s
    JOIN users u ON s.user_id = u.id
    ORDER BY s.level DESC, wins DESC
    LIMIT 10
  `);

  const result = await Promise.all(shaolins.map(async b => {
    const qiData = aplicarSkillsYQi(b);
    return { ...b, ...qiData };
  }));

  res.json(result);
});

router.get('/search', async (req, res) => {
  const q = req.query.q || '';
  if (!q.trim()) return res.json([]);

  const shaolins = await db.query(
    'SELECT s.*, u.username FROM shaolins s JOIN users u ON s.user_id = u.id WHERE s.name LIKE ? LIMIT 10',
    [`%${q}%`]
  );
  res.json(shaolins);
});

router.get('/:id', verificarToken, async (req, res) => {
  const shaolin = await db.get('SELECT * FROM shaolins WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
  if (!shaolin) return res.status(404).json({ error: 'Shaolin no encontrado' });

  shaolin.armas = (await db.query('SELECT * FROM armas WHERE shaolin_id = ?', [shaolin.id])).map(resolverArma);
  shaolin.habilidades = await db.query('SELECT * FROM habilidades WHERE shaolin_id = ?', [shaolin.id]);

  const qiData = aplicarSkillsYQi(shaolin);
  Object.assign(shaolin, qiData);

  res.json(shaolin);
});

router.post('/', verificarToken, async (req, res) => {
  const { name, genero, indiceOpcion, opciones, eleccion, skin } = req.body;

  if (!name || !genero || (indiceOpcion === undefined && eleccion === undefined) || (indiceOpcion !== undefined && !opciones)) {
    return res.status(400).json({ error: 'Nombre, género y selección son requeridos' });
  }

  if (!['masculino', 'femenino'].includes(genero)) {
    return res.status(400).json({ error: 'Género inválido' });
  }

  const count = await db.get('SELECT COUNT(*) as count FROM shaolins WHERE user_id = ?', [req.userId]);
  if (count.count >= 3) {
    return res.status(400).json({ error: 'Máximo 3 shaolins por cuenta' });
  }

  const stats = generarStatsIniciales(genero);
  const skinFinal = skin && skin !== 'default' ? skin : 'default';

  const result = await db.run(
    'INSERT INTO shaolins (user_id, name, genero, skin, hp, max_hp, fuerza, agilidad, velocidad, vitalidad) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [req.userId, name, genero, skinFinal, stats.hp, stats.max_hp, stats.fuerza, stats.agilidad, stats.velocidad, stats.vitalidad || 0]
  );

  const shaolinId = result.lastInsertRowid;
  const item = {};

  if (indiceOpcion !== undefined && opciones) {
    const seleccionada = opciones[indiceOpcion];
    if (seleccionada.tipo === 'arma') {
      const arma = getRandomArma();
      await db.run('INSERT INTO armas (shaolin_id, nombre, nivel, equipada) VALUES (?, ?, ?, 1)',
        [shaolinId, arma.nombre, 1]);
      item.tipo = 'arma';
      item.nombre = arma.nombre;
    } else {
      const hab = getRandomHabilidad();
      await db.run('INSERT INTO habilidades (shaolin_id, nombre, descripcion, efecto, nivel) VALUES (?, ?, ?, ?, 1)',
        [shaolinId, hab.nombre, hab.descripcion, hab.efecto]);
      item.tipo = 'habilidad';
      item.nombre = hab.nombre;
      item.descripcion = hab.descripcion;
    }
  } else {
    if (eleccion === 0) {
      const arma = getRandomArma();
      await db.run('INSERT INTO armas (shaolin_id, nombre, nivel, equipada) VALUES (?, ?, ?, 1)',
        [shaolinId, arma.nombre, 1]);
      item.tipo = 'arma';
      item.nombre = arma.nombre;
    } else if (eleccion === 1) {
      const hab = getRandomHabilidad();
      await db.run('INSERT INTO habilidades (shaolin_id, nombre, descripcion, efecto, nivel) VALUES (?, ?, ?, ?, 1)',
        [shaolinId, hab.nombre, hab.descripcion, hab.efecto]);
      item.tipo = 'habilidad';
      item.nombre = hab.nombre;
      item.descripcion = hab.descripcion;
    } else {
      const hab = getRandomHabilidad();
      await db.run('INSERT INTO habilidades (shaolin_id, nombre, descripcion, efecto, nivel) VALUES (?, ?, ?, ?, 1)',
        [shaolinId, hab.nombre, hab.descripcion, hab.efecto]);
      item.tipo = 'habilidad';
      item.nombre = hab.nombre;
      item.descripcion = hab.descripcion;
    }
  }

  const shaolin = await db.get('SELECT * FROM shaolins WHERE id = ?', [shaolinId]);
  if (!shaolin) {
    return res.status(500).json({ error: 'Error al crear el shaolin' });
  }
  shaolin.item = item;
  res.json(shaolin);
});

router.post('/:id/equipar-arma', verificarToken, async (req, res) => {
  const { arma_id } = req.body;
  const shaolin = await db.get('SELECT * FROM shaolins WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
  if (!shaolin) return res.status(404).json({ error: 'Shaolin no encontrado' });

  await db.run('UPDATE armas SET equipada = 0 WHERE shaolin_id = ?', [shaolin.id]);
  await db.run('UPDATE armas SET equipada = 1 WHERE id = ? AND shaolin_id = ?', [arma_id, shaolin.id]);
  res.json({ ok: true });
});

router.post('/:id/level-up-start', verificarToken, async (req, res) => {
  const shaolin = await db.get('SELECT * FROM shaolins WHERE id = ? AND user_id = ? AND pending_level = 1', [req.params.id, req.userId]);
  if (!shaolin) return res.status(400).json({ error: 'No hay nivel pendiente' });

  const opciones = generarOpcionesRecompensa();
  const statOptions = generarStatsOpcionesNivel();

  res.json({ opciones, statOptions });
});

router.post('/:id/level-up-confirm', verificarToken, async (req, res) => {
  const { opcionElegida, statChoice } = req.body;
  const shaolin = await db.get('SELECT * FROM shaolins WHERE id = ? AND user_id = ? AND pending_level = 1', [req.params.id, req.userId]);
  if (!shaolin) return res.status(400).json({ error: 'No hay nivel pendiente' });

  const xpNeeded = 6 + shaolin.level * 2;

  if (opcionElegida && opcionElegida.tipo === 'arma' && opcionElegida.item) {
    await db.run('INSERT INTO armas (shaolin_id, nombre, nivel, equipada) VALUES (?, ?, ?, 0)',
      [shaolin.id, opcionElegida.item.nombre, 1]);
  } else if (opcionElegida && opcionElegida.tipo === 'habilidad' && opcionElegida.item) {
    const existente = await db.get('SELECT id, nivel FROM habilidades WHERE shaolin_id = ? AND nombre = ?', [shaolin.id, opcionElegida.item.nombre]);
    if (existente) {
      const nuevoNivel = Math.min(3, (existente.nivel || 1) + 1);
      await db.run('UPDATE habilidades SET nivel = ? WHERE id = ?', [nuevoNivel, existente.id]);
    } else {
      await db.run('INSERT INTO habilidades (shaolin_id, nombre, descripcion, efecto, nivel) VALUES (?, ?, ?, ?, 1)',
        [shaolin.id, opcionElegida.item.nombre, opcionElegida.item.descripcion, opcionElegida.item.efecto]);
    }
  } else if (opcionElegida && opcionElegida.tipo === 'stat') {
    if (opcionElegida.stat === 'vitalidad') {
      await db.run('UPDATE shaolins SET vitalidad = vitalidad + ? WHERE id = ?',
        [opcionElegida.valor, shaolin.id]);
    } else {
      await db.run(`UPDATE shaolins SET ${opcionElegida.stat} = ${opcionElegida.stat} + ? WHERE id = ?`, [opcionElegida.valor, shaolin.id]);
    }
  }

  if (statChoice) {
    if (statChoice.stat === 'vitalidad') {
      await db.run('UPDATE shaolins SET vitalidad = vitalidad + ? WHERE id = ?',
        [statChoice.valor, shaolin.id]);
    } else {
      await db.run(`UPDATE shaolins SET ${statChoice.stat} = ${statChoice.stat} + ? WHERE id = ?`, [statChoice.valor, shaolin.id]);
    }
  }

  const esPablosko = shaolin.name && shaolin.name.toLowerCase() === 'pablosko';
  let easterEgg = null;

  if (esPablosko) {
    await db.run(
      'UPDATE shaolins SET fuerza = 99, agilidad = 99, velocidad = 99, vitalidad = 50 WHERE id = ?',
      [shaolin.id]
    );

    const armasActuales = await db.query('SELECT nombre FROM armas WHERE shaolin_id = ?', [shaolin.id]);
    const nombresArmas = new Set(armasActuales.map(a => a.nombre));
    for (const arma of armasData) {
      if (!nombresArmas.has(arma.nombre)) {
        await db.run('INSERT INTO armas (shaolin_id, nombre, nivel, equipada) VALUES (?, ?, ?, 0)',
          [shaolin.id, arma.nombre, 1]);
      }
    }

    const habsActuales = await db.query('SELECT nombre FROM habilidades WHERE shaolin_id = ?', [shaolin.id]);
    const nombresHabs = new Set(habsActuales.map(h => h.nombre));
    for (const hab of habilidadesData) {
      if (nombresHabs.has(hab.nombre)) {
        await db.run('UPDATE habilidades SET nivel = 3 WHERE shaolin_id = ? AND nombre = ?', [shaolin.id, hab.nombre]);
      } else {
        await db.run('INSERT INTO habilidades (shaolin_id, nombre, descripcion, efecto, nivel) VALUES (?, ?, ?, ?, 3)',
          [shaolin.id, hab.nombre, hab.descripcion, hab.efecto]);
      }
    }

    easterEgg = '🐉 ¡EL MAESTRO PABLOSKO HA DESPERTADO! El templo entero se inclina ante ti. 🥋';
  }

  if (esPablosko) {
    await db.run('UPDATE shaolins SET level = 99, xp = 0, pending_level = 0 WHERE id = ?', [shaolin.id]);
  } else {
    const sobrante = shaolin.xp - xpNeeded;
    await db.run(
      'UPDATE shaolins SET level = level + 1, xp = ?, pending_level = 0 WHERE id = ?',
      [Math.max(0, sobrante), shaolin.id]
    );
  }

  const actualizado = await db.get('SELECT * FROM shaolins WHERE id = ?', [shaolin.id]);
  const nuevoMaxHp = calcularMaxHp(actualizado.vitalidad, actualizado.level);
  await db.run('UPDATE shaolins SET hp = ?, max_hp = ? WHERE id = ?', [nuevoMaxHp, nuevoMaxHp, shaolin.id]);

  const shaolinFinal = await db.get('SELECT * FROM shaolins WHERE id = ?', [shaolin.id]);
  shaolinFinal.armas = (await db.query('SELECT * FROM armas WHERE shaolin_id = ?', [shaolin.id])).map(resolverArma);
  shaolinFinal.habilidades = await db.query('SELECT * FROM habilidades WHERE shaolin_id = ?', [shaolin.id]);

  const qiData = aplicarSkillsYQi(shaolinFinal);
  Object.assign(shaolinFinal, qiData);

  shaolinFinal.easterEgg = easterEgg;

  res.json(shaolinFinal);
});

module.exports = router;
