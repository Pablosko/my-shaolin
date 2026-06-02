const express = require('express');
const cors = require('cors');
const path = require('path');

const { initDb } = require('./db/database');

async function start() {
  await initDb();
  console.log('Database initialized');

  const authRoutes = require('./routes/auth');
  const brutoRoutes = require('./routes/bruto');
  const combateRoutes = require('./routes/combate');
  const adminRoutes = require('./routes/admin');

  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(__dirname, 'public')));

  app.use('/api/auth', authRoutes);
  app.use('/api/brutos', brutoRoutes);
  app.use('/api/arena', combateRoutes);
  app.use('/api/admin', adminRoutes);

  app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
  });

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`El Bruto server running on port ${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
