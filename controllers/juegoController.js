const sql = require('mssql');
const connectDB = require('../config/db');

exports.ejecutarSpin = async (req, res) => {
    const { id_usuario, apuesta } = req.body;

    try {
        const pool = await connectDB();

        const result = await pool.request()
            .input('id_usuario', sql.Int, id_usuario)
            .input('apuesta', sql.Int, apuesta)
            .execute('EjecutarSpin');

        const spin = result.recordsets[0][0]; // Contiene spin, premio_total, mensaje, y el NUEVO saldo
        const matriz = result.recordsets[1];
        const combinaciones = result.recordsets[2];
        
        // ⭐ ELIMINAR ESTA SECCIÓN INNECESARIA:
        /*
        const saldoResult = await pool.request()
            .input('id_usuario', sql.Int, id_usuario)
            .query('SELECT saldo FROM Usuario WHERE id_usuario=@id_usuario');
        const saldo = saldoResult.recordset[0]?.saldo || 0;
        */
        const saldo = spin.saldo; // Usar el saldo devuelto por el SP

        console.table(matriz);

        res.json({
            success: true,
            mensaje: spin.mensaje,
            spin: spin, // Devolvemos el objeto completo (spin, premio_total, saldo, mensaje)
            matriz,
            combinaciones,
            saldo: saldo // Usar el saldo de 'spin'
        });

    } catch (error) {
        // ... (Manejo de errores)
        console.error('❌ Error al ejecutar el spin:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error interno del servidor',
            error: error.message
        });
    }
};


exports.simularSpins = async (req, res) => {

  const {id_usuario, apuesta} = req.body;

    const tiradas = 50;
    let ganadas = 0;
    let totalGanado = 0;
    const resultados = [];

    try {
        const pool = await connectDB();

        for (let i = 0; i < tiradas; i++) {
            const result = await pool.request()
                .input('id_usuario', sql.Int, id_usuario) 
                .input('apuesta', sql.Int, apuesta)  // apuesta fija para simular
                .execute('EjecutarSpin');

            const combinaciones = result.recordsets[2];
            const gananciaSpin = combinaciones.reduce((acc, c) => acc + c.valor, 0);

            if (gananciaSpin > 0) ganadas++;

            totalGanado += gananciaSpin;
            resultados.push({ tirada: i + 1, ganancia: gananciaSpin });
        }

        const porcentajeGanadas = (ganadas / tiradas) * 100;
        const RTP = totalGanado / tiradas;

        res.json({ tiradas, ganadas, porcentajeGanadas, RTP, resultados });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, mensaje: err.message });
    }
}

