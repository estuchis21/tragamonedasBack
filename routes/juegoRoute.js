const express = require('express');
const router = express.Router();
const juegoController= require('../controllers/juegoController');

router.post('/spin', juegoController.crearSpin);

module.exports = router;
