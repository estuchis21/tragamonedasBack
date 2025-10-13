const sql = require('mssql');
const connectDB = require('../config/db');

exports.ejecutarSpin = async (req, res) => {
  const { id_usuario, apuesta, tipo_apuesta } = req.body;

  try {
    const pool = await connectDB();

    // Ejecutar SP con parámetros
    const result = await pool.request()
      .input('id_usuario', sql.Int, id_usuario)
      .input('apuesta', sql.Int, apuesta)
      .execute('EjecutarSpin');

    // Si no devuelve los 3 recordsets esperados
    if (!result.recordsets || result.recordsets.length < 3) {
      return res.status(500).json({
        success: false,
        mensaje: 'El procedimiento no devolvió todos los resultados esperados'
      });
    }


    // Extraer resultados
    const spin = result.recordsets[0][0];       // info del spin
    const matriz = result.recordsets[1];        // matriz generada
    
    console.table(matriz)

    const combinaciones = result.recordsets[2]; // combinaciones ganadoras

    // Traer saldo actualizado
    const saldoResult = await pool.request()
      .input('id_usuario', sql.Int, id_usuario)
      .query('SELECT saldo FROM Usuario WHERE id_usuario = @id_usuario');

    const saldo = saldoResult.recordset[0]?.saldo || 0;

    // Verificar si el saldo quedó negativo por algún error
    if (saldo < 0) {
      return res.status(400).json({
        success: false,
        mensaje: 'Saldo negativo. Transacción cancelada.'
      });
    }

    // ✅ Respuesta final
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

    // Capturar errores lanzados por el SP (como RAISERROR)
    if (error.number === 50000) {
      return res.status(400).json({
        success: false,
        mensaje: error.message
      });
    }

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

