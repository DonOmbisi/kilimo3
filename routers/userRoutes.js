const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const verifyToken = require('../middlewares/verify');

// create user
router.post('/create-user', userController.connectWallet);

// get user
router.get('/profile', verifyToken, userController.getUser);

// check user
router.get('/check-user', userController.checkUser);

module.exports = router;
