// routes/notifications.js

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// GET notifications for the logged-in user
router.get('/', notificationController.handleNotifications);

// Mark notification as read
router.get('/read/:id', notificationController.handleMarkAsRead);

// Export the router
module.exports = router;
