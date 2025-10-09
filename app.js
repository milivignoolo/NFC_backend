const express = require('express');
const cors = require('cors');
const path = require('path');
const NFCDatabase = require('./database');

const app = express();
const port = 3000;
const db = new NFCDatabase();

app.use(cors());
app.use(express.json());

// ==========================
// === ARCHIVOS ESTÁTICOS ===
// ==========================
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==========================
// ==== RUTAS DE USUARIO ====
// ==========================
app.get('/api/usuarios', async (req, res) => {
  try {
    const usuarios = await db.obtenerUsuarios();
    res.json(usuarios);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

app.post('/api/usuarios', async (req, res) => {
  try {
    const data = req.body;
    if (!data.id_usuario || !data.tipo_usuario || !data.nombre_completo) {
      return res.status(400).json({ error: 'Campos obligatorios faltantes' });
    }

    const usuario = await db.registrarUsuario(data);
    res.status(201).json(usuario);
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/usuarios/uid/:uid', async (req, res) => {
  try {
    const usuario = await db.obtenerUsuarioPorUID(req.params.uid);
    if (usuario) res.json(usuario);
    else res.status(404).json({ error: 'Usuario no encontrado' });
  } catch (error) {
    console.error('Error al obtener usuario por UID:', error);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
});

app.delete('/api/usuarios/:id', async (req, res) => {
  try {
    const result = await db.eliminarUsuario(req.params.id);
    if (result.deletedRows > 0) res.json({ message: 'Usuario eliminado correctamente' });
    else res.status(404).json({ error: 'Usuario no encontrado' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

// ==========================
// ==== RUTAS DE TURNOS =====
// ==========================
app.post('/api/turnos', async (req, res) => {
  try {
    const result = await db.registrarTurno(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error al registrar turno:', error);
    res.status(500).json({ error: 'Error al registrar turno' });
  }
});

app.get('/api/turnos', async (req, res) => {
  try {
    const turnos = await db.obtenerTurnos();
    res.json(turnos);
  } catch (error) {
    console.error('Error al obtener turnos:', error);
    res.status(500).json({ error: 'Error al obtener turnos' });
  }
});

// ==========================
// === RUTAS COMPUTADORAS ===
// ==========================
app.get('/api/computadoras', async (req, res) => {
  try {
    const computadoras = await db.obtenerComputadoras();
    res.json(computadoras);
  } catch (error) {
    console.error('Error al obtener computadoras:', error);
    res.status(500).json({ error: 'Error al obtener computadoras' });
  }
});

app.post('/api/computadoras', async (req, res) => {
  try {
    const compu = await db.registrarComputadora(req.body);
    res.status(201).json(compu);
  } catch (error) {
    console.error('Error al registrar computadora:', error);
    res.status(500).json({ error: 'Error al registrar computadora' });
  }
});

app.put('/api/computadoras/:id/estado', async (req, res) => {
  try {
    const result = await db.actualizarEstadoComputadora(req.params.id, req.body.estado);
    res.json(result);
  } catch (error) {
    console.error('Error al actualizar estado de computadora:', error);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
});

// =====================================
// === RUTAS PRÉSTAMOS DE COMPUTADORAS =
// =====================================
app.get('/api/prestamos-computadora', async (req, res) => {
  try {
    const prestamos = await db.obtenerPrestamosComputadora();
    res.json(prestamos);
  } catch (error) {
    console.error('Error al obtener préstamos de computadora:', error);
    res.status(500).json({ error: 'Error al obtener préstamos' });
  }
});

app.post('/api/prestamos-computadora', async (req, res) => {
  try {
    const result = await db.registrarPrestamoComputadora(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error al registrar préstamo de computadora:', error);
    res.status(500).json({ error: 'Error al registrar préstamo' });
  }
});

app.put('/api/prestamos-computadora/:id/finalizar', async (req, res) => {
  try {
    const result = await db.finalizarPrestamoComputadora(req.params.id, req.body.hora_fin);
    res.json(result);
  } catch (error) {
    console.error('Error al finalizar préstamo de computadora:', error);
    res.status(500).json({ error: 'Error al finalizar préstamo' });
  }
});

// ==========================
// ==== SSE EVENTOS EN VIVO ==
// ==========================
let sseClients = [];

app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const clientId = Date.now();
  sseClients.push({ id: clientId, res });
  console.log(`👥 Cliente SSE conectado (${clientId})`);

  req.on('close', () => {
    sseClients = sseClients.filter(c => c.id !== clientId);
    console.log(`❌ Cliente SSE desconectado (${clientId})`);
  });
});

// ==========================
// ==== INICIO DEL SERVIDOR ==
// ==========================
app.listen(port, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${port}`);
});

process.on('SIGINT', async () => {
  console.log('\n🔄 Cerrando servidor...');
  await db.close();
  process.exit(0);
});
