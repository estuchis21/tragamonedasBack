const sql = require('mssql');
const connectDB = require('../config/db');

// Función para calcular premio según la matriz
function calcularPremio(matriz, tipo_apuesta) {
    let premio_total = 0;

    const premios = { 3: 500, 4: 2000, 5: 10000 };

    // Revisar horizontales
    for (let f = 0; f < 3; f++) {
        let count = 1;
        for (let c = 1; c < 5; c++) {
            if (matriz[f][c] === matriz[f][c - 1]) {
                count++;
            } else {
                count = 1;
            }
            if (premios[count]) premio_total += premios[count];
        }
    }

    // Revisar verticales
    for (let c = 0; c < 5; c++) {
        let count = 1;
        for (let f = 1; f < 3; f++) {
            if (matriz[f][c] === matriz[f - 1][c]) {
                count++;
            } else {
                count = 1;
            }
            if (premios[count]) premio_total += premios[count];
        }
    }

    // Revisar diagonales principales (izq-arriba a der-abajo)
    if (matriz[0][0] === matriz[1][1] && matriz[1][1] === matriz[2][2]) premio_total += premios[3];
    if (matriz[0][1] === matriz[1][2] && matriz[1][2] === matriz[2][3]) premio_total += premios[3];
    if (matriz[0][2] === matriz[1][3] && matriz[1][3] === matriz[2][4]) premio_total += premios[3];

    // Revisar diagonales inversas (der-arriba a izq-abajo)
    if (matriz[0][4] === matriz[1][3] && matriz[1][3] === matriz[2][2]) premio_total += premios[3];
    if (matriz[0][3] === matriz[1][2] && matriz[1][2] === matriz[2][1]) premio_total += premios[3];
    if (matriz[0][2] === matriz[1][1] && matriz[1][1] === matriz[2][0]) premio_total += premios[3];

    return premio_total;
}

const crearSpin = async (req, res) => {
    try {
        const { id_usuario, apuesta, tipo_apuesta } = req.body;

        const pool = await connectDB();

        // 1️⃣ Crear Spin
        const resultSpin = await pool.request()
            .input('id_usuario', sql.Int, id_usuario)
            .input('apuesta', sql.Int, apuesta)
            .input('tipo_apuesta', sql.NVarChar(20), tipo_apuesta)
            .execute('CrearSpin');

        const id_spin = resultSpin.recordset[0].id_spin;

        // 2️⃣ Generar matriz de 3x5 con símbolos aleatorios (1 a 6)
        const filas = 3;
        const columnas = 5;
        const matriz = [];
        for (let f = 0; f < filas; f++) {
            matriz[f] = [];
            for (let c = 0; c < columnas; c++) {
                const id_simbolo = Math.floor(Math.random() * 6) + 1;
                matriz[f][c] = id_simbolo;

                // Insertar detalle
                await pool.request()
                    .input('id_spin', sql.Int, id_spin)
                    .input('id_simbolo', sql.Int, id_simbolo)
                    .input('fila', sql.Int, f + 1)
                    .input('columna', sql.Int, c + 1)
                    .execute('InsertarDetalleSpin');
            }
        }

        // 3️⃣ Calcular premio
        const premio_total = calcularPremio(matriz, tipo_apuesta);

        // 4️⃣ Actualizar premio en Spin
        await pool.request()
            .input('id_spin', sql.Int, id_spin)
            .input('premio_total', sql.Int, premio_total)
            .execute('ActualizarPremioSpin');

        // 5️⃣ Responder al frontend
        res.json({
            ok: true,
            id_spin,
            matriz,
            premio_total,
            mensaje: premio_total > 0 ? '¡Ganaste!' : 'No hay premio'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, error: error.message });
    }
};

module.exports = {
    crearSpin
};
