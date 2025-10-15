const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// ==========================
// === ARCHIVOS ESTÁTICOS ===
// ==========================
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ---------------------------------
// Respuesta estándar helper
// ---------------------------------
function ok(res, data, message = 'Operación exitosa') {
  return res.status(200).json({ success: true, message, data });
}
function created(res, data, message = 'Creado con éxito') {
  return res.status(201).json({ success: true, message, data });
}
function fail(res, status, message) {
  return res.status(status).json({ success: false, message });
}

// Montaje de rutas modularizadas
app.use('/api/usuarios', require('./routes/usuarios.routes'));
app.use('/api/turnos', require('./routes/turnos.routes'));
app.use('/api/computadoras', require('./routes/computadoras.routes'));
app.use('/api/prestamos', require('./routes/prestamos.routes'));
app.use('/api/prestamos-computadora', require('./routes/prestamos-legacy.routes'));
app.use('/api/libros', require('./routes/libros.routes'));
app.use('/api/entradas/nfc', require('./routes/nfc.routes'));
app.use('/api/nfc', require('./routes/nfc.routes'));

// ==========================
// ==== SSE EVENTOS EN VIVO ==
// ==========================
let sseClients = [];

// Función para enviar mensajes a todos los clientes SSE
function broadcastSSE(data) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach(client => {
    try {
      client.res.write(message);
    } catch (error) {
      console.error('Error enviando SSE:', error);
      // Remover cliente si hay error
      sseClients = sseClients.filter(c => c.id !== client.id);
    }
  });
}

app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const clientId = Date.now();
  sseClients.push({ id: clientId, res });
  console.log(`👥 Cliente SSE conectado (${clientId})`);

  // Enviar mensaje de conexión
  res.write(`data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`);

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

// ---------------------------------
// Middleware de manejo de errores
// ---------------------------------
app.use((err, req, res, next) => {
  console.error('Error:', err);
  const status = err.status || 500;
  const message = err.message || 'Error interno';
  res.status(status).json({ success: false, message });
});

process.on('SIGINT', async () => {
  console.log('\n🔄 Cerrando servidor...');
  await db.close();
  process.exit(0);
});
