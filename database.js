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
                    this.createTables().then(resolve).catch(reject);
                }
            });
        });
    }

    createTables() {
        return new Promise((resolve, reject) => {
            // Mantener la tabla original para compatibilidad
            const cardsSql = `
                CREATE TABLE IF NOT EXISTS nfc_cards (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    uid TEXT NOT NULL UNIQUE,
                    first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
                    read_count INTEGER DEFAULT 1
                )
            `;

            // Nueva tabla para registros individuales con columnas específicas para día y hora
            const entriesSql = `
                CREATE TABLE IF NOT EXISTS nfc_entries (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    uid TEXT NOT NULL,
                    dia TEXT NOT NULL,
                    hora TEXT NOT NULL,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `;

            this.db.run(cardsSql, (err) => {
                if (err) {
                    console.error('Error al crear la tabla nfc_cards:', err.message);
                    reject(err);
                    return;
                }
                
                this.db.run(entriesSql, (err) => {
                    if (err) {
                        console.error('Error al crear la tabla nfc_entries:', err.message);
                        reject(err);
                    } else {
                        console.log('Tablas creadas o ya existen');
                        resolve();
                    }
                });
            });
        });
    }

    // Método para insertar una nueva entrada independiente
    insertEntry(uid) {
        return new Promise((resolve, reject) => {
            // Obtener fecha y hora local formateada
            const now = new Date();
            
            // Formatear día como DD/MM/YYYY
            const dia = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
            
            // Formatear hora como HH:MM:SS
            const hora = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
            
            // Formato completo para timestamp
            const localDateTime = now.toISOString().replace('T', ' ').substring(0, 19);
            
            // Insertar nueva entrada con día y hora separados
            const insertSql = 'INSERT INTO nfc_entries (uid, dia, hora, timestamp) VALUES (?, ?, ?, ?)';
            
            this.db.run(insertSql, [uid, dia, hora, localDateTime], function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                
                // También actualizar la tabla nfc_cards para mantener compatibilidad
                const selectSql = 'SELECT id, read_count FROM nfc_cards WHERE uid = ?';
                
                this.db.get(selectSql, [uid], (err, row) => {
                    if (err) {
                        // No fallamos aquí, solo registramos el error
                        console.error('Error al verificar tarjeta existente:', err.message);
                    }

                    if (row) {
                        // UID existe, actualizar
                        const updateSql = `
                            UPDATE nfc_cards 
                            SET last_seen = ?, read_count = read_count + 1 
                            WHERE uid = ?
                        `;
                        
                        this.db.run(updateSql, [localDateTime, uid], function(err) {
                            if (err) {
                                console.error('Error al actualizar tarjeta:', err.message);
                            }
                        });
                    } else {
                        // UID nuevo, insertar
                        const insertCardSql = 'INSERT INTO nfc_cards (uid, first_seen, last_seen) VALUES (?, ?, ?)';
                        
                        this.db.run(insertCardSql, [uid, localDateTime, localDateTime], function(err) {
                            if (err) {
                                console.error('Error al insertar nueva tarjeta:', err.message);
                            }
                        });
                    }
                });
                
                console.log(`Nueva entrada para UID ${uid} registrada - Día: ${dia}, Hora: ${hora}`);
                resolve({
                    action: 'entry_recorded',
                    uid: uid,
                    id: this.lastID,
                    dia: dia,
                    hora: hora,
                    timestamp: localDateTime
                });
            }.bind(this));
        });
    }

    // Mantener el método original para compatibilidad
    insertOrUpdateUID(uid) {
        return this.insertEntry(uid); // Ahora redirige al nuevo método
    }

    // Obtener todas las entradas individuales
    getAllEntries() {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM nfc_entries ORDER BY timestamp DESC';
            
            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Obtener entradas por UID
    getEntriesByUID(uid) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM nfc_entries WHERE uid = ? ORDER BY timestamp DESC';
            
            this.db.all(sql, [uid], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Mantener los métodos originales para compatibilidad
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
            // Eliminar de ambas tablas
            const deleteCardSql = 'DELETE FROM nfc_cards WHERE uid = ?';
            const deleteEntriesSql = 'DELETE FROM nfc_entries WHERE uid = ?';
            
            this.db.run(deleteCardSql, [uid], (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                this.db.run(deleteEntriesSql, [uid], function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        console.log(`UID ${uid} eliminado de la base de datos`);
                        resolve({ deletedRows: this.changes });
                    }
                });
            });
        });
    }

    clearAllCards() {
        return new Promise((resolve, reject) => {
            // Limpiar ambas tablas
            const clearCardsSql = 'DELETE FROM nfc_cards';
            const clearEntriesSql = 'DELETE FROM nfc_entries';
            
            this.db.run(clearCardsSql, [], (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                this.db.run(clearEntriesSql, [], function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        console.log('🧹 Todas las tarjetas y entradas eliminadas de la base de datos');
                        resolve({ deletedRows: this.changes });
                    }
                });
            });
        });
    }

    getStats() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT 
                    (SELECT COUNT(*) FROM nfc_cards) as total_cards,
                    (SELECT COUNT(*) FROM nfc_entries) as total_entries,
                    (SELECT MAX(timestamp) FROM nfc_entries) as last_activity
                FROM nfc_cards LIMIT 1
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