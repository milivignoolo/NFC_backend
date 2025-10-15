// seedOperadores.js
const NFCDatabase = require("./database");

async function cargarOperadores() {
    const db = new NFCDatabase();

    // Esperamos que se inicialice la base de datos
    await new Promise(resolve => setTimeout(resolve, 500)); 

    const operadores = [
        {
            id_operador: 12345678,
            nombre_completo: "Ana Pérez",
            email: "ana.perez@email.com",
            telefono: "123456789",
            domicilio: "Calle Falsa 123",
            codigo_postal: "1000",
            ciudad: "Ciudad Ejemplo",
            provincia: "Provincia Ejemplo",
            sexo: "Femenino"
        },
        {
            id_operador: 87654321,
            nombre_completo: "Juan Gómez",
            email: "juan.gomez@email.com",
            telefono: "987654321",
            domicilio: "Avenida Siempre Viva 742",
            codigo_postal: "2000",
            ciudad: "Ciudad Ejemplo 2",
            provincia: "Provincia Ejemplo 2",
            sexo: "Masculino"
        },
        {
            id_operador: 11223344,
            nombre_completo: "Alex Martínez",
            email: "alex.martinez@email.com",
            telefono: "1122334455",
            domicilio: "Boulevard Central 456",
            codigo_postal: "3000",
            ciudad: "Ciudad Ejemplo 3",
            provincia: "Provincia Ejemplo 3",
            sexo: "No binario"
        }
    ];

    for (const op of operadores) {
        try {
            const result = await db.registrarOperador(op);
            console.log(`✅ Operador registrado: ${op.nombre_completo} (ID: ${result.id_operador})`);
        } catch (error) {
            console.error(`❌ Error registrando operador ${op.nombre_completo}:`, error.message);
        }
    }

    await db.close();
}

cargarOperadores();
