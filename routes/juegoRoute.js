const express = require('express');
const router = express.Router();
const juegoController= require('../controllers/juegoController');

router.post('/spin', juegoController.ejecutarSpin);
router.post('/simularSpins', juegoController.simularSpins)

module.exports = router;
