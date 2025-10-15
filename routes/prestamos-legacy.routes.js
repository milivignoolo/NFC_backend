const express = require('express');
const router = express.Router();
const db = require('../db');
const { ok, created, fail } = require('../utils/responses');
const { errorLog } = require('../utils/logger');

// Legacy alias endpoints to keep backward compatibility
router.get('/', async (req, res, next) => {
  try {
    const prestamos = await db.obtenerPrestamosComputadora();
    return ok(res, prestamos);
  } catch (error) {
    errorLog('GET /api/prestamos-computadora', error);
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const result = await db.registrarPrestamoComputadora(req.body);
    return created(res, result);
  } catch (error) {
    errorLog('POST /api/prestamos-computadora', error);
    next(error);
  }
});

router.put('/:id/finalizar', async (req, res, next) => {
  try {
    const result = await db.finalizarPrestamoComputadora(req.params.id, req.body.hora_fin);
    return ok(res, result, 'Préstamo finalizado');
  } catch (error) {
    errorLog('PUT /api/prestamos-computadora/:id/finalizar', error);
    next(error);
  }
});

module.exports = router;
