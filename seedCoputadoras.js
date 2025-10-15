// seedComputadoras.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "biblioteca_nfc.db");
const db = new sqlite3.Database(dbPath);

const computadoras = [
  { marca: "Dell", modelo: "Inspiron 15", sistema_operativo: "Windows 10", observacion: null, uid_tarjeta: null },
  { marca: "HP", modelo: "Pavilion", sistema_operativo: "Windows 11", observacion: null, uid_tarjeta: null },
  { marca: "Lenovo", modelo: "ThinkPad X1", sistema_operativo: "Linux Ubuntu", observacion: null, uid_tarjeta: null },
];

db.serialize(() => {
  computadoras.forEach(c => {
    db.run(
      `INSERT OR IGNORE INTO computadora (marca, modelo, sistema_operativo, observacion, uid_tarjeta)
       VALUES (?, ?, ?, ?, ?)`,
      [c.marca, c.modelo, c.sistema_operativo, c.observacion, c.uid_tarjeta],
      (err) => {
        if (err) console.error("Error insertando computadora:", err.message);
        else console.log(`Computadora ${c.marca} ${c.modelo} insertada correctamente.`);
      }
    );
  });
});

db.close();
