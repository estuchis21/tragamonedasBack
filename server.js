require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para JSON
app.use(express.json());

// Middleware
app.use(cors({
  origin: "http://localhost:5173", // permitimos tu frontend
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));

const spinRoutes = require('./routes/juegoRoute');
app.use('/juego', spinRoutes);

const authRoutes = require('./routes/authRoutes');
app.use('/auth', authRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('Backend funcionando');
});

// Conectar a la base de datos y luego iniciar servidor
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
});
