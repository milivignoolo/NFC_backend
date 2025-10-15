const express = require('express');
const router = express.Router();
const db = require('../db');
const { ok, created, fail } = require('../utils/responses');
const { errorLog } = require('../utils/logger');

// Alias antiguos → nuevos
// /api/prestamos-computadora → /api/prestamos/computadoras
router.get('/computadoras', async (req, res, next) => {
  try {
    const prestamos = await db.obtenerPrestamosComputadora();
    return ok(res, prestamos);
  } catch (error) {
    errorLog('GET /api/prestamos/computadoras', error);
    next(error);
  }
});

router.post('/computadoras', async (req, res, next) => {
  try {
    const result = await db.registrarPrestamoComputadora(req.body);
    return created(res, result);
  } catch (error) {
    errorLog('POST /api/prestamos/computadoras', error);
    next(error);
  }
});

router.put('/computadoras/:id/finalizar', async (req, res, next) => {
  try {
    const result = await db.finalizarPrestamoComputadora(req.params.id, req.body.hora_fin);
    return ok(res, result, 'Préstamo finalizado');
  } catch (error) {
    errorLog('PUT /api/prestamos/computadoras/:id/finalizar', error);
    next(error);
  }
});

module.exports = router;
