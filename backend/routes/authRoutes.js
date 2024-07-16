const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/', authController.getAuth);  // Use this route to display the combined form
router.post('/signup', authController.postSignup);
router.post('/login', authController.postLogin);
router.get('/verify', authController.getVerify);
router.post('/verify', authController.postVerify);
// Logout route
router.post('/logout', authController.logout);

module.exports = router;
