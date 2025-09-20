const sql = require('mssql');
const connectDB = require('../config/db');

const ejecutarSpin = async (req, res) => {
    try {
        const { id_usuario, apuesta, tipo_apuesta } = req.body;

        if (!id_usuario || !apuesta || !tipo_apuesta) {
            return res.status(400).json({ ok: false, error: 'Faltan parámetros' });
        }

        const pool = await connectDB();

        // Ejecuta el SP EjecutarSpin
        const result = await pool.request()
            .input('id_usuario', sql.Int, id_usuario)
            .input('apuesta', sql.Int, apuesta)
            .input('tipo_apuesta', sql.NVarChar(20), tipo_apuesta || 'todas')
            .execute('EjecutarSpin');

        const spinResult = result.recordset[0];

        if (spinResult.premio_total > 0) {
            res.json({
                ok: true,
                id_spin: spinResult.id_spin,
                premio_total: spinResult.premio_total,
                mensaje: `¡Ganaste ${spinResult.premio_total} puntos!`
            });
        } else {
            res.json({
                ok: true,
                id_spin: spinResult.id_spin,
                premio_total: 0,
                mensaje: 'No ganaste esta vez.'
            });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, error: error.message });
    }
};


module.exports = {
    ejecutarSpin
};
