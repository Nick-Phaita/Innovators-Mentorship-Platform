const Notification = require('../models/Notification');

// Create a new notification
exports.createNotification = async (userId, content) => {
    try {
        const notification = await Notification.create({
            user_id: userId,
            content: content
        });
        return notification;
    } catch (err) {
        console.error('Error creating notification:', err);
        throw err;
    }
};

// Get all notifications for a user
exports.getUserNotifications = async (userId) => {
    try {
        const notifications = await Notification.findAll({
            where: { user_id: userId },
            order: [['created_at', 'DESC']]  // Newest first
        });
        return notifications;
    } catch (err) {
        console.error('Error fetching notifications:', err);
        throw err;
    }
};

// Mark notification as read
exports.markAsRead = async (notificationId) => {
    try {
        const result = await Notification.update(
            { is_read: true },
            { where: { notification_id: notificationId } }
        );
        return result[0] > 0;  // Returns true if a row was updated
    } catch (err) {
        console.error('Error marking notification as read:', err);
        throw err;
    }
};

// Function to handle the fetching of notifications and marking as read
exports.handleNotifications = async (req, res) => {
    try {
        const userId = req.session.user.user_id;  // Get user ID from session
        const notifications = await this.getUserNotifications(userId);
        const user = req.session.user; // Get user object from session
        res.render('notifications', { notifications, user, message: null }); // Pass user to the view
    } catch (err) {
        console.error(err);
        res.status(500).render('notifications', { notifications: [], user: req.session.user, message: 'Error fetching notifications.' });
    }
};

// Function to handle marking notification as read
exports.handleMarkAsRead = async (req, res) => {
    try {
        const notificationId = req.params.id;
        await this.markAsRead(notificationId);
        res.redirect('/notifications');  // Redirect back to notifications page
    } catch (err) {
        console.error(err);
        res.status(500).render('notifications', { notifications: [], user: req.session.user, message: 'Error marking notification as read.' });
    }
};
