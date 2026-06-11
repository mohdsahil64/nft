const express = require('express');
const router = express.Router();
const { getPrice, getStats } = require('../controllers/nftController');

router.get('/price', getPrice);
router.get('/stats', getStats);

module.exports = router;
