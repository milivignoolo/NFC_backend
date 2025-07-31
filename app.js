const express = require('express');
const cors = require('cors');
const path = require('path');
const NFCDatabase = require('./database');

const app = express();
const port = 3000;
const db = new NFCDatabase();

app.use(cors());
app.use(express.json());

// Servir archivos estáticos (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Ruta principal para servir la interfaz web
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Endpoint específico para Arduino
app.post('/api/nfc', async (req, res) => {
  const { uid } = req.body;
  if (!uid) {
    return res.status(400).json({ error: 'UID es requerido' });
  }

  try {
    // Usar el nuevo método que registra cada entrada individualmente
    const result = await db.insertEntry(uid);
    res.json(result);
  } catch (error) {
    console.error('Error al procesar tarjeta NFC:', error);
    res.status(500).json({ error: 'Error al procesar tarjeta NFC' });
  }
});

// Obtener todas las entradas individuales
app.get('/api/entries', async (req, res) => {
  try {
    const entries = await db.getAllEntries();
    res.json(entries);
  } catch (error) {
    console.error('Error al obtener entradas:', error);
    res.status(500).json({ error: 'Error al obtener entradas' });
  }
});

// Obtener entradas por UID
app.get('/api/entries/:uid', async (req, res) => {
  const { uid } = req.params;
  try {
    const entries = await db.getEntriesByUID(uid);
    res.json(entries);
  } catch (error) {
    console.error('Error al obtener entradas para el UID:', error);
    res.status(500).json({ error: 'Error al obtener entradas para el UID' });
  }
});

// Obtener todas las tarjetas
app.get('/api/cards', async (req, res) => {
  try {
    const cards = await db.getAllCards();
    res.json(cards);
  } catch (error) {
    console.error('Error al obtener tarjetas:', error);
    res.status(500).json({ error: 'Error al obtener tarjetas' });
  }
});

// Agregar o actualizar una tarjeta
app.post('/api/cards', async (req, res) => {
  const { uid } = req.body;
  if (!uid) {
    return res.status(400).json({ error: 'UID es requerido' });
  }

  try {
    const result = await db.insertEntry(uid);
    res.json(result);
  } catch (error) {
    console.error('Error al insertar o actualizar tarjeta:', error);
    res.status(500).json({ error: 'Error al insertar o actualizar tarjeta' });
  }
});

// Obtener estadísticas
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await db.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// Borrar una tarjeta
app.delete('/api/cards/:uid', async (req, res) => {
  const { uid } = req.params;

  try {
    const result = await db.deleteCard(uid);
    res.json(result);
  } catch (error) {
    console.error('Error al eliminar tarjeta:', error);
    res.status(500).json({ error: 'Error al eliminar tarjeta' });
  }
});

// Limpiar todas las tarjetas
app.delete('/api/cards', async (req, res) => {
  try {
    const result = await db.clearAllCards();
    res.json(result);
  } catch (error) {
    console.error('Error al limpiar tarjetas:', error);
    res.status(500).json({ error: 'Error al limpiar tarjetas' });
  }
});

app.listen(port, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${port}`);
  console.log(`📱 Interfaz web disponible en http://localhost:${port}`);
});

process.on('SIGINT', async () => {
  console.log('\n🔄 Cerrando servidor...');
  await db.close();
  process.exit(0);
});