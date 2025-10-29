// seedUsuarios.js
const NFCDatabase = require("./database");

async function cargarUsuarios() {
    const db = new NFCDatabase();

    // Esperamos que se inicialice la base de datos
    await new Promise(resolve => setTimeout(resolve, 500));

    const usuarios = [
        {
            id_usuario: '11111111',
            tipo_usuario: 'Cursante',
            nombre_completo: 'María González',
            email: 'maria.gonzalez@estudiante.com',
            telefono: '111111111',
            domicilio: 'Av. Principal 123',
            codigo_postal: '1000',
            ciudad: 'San Francisco',
            provincia: 'Córdoba',
            sexo: 'Femenino',
            operador: 99999999,
            contrasena: 'password123',
            legajo: 11111,
            carreras: ['Ingeniería en Sistemas'],
            materias: ['Programación I', 'Base de Datos']
        },
        {
            id_usuario: '22222222',
            tipo_usuario: 'Cursante',
            nombre_completo: 'Carlos Rodríguez',
            email: 'carlos.rodriguez@estudiante.com',
            telefono: '222222222',
            domicilio: 'Calle Secundaria 456',
            codigo_postal: '1000',
            ciudad: 'San Francisco',
            provincia: 'Córdoba',
            sexo: 'Masculino',
            operador: 99999999,
            contrasena: 'password123',
            legajo: 22222,
            carreras: ['Ingeniería en Sistemas'],
            materias: ['Algoritmos', 'Estructuras de Datos']
        },
        {
            id_usuario: '33333333',
            tipo_usuario: 'Docente',
            nombre_completo: 'Ana Martínez',
            email: 'ana.martinez@docente.com',
            telefono: '333333333',
            domicilio: 'Boulevard Central 789',
            codigo_postal: '1000',
            ciudad: 'San Francisco',
            provincia: 'Córdoba',
            sexo: 'Femenino',
            operador: 99999999,
            contrasena: 'password123',
            legajo: 33333,
            carreras: ['Ingeniería en Sistemas'],
            materias: ['Programación Avanzada', 'Arquitectura de Software']
        },
        {
            id_usuario: '44444444',
            tipo_usuario: 'Egresado',
            nombre_completo: 'Luis Fernández',
            email: 'luis.fernandez@egresado.com',
            telefono: '444444444',
            domicilio: 'Plaza Mayor 321',
            codigo_postal: '1000',
            ciudad: 'San Francisco',
            provincia: 'Córdoba',
            sexo: 'Masculino',
            operador: 99999999,
            contrasena: 'password123',
            legajo: 44444,
            carreras: ['Ingeniería en Sistemas'],
            materias: []
        },
        {
            id_usuario: '55555555',
            tipo_usuario: 'Cursante',
            nombre_completo: 'Sofía López',
            email: 'sofia.lopez@estudiante.com',
            telefono: '555555555',
            domicilio: 'Ruta Nacional 654',
            codigo_postal: '1000',
            ciudad: 'San Francisco',
            provincia: 'Córdoba',
            sexo: 'Femenino',
            operador: 99999999,
            contrasena: 'password123',
            legajo: 55555,
            carreras: ['Ingeniería en Sistemas'],
            materias: ['Redes de Computadoras', 'Sistemas Operativos']
        },
        {
            id_usuario: '66666666',
            tipo_usuario: 'No Docente',
            nombre_completo: 'Roberto Silva',
            email: 'roberto.silva@nodocente.com',
            telefono: '666666666',
            domicilio: 'Calle del Trabajo 987',
            codigo_postal: '1000',
            ciudad: 'San Francisco',
            provincia: 'Córdoba',
            sexo: 'Masculino',
            operador: 99999999,
            contrasena: 'password123',
            legajo: 66666,
            carreras: [],
            materias: []
        },
        {
            id_usuario: '77777777',
            tipo_usuario: 'Aspirante',
            nombre_completo: 'Valentina Ruiz',
            email: 'valentina.ruiz@aspirante.com',
            telefono: '777777777',
            domicilio: 'Avenida Estudiantes 147',
            codigo_postal: '1000',
            ciudad: 'San Francisco',
            provincia: 'Córdoba',
            sexo: 'Femenino',
            operador: 99999999,
            contrasena: 'password123',
            legajo: null,
            carreras: [],
            materias: []
        },
        {
            id_usuario: '88888888',
            tipo_usuario: 'Externo',
            nombre_completo: 'Diego Morales',
            email: 'diego.morales@externo.com',
            telefono: '888888888',
            domicilio: 'Calle Externa 258',
            codigo_postal: '1000',
            ciudad: 'San Francisco',
            provincia: 'Córdoba',
            sexo: 'Masculino',
            operador: 99999999,
            contrasena: 'password123',
            legajo: null,
            carreras: [],
            materias: []
        }
    ];

    let usuariosCreados = 0;
    let usuariosExistentes = 0;

    for (const usuario of usuarios) {
        try {
            await db.registrarUsuario(usuario);
            usuariosCreados++;
            console.log(`✅ Usuario creado: ${usuario.nombre_completo} (${usuario.tipo_usuario})`);
        } catch (error) {
            if (error.message.includes('UNIQUE constraint failed')) {
                usuariosExistentes++;
                console.log(`⚠️ Usuario ya existe: ${usuario.nombre_completo}`);
            } else {
                console.error(`❌ Error creando usuario ${usuario.nombre_completo}:`, error.message);
            }
        }
    }

    console.log(`\n📊 Resumen:`);
    console.log(`   Usuarios creados: ${usuariosCreados}`);
    console.log(`   Usuarios existentes: ${usuariosExistentes}`);
    console.log(`   Total procesados: ${usuarios.length}`);
    
    // Mostrar estadísticas por tipo de usuario
    const todosUsuarios = await db.obtenerUsuarios();
    const estadisticas = todosUsuarios.reduce((acc, usuario) => {
        acc[usuario.tipo_usuario] = (acc[usuario.tipo_usuario] || 0) + 1;
        return acc;
    }, {});
    
    console.log('\n📈 Estadísticas por tipo de usuario:');
    Object.entries(estadisticas).forEach(([tipo, cantidad]) => {
        console.log(`   ${tipo}: ${cantidad}`);
    });
}

// Ejecutar si se llama directamente
if (require.main === module) {
    cargarUsuarios()
        .then(() => {
            console.log('\n🎉 Seed de usuarios completado exitosamente');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Error ejecutando seed de usuarios:', error);
            process.exit(1);
        });
}

module.exports = cargarUsuarios;
