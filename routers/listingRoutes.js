const express = require('express');
const router = express.Router();
const listingController = require('../controllers/listingController');
const verifyToken = require('../middlewares/verify');

// create a listing
router.post('/create', verifyToken, listingController.createListing);

// get a listing
router.get('/:id', verifyToken, listingController.getListing);

// get all listings
router.get('/', verifyToken, listingController.getListings);
module.exports = router;
