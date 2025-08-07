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

// ===== RUTAS PARA NFC/ARDUINO =====

// Endpoint específico para Arduino
app.post('/api/nfc', async (req, res) => {
  const { uid } = req.body;
  if (!uid) {
    return res.status(400).json({ error: 'UID es requerido' });
  }

  try {
    // Verificar si el estudiante existe
    const student = await db.getStudentByUID(uid);
    
    // Registrar la entrada
    const result = await db.insertEntry(uid);
    
    // Agregar información del estudiante si existe
    if (student) {
      result.student = {
        nombre: student.nombre,
        apellido: student.apellido,
        dni: student.dni,
        categoria: student.categoria,
        carrera: student.carrera
      };
      result.message = `Acceso registrado para ${student.nombre} ${student.apellido}`;
    } else {
      result.message = `Acceso registrado para UID no registrado: ${uid}`;
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error al procesar tarjeta NFC:', error);
    res.status(500).json({ error: 'Error al procesar tarjeta NFC' });
  }
});

// ===== RUTAS PARA ESTUDIANTES =====

// Obtener todos los estudiantes
app.get('/api/students', async (req, res) => {
  try {
    const students = await db.getAllStudents();
    res.json(students);
  } catch (error) {
    console.error('Error al obtener estudiantes:', error);
    res.status(500).json({ error: 'Error al obtener estudiantes' });
  }
});

// Registrar un nuevo estudiante
app.post('/api/students', async (req, res) => {
  try {
    // Validar campos requeridos
    const { uid, dni, nombre, apellido, categoria } = req.body;
    if (!uid || !dni || !nombre || !apellido || !categoria) {
      return res.status(400).json({ error: 'UID, DNI, nombre, apellido y categoría son campos requeridos' });
    }

    const student = await db.registerStudent(req.body);
    res.status(201).json(student);
  } catch (error) {
    console.error('Error al registrar estudiante:', error);
    if (error.message.includes('Ya existe')) {
      res.status(409).json({ error: error.message });
    } else if (error.message.includes('requeridos') || error.message.includes('Categoría no válida')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Error al registrar estudiante' });
    }
  }
});

// Obtener estudiante por UID
app.get('/api/students/uid/:uid', async (req, res) => {
  const { uid } = req.params;
  try {
    const student = await db.getStudentByUID(uid);
    if (student) {
      res.json(student);
    } else {
      res.status(404).json({ error: 'Estudiante no encontrado' });
    }
  } catch (error) {
    console.error('Error al obtener estudiante:', error);
    res.status(500).json({ error: 'Error al obtener estudiante' });
  }
});

// Obtener estudiante por DNI
app.get('/api/students/dni/:dni', async (req, res) => {
  const { dni } = req.params;
  try {
    const student = await db.getStudentByDni(dni);
    if (student) {
      res.json(student);
    } else {
      res.status(404).json({ error: 'Estudiante no encontrado' });
    }
  } catch (error) {
    console.error('Error al obtener estudiante:', error);
    res.status(500).json({ error: 'Error al obtener estudiante' });
  }
});

// Actualizar estudiante
app.put('/api/students/:uid', async (req, res) => {
  const { uid } = req.params;
  try {
    const result = await db.updateStudent(uid, req.body);
    if (result.changes > 0) {
      res.json({ message: 'Estudiante actualizado correctamente' });
    } else {
      res.status(404).json({ error: 'Estudiante no encontrado' });
    }
  } catch (error) {
    console.error('Error al actualizar estudiante:', error);
    res.status(500).json({ error: 'Error al actualizar estudiante' });
  }
});

// Eliminar estudiante
app.delete('/api/students/:uid', async (req, res) => {
  const { uid } = req.params;
  try {
    const result = await db.deleteStudent(uid);
    if (result.deletedRows > 0) {
      res.json({ message: 'Estudiante eliminado correctamente' });
    } else {
      res.status(404).json({ error: 'Estudiante no encontrado' });
    }
  } catch (error) {
    console.error('Error al eliminar estudiante:', error);
    res.status(500).json({ error: 'Error al eliminar estudiante' });
  }
});

// ===== RUTAS PARA ENTRADAS =====

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

// Obtener todas las entradas con información de estudiantes
app.get('/api/entries/with-students', async (req, res) => {
  try {
    const entries = await db.getAllEntriesWithStudents();
    res.json(entries);
  } catch (error) {
    console.error('Error al obtener entradas con estudiantes:', error);
    res.status(500).json({ error: 'Error al obtener entradas con estudiantes' });
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

// ===== RUTAS PARA TARJETAS (MANTENIDAS PARA COMPATIBILIDAD) =====

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