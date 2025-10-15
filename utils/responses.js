function ok(res, data, message = 'Operación exitosa') {
  return res.status(200).json({ success: true, message, data });
}
function created(res, data, message = 'Creado con éxito') {
  return res.status(201).json({ success: true, message, data });
}
function fail(res, status, message) {
  return res.status(status).json({ success: false, message });
}
module.exports = { ok, created, fail };
