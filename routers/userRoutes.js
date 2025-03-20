const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const verifyToken = require('../middlewares/verify');
const { check, validationResult } = require('express-validator');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Validation rules
const createUserValidation = [
  check('wallet_address').notEmpty().withMessage('Wallet address is required'),
  check('name').notEmpty().withMessage('Name is required'),
  check('phone').notEmpty().withMessage('Phone number is required')
    .isMobilePhone().withMessage('Please enter a valid phone number'),
];

const refreshTokenValidation = [
  check('wallet_address').notEmpty().withMessage('Wallet address is required'),
];

const updateUserValidation = [
  check('name').optional(),
  check('phone').optional().isMobilePhone().withMessage('Please enter a valid phone number'),
  check('profile_image').optional(),
];

const checkUserValidation = [
  check('wallet_address').notEmpty().withMessage('Wallet address is required'),
];
// create user
router.post('/create-user', createUserValidation, validate, userController.connectWallet);

// get user
router.get('/profile', verifyToken, userController.getUser);

// check user
router.get('/check-user', checkUserValidation, validate, userController.checkUser);

// refresh token
router.post('/refresh-token', refreshTokenValidation, validate, userController.refreshToken);

// update user
router.put('/update-user', verifyToken, updateUserValidation, validate, userController.updateUser);

module.exports = router;
