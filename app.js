const express = require('express');
const cors = require('cors');
const NFCDatabase = require('./database');

const app = express();
const port = 3000;
const db = new NFCDatabase();

app.use(cors());
app.use(express.json());

// Obtener todas las tarjetas
app.get('/cards', async (req, res) => {
  try {
    const cards = await db.getAllCards();
    res.json(cards);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener tarjetas' });
  }
});

// Agregar o actualizar una tarjeta
app.post('/cards', async (req, res) => {
  const { uid } = req.body;
  if (!uid) {
    return res.status(400).json({ error: 'UID es requerido' });
  }

  try {
    const result = await db.insertOrUpdateUID(uid);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Error al insertar o actualizar tarjeta' });
  }
});

// Obtener estadísticas
app.get('/stats', async (req, res) => {
  try {
    const stats = await db.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// Borrar una tarjeta
app.delete('/cards/:uid', async (req, res) => {
  const { uid } = req.params;

  try {
    const result = await db.deleteCard(uid);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar tarjeta' });
  }
});

// Limpiar todas las tarjetas
app.delete('/cards', async (req, res) => {
  try {
    const result = await db.clearAllCards();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Error al limpiar tarjetas' });
  }
});

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});

process.on('SIGINT', async () => {
  await db.close();
  process.exit(0);
});

