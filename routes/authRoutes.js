const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/registro', authController.registro);
router.post('/login', authController.login);
router.get('/getUserId/:id_usuario', authController.obtenerUsuarioPorId);

module.exports = router;