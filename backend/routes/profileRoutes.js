const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const authMiddleware = require('../middleware/isAuth');

router.get('/create', profileController.getCreateProfile);
router.post('/create', profileController.postCreateProfile);


router.get('/myprofile', profileController.getMyProfile);
router.get('/myprofile/authentication', profileController.getAuthenticationDetails);
router.post('/myprofile/authentication/update', profileController.updateAuthenticationDetails);
router.get('/:user_id', profileController.getProfileDetails); // For viewing other profiles
router.get('/myprofile/details/update', profileController.getProfileUpdateForm);
router.post('/myprofile/details/update', profileController.updateProfileDetails);

module.exports = router;
