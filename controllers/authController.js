const sql = require('mssql');
const connectDB = require('../config/db');
const jwt = require('jsonwebtoken');


exports.registro = async (req, res) => {
    try {
        const { nombres, dni } = req.body;

        if (!nombres || !dni) {
            return res.status(400).json({ error: 'Faltan datos' });
        }

        const pool = await connectDB();

        try {
            // Intentamos verificar si existe el usuario
            await pool.request()
                .input('dni', sql.Int, dni)
                .execute('existePorDni');
        } catch (err) {
            // Si es el error que lanza el procedimiento, respondemos con mensaje
            if (err.number === 50000) {
                return res.status(400).json({ success: false, message: err.message });
            }
            // Otros errores, relanzamos
            throw err;
        }

        // Insertar usuario si no existía
        await pool.request()
            .input('nombres', sql.NVarChar(100), nombres)
            .input('dni', sql.Int, dni)
            .execute('insertUsuario');

        res.json({ success: true, message: 'Usuario registrado correctamente' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error al registrar usuario' });
    }
}



exports.login = async (req, res) => {
    try {
        const { dni } = req.body;

        if (!dni) {
            return res.status(400).json({ error: 'Faltan datos' });
        }

        const pool = await connectDB();

        // Buscamos al usuario por DNI
        const result = await pool.request()
            .input('dni', sql.Int, dni)
            .query('SELECT * FROM Usuario WHERE dni = @dni');

        if (result.recordset.length === 0) {
            return res.status(400).json({ success: false, message: 'Usuario no encontrado' });
        }

        const user = result.recordset[0];

        // Generamos token JWT
        const token = jwt.sign(
            { id: user.id_usuario, nombre: user.nombre, dni: user.dni },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

       res.json({
        success: true,
        message: 'Login exitoso',
        token,
        user: {
            id_usuario: user.id_usuario,
            nombre: user.nombre,
            dni: user.dni,
            saldo: user.saldo ?? 0,   // si es null, devuelve 0
            puntaje_acumulado: user.puntaje_acumulado ?? 0
        }
});


    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error al iniciar sesión' });
    }
}


exports.obtenerUsuarioPorId = async (req, res)  => {

    const { id_usuario } = req.params;
  try {
    const pool = await connectDB(); // tu config de conexión
    const result = await pool
      .request()
      .input("id_usuario", sql.Int, id_usuario) // aseguramos que sea número
      .query("SELECT * FROM Usuario WHERE id_usuario = @id_usuario");

    return res.status(200).json(result.recordset[0]); // devuelve el usuario o undefined si no existe
  } catch (err) {
    console.error("Error al obtener usuario:", err);
    throw err;
  }
}