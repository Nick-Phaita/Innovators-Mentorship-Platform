// routes/explore.js

const express = require('express');
const router = express.Router();
const exploreController = require('../controllers/exploreController');

// GET Explore
router.get('/', exploreController.getExplore);
router.get('/search', exploreController.search);

module.exports = router;
