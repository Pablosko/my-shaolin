require('express-async-errors');
const express = require('express');
const cors = require('cors');
const path = require('path');

const { initDb, getClient } = require('./db/database');
const { runMigrations } = require('./db/migrate');

async function start() {
  await initDb();
  await runMigrations(getClient());
  console.log('Database initialized');

  const authRoutes = require('./routes/auth');
  const shaolinRoutes = require('./routes/shaolin');
  const combateRoutes = require('./routes/combate');
  const adminRoutes = require('./routes/admin');

  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(__dirname, 'public')));

  app.use('/api/auth', authRoutes);
  app.use('/api/shaolins', shaolinRoutes);
  app.use('/api/arena', combateRoutes);
  app.use('/api/admin', adminRoutes);

  app.use('/api', (err, req, res, next) => {
    console.error('API Error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  });

  app.get('/base/:name', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'base.html'));
  });

  app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
  });

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`My Shaolin server running on port ${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
