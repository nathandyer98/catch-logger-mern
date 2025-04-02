import Notification from "../models/notification.model.js";

class NotificationRepository {

    /**
     * Find a notification by ID.
     * @param {string} notificationId - The ID of the notification to find.
     * @returns {Promise<object|null>} - The plain notification object if found, or null if not found.
     */
    async findNotificationById(notificationId) {
        return Notification.findById(notificationId).lean();
    }

    /**
     * Fetches notifications for a specific user.
     * @param {string} userId - The ID of the user to fetch notifications for.
     * @returns {Promise<Array<object>} - A sorted array of plain objects representing the notifications for the user.
     * Each object contains the notification details, including the sender's fullname, username and profile picture.
     * Returns an empty array ([]) if no other users are found.
     */
    async getNotifications(userId) {
        return Notification.find({ to: userId }).populate('from', 'username fullName profilePic').sort({ createdAt: -1 }).lean();
    }

    /**
     * Get a specific notification by ID.
     * @param {string} notificationId - The ID of the notification to fetch.
     * @returns {Promise<object|null>} - The plain notification object if found, or null if not found.
     * Each object contains the notification details, including the sender's fullname, username and profile picture.
     */
    async getNotificationById(notificationId) {
        return Notification.findById(notificationId).populate('from', 'username fullName profilePic').lean();
    }

    /**
     * Update notifications to read for a specific user.
     * @param {string} userId - The ID of the user to mark notifications as read for.
     * @returns {Promise<void>} - A promise that resolves when the notifications are marked as read.
     */
    async markNotificationsAsRead(userId) {
        return Notification.updateMany({ to: userId }, { read: true });
    }

    /**
     * Get notifications count for a specific user.
     * @param {string} userId - The ID of the user to fetch notifications for.
     * @returns {Promise<number>} - The number of unread notifications for the user.
     * Returns 0 if no other users are found.
     */
    async getNotificationsCount(userId) {
        return Notification.countDocuments({ to: userId, read: false });
    }

    /**
     * Delete notifications for a specific user.
     * @param {string} userId - The ID of the user to delete notifications for.
     * @returns {Promise<void>} - A promise that resolves when the notifications are deleted.
     */
    async deleteNotifications(userId) {
        return Notification.deleteMany({ to: userId });
    }

    /**
     * Delete a specific notification by ID.
     * @param {string} notificationId - The ID of the notification to delete.
     * @returns {Promise<void>} - A promise that resolves when the notification is deleted.
     */
    async deleteNotification(notificationId) {
        return Notification.findByIdAndDelete(notificationId);
    }

    /**
     * Create a new notification.
     * @param {object} notificationData - The data to create the notification with.
     * @returns {Promise<object>} - The created notification as a plain object.
     */
    async createNotification(notificationData) {
        const newNotification = new Notification(notificationData);
        await newNotification.save();
        const notificationObject = newNotification.toObject();
        return notificationObject;
    }
}

export default new NotificationRepository();