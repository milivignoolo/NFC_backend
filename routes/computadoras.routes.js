const express = require('express');
const router = express.Router();
const db = require('../db');
const { ok, created, fail } = require('../utils/responses');
const { errorLog } = require('../utils/logger');

router.get('/', async (req, res, next) => {
  try {
    const computadoras = await db.obtenerComputadoras();
    return ok(res, computadoras);
  } catch (error) {
    errorLog('GET /api/computadoras', error);
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const compu = await db.registrarComputadora(req.body);
    return created(res, compu);
  } catch (error) {
    errorLog('POST /api/computadoras', error);
    next(error);
  }
});

router.put('/:id/estado', async (req, res, next) => {
  try {
    const result = await db.actualizarEstadoComputadora(req.params.id, req.body.estado);
    return ok(res, result, 'Estado de computadora actualizado');
  } catch (error) {
    errorLog('PUT /api/computadoras/:id/estado', error);
    next(error);
  }
});

module.exports = router;
