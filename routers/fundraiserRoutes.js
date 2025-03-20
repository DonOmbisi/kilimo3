const express = require('express');
const router = express.Router();
const fundraiserController = require('../controllers/fundraiserController');
const verifyToken = require('../middlewares/verify');

// start fundraiser
router.post('/start', verifyToken, fundraiserController.startFundraiser);

// donate to fundraiser
router.post('/donate', verifyToken, fundraiserController.donateToFundraiser);

// get fundraiser
router.get('/:id', verifyToken, fundraiserController.getFundraiser);

// get all fundraisers
router.get('/', verifyToken, fundraiserController.getFundraisers);
module.exports = router;
