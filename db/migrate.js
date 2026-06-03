async function runMigrations(client) {
  await client.execute(`CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, run_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);

  const result = await client.execute(`SELECT name FROM _migrations WHERE name = 'hp_formula_v2'`);
  if (result.rows.length === 0) {
    await client.execute(`UPDATE shaolins SET max_hp = max_hp + 2 * (level - 1), hp = hp + 2 * (level - 1) WHERE level > 1`);
    await client.execute(`DELETE FROM _migrations WHERE name = 'hp_formula_v2'`);
    await client.execute(`INSERT INTO _migrations (name) VALUES ('hp_formula_v2')`);
    console.log('Migration hp_formula_v2: +2 HP per level applied');
  }

  const armasResult = await client.execute(`SELECT name FROM _migrations WHERE name = 'armas_drop_stats'`);
  if (armasResult.rows.length === 0) {
    await client.execute(`CREATE TABLE IF NOT EXISTS armas_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shaolin_id INTEGER NOT NULL,
      nombre TEXT NOT NULL,
      nivel INTEGER DEFAULT 1,
      equipada INTEGER DEFAULT 0,
      FOREIGN KEY (shaolin_id) REFERENCES shaolins(id) ON DELETE CASCADE
    )`);
    await client.execute(`INSERT INTO armas_new (id, shaolin_id, nombre, nivel, equipada) SELECT id, shaolin_id, nombre, 1, equipada FROM armas`);
    await client.execute(`DROP TABLE armas`);
    await client.execute(`ALTER TABLE armas_new RENAME TO armas`);
    await client.execute(`DELETE FROM _migrations WHERE name = 'armas_drop_stats'`);
    await client.execute(`INSERT INTO _migrations (name) VALUES ('armas_drop_stats')`);
    console.log('Migration armas_drop_stats: dropped tipo/dano_min/dano_max, added nivel');
  }

  const vitalResult = await client.execute(`SELECT name FROM _migrations WHERE name = 'vitalidad_nerf_v3'`);
  if (vitalResult.rows.length === 0) {
    await client.execute(`UPDATE shaolins SET hp = hp - vitalidad * 2, max_hp = max_hp - vitalidad * 2 WHERE vitalidad > 0`);
    await client.execute(`UPDATE shaolins SET hp = 1 WHERE hp < 1`);
    await client.execute(`UPDATE shaolins SET max_hp = 1 WHERE max_hp < 1`);
    await client.execute(`DELETE FROM _migrations WHERE name = 'vitalidad_nerf_v3'`);
    await client.execute(`INSERT INTO _migrations (name) VALUES ('vitalidad_nerf_v3')`);
    console.log('Migration vitalidad_nerf_v3: vitalidad now gives +3 HP instead of +5');
  }
}

module.exports = { runMigrations };
