// seedComputadoras.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "biblioteca_nfc.db");
const db = new sqlite3.Database(dbPath);

const computadoras = [
  { marca: "HP", modelo: "ProBook 450 G7", sistema_operativo: "Windows 10 Pro", observacion: "Uso docente", uid_tarjeta: 1 },
  { marca: "Dell", modelo: "Latitude 3410", sistema_operativo: "Windows 11", observacion: "Equipo para alumnos", uid_tarjeta: 2 },
  { marca: "Lenovo", modelo: "ThinkPad L390", sistema_operativo: "Linux Ubuntu 22.04", observacion: "Equipo del laboratorio de redes", uid_tarjeta: 3 },
  { marca: "Acer", modelo: "Aspire A315", sistema_operativo: "Windows 10", observacion: null, uid_tarjeta: 4 },
  { marca: "Asus", modelo: "X415MA", sistema_operativo: "Windows 11", observacion: "Asignado a sala de estudio", uid_tarjeta: 5 },
  { marca: "HP", modelo: "240 G8", sistema_operativo: "Windows 10 Home", observacion: null, uid_tarjeta: 6 },
  { marca: "Dell", modelo: "OptiPlex 3080", sistema_operativo: "Linux Debian 12", observacion: "Equipo fijo del laboratorio de sistemas", uid_tarjeta: 7 },
  { marca: "Lenovo", modelo: "IdeaPad 3 15ADA6", sistema_operativo: "Windows 11", observacion: "Notebook de préstamo", uid_tarjeta: 8 },
  { marca: "Banghó", modelo: "Max L5 i3", sistema_operativo: "Windows 10", observacion: "Equipo nacional, donado por Secretaría Académica", uid_tarjeta: 9 },
  { marca: "EXO", modelo: "Smart P33", sistema_operativo: "Linux Mint 21", observacion: "Equipo en sala de consultas", uid_tarjeta: 10 },
  { marca: "HP", modelo: "EliteBook 830 G5", sistema_operativo: "Windows 10 Pro", observacion: "Batería cambiada en 2024", uid_tarjeta: 11 },
  { marca: "Dell", modelo: "Vostro 3500", sistema_operativo: "Ubuntu 20.04", observacion: "Para prácticas de programación", uid_tarjeta: 12 }
];

db.serialize(() => {
  computadoras.forEach(c => {
    db.run(
      `INSERT OR IGNORE INTO computadora (marca, modelo, sistema_operativo, observacion, uid_tarjeta)
       VALUES (?, ?, ?, ?, ?)`,
      [c.marca, c.modelo, c.sistema_operativo, c.observacion, c.uid_tarjeta],
      (err) => {
        if (err) console.error("Error insertando computadora:", err.message);
        else console.log(`💻 Computadora ${c.marca} ${c.modelo} insertada correctamente.`);
      }
    );
  });
});

db.close();
