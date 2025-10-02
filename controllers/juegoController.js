const sql = require('mssql');
const connectDB = require('../config/db');

exports.ejecutarSpin = async (req, res) => {
    const { id_usuario, apuesta } = req.body;

    try {
        const pool = await connectDB();

        // Ejecutar el stored procedure
        const result = await pool.request()
            .input('id_usuario', sql.Int, id_usuario)
            .input('apuesta', sql.Int, apuesta)
            .execute('EjecutarSpin');

        // Recordset 1: resumen del spin (premio total)
        const spin = result.recordsets[0][0];

        // Recordset 2: matriz generada
        const matriz = result.recordsets[1];

        // Recordset 3: combinaciones ganadoras
        const combinaciones = result.recordsets[2];

        // Recordset 4: saldo actualizado
        const saldo = result.recordsets[3][0];

        res.json({
            success: true,
            mensaje: 'Spin ejecutado correctamente',
            spin,
            matriz,
            combinaciones,
            saldo
        });

    } catch (error) {
        console.error('❌ Error al ejecutar el spin:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al ejecutar el spin',
            error: error.message
        });
    }
};