function errorLog(route, error) {
  console.error(`[ERROR] ${route} → ${error.message}`);
}
function infoLog(message) {
  console.log(`[INFO] ${message}`);
}
module.exports = { errorLog, infoLog };
