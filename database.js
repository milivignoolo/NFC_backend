const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class NFCDatabase {
    constructor(dbPath = 'nfc_data.db') {
        this.dbPath = dbPath;
        this.db = null;
        this.init();
    }

    init() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Error al conectar con la base de datos:', err.message);
                    reject(err);
                } else {
                    console.log('Conectado a la base de datos SQLite');
                    this.createTable().then(resolve).catch(reject);
                }
            });
        });
    }

    createTable() {
        return new Promise((resolve, reject) => {
            const sql = `
                CREATE TABLE IF NOT EXISTS nfc_cards (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    uid TEXT NOT NULL UNIQUE,
                    first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
                    read_count INTEGER DEFAULT 1
                )
            `;

            this.db.run(sql, (err) => {
                if (err) {
                    console.error('Error al crear la tabla:', err.message);
                    reject(err);
                } else {
                    console.log('Tabla nfc_cards creada o ya existe');
                    resolve();
                }
            });
        });
    }

    insertOrUpdateUID(uid) {
        return new Promise((resolve, reject) => {
            // Primero verificar si el UID ya existe
            const selectSql = 'SELECT id, read_count FROM nfc_cards WHERE uid = ?';
            
            this.db.get(selectSql, [uid], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (row) {
                    // UID existe, actualizar
                    const updateSql = `
                        UPDATE nfc_cards 
                        SET last_seen = CURRENT_TIMESTAMP, read_count = read_count + 1 
                        WHERE uid = ?
                    `;
                    
                    this.db.run(updateSql, [uid], function(err) {
                        if (err) {
                            reject(err);
                        } else {
                            console.log(`UID ${uid} actualizado. Lecturas totales: ${row.read_count + 1}`);
                            resolve({
                                action: 'updated',
                                uid: uid,
                                read_count: row.read_count + 1
                            });
                        }
                    });
                } else {
                    // UID nuevo, insertar
                    const insertSql = 'INSERT INTO nfc_cards (uid) VALUES (?)';
                    
                    this.db.run(insertSql, [uid], function(err) {
                        if (err) {
                            reject(err);
                        } else {
                            console.log(`Nuevo UID ${uid} guardado en la base de datos`);
                            resolve({
                                action: 'inserted',
                                uid: uid,
                                id: this.lastID
                            });
                        }
                    });
                }
            });
        });
    }

    getAllCards() {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM nfc_cards ORDER BY last_seen DESC';
            
            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    getCardByUID(uid) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM nfc_cards WHERE uid = ?';
            
            this.db.get(sql, [uid], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    deleteCard(uid) {
        return new Promise((resolve, reject) => {
            const sql = 'DELETE FROM nfc_cards WHERE uid = ?';
            
            this.db.run(sql, [uid], function(err) {
                if (err) {
                    reject(err);
                } else {
                    console.log(`UID ${uid} eliminado de la base de datos`);
                    resolve({ deletedRows: this.changes });
                }
            });
        });
    }

    clearAllCards() {
        return new Promise((resolve, reject) => {
            const sql = 'DELETE FROM nfc_cards';
            
            this.db.run(sql, [], function(err) {
                if (err) {
                    reject(err);
                } else {
                    console.log('🧹 Todas las tarjetas eliminadas de la base de datos');
                    resolve({ deletedRows: this.changes });
                }
            });
        });
    }

    getStats() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT 
                    COUNT(*) as total_cards,
                    SUM(read_count) as total_reads,
                    MAX(last_seen) as last_activity
                FROM nfc_cards
            `;
            
            this.db.get(sql, [], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log('Conexión a la base de datos cerrada');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }
}

module.exports = NFCDatabase;
