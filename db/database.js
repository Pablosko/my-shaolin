const { createClient } = require('@libsql/client');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

let client = null;

async function initDb() {
  client = createClient({
    url: process.env.TURSO_DB_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await client.executeMultiple(schema);

  return client;
}

function getClient() {
  if (!client) throw new Error('Database not initialized');
  return client;
}

async function query(sql, params = []) {
  const result = await getClient().execute({ sql, args: params });
  return result.rows.map(row =>
    Object.fromEntries(result.columns.map((col, i) => [col, row[i]]))
  );
}

async function get(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0];
}

async function run(sql, params = []) {
  const result = await getClient().execute({ sql, args: params });
  return {
    changes: result.rowsAffected,
    lastInsertRowid: result.lastInsertRowid ? Number(result.lastInsertRowid) : null,
  };
}

async function exec(sql) {
  await getClient().execute(sql);
}

module.exports = { initDb, getClient, query, get, run, exec };
