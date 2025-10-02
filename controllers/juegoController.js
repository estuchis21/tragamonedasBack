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

        // Verificar que los recordsets existen
        // Esperamos 3 recordsets: Spin, Matriz, Combinaciones
        if (!result.recordsets || result.recordsets.length < 3) {
            return res.status(500).json({
                success: false,
                mensaje: 'El SP no devolvió resultados completos'
            });
        }

        const spin = result.recordsets[0][0];          // id_spin y premio_total
        const matriz = result.recordsets[1];           // Matriz generada con nombres y valores
        const combinaciones = result.recordsets[2];    // Combinaciones ganadoras

        // Traer saldo actualizado del usuario
        const saldoResult = await pool.request()
            .input('id_usuario', sql.Int, id_usuario)
            .query('SELECT saldo FROM Usuario WHERE id_usuario = @id_usuario');

        const saldo = saldoResult.recordset[0] ? saldoResult.recordset[0].saldo : null;

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