import NotificationRepository from "../repository/notification.repository.js";
import { NotFoundError, ServiceError, AuthorizationError } from '../errors/applicationErrors.js';
import eventBus from '../utils/eventBus.js';

export const getNotifications = async (userId) => {
    const notifications = await NotificationRepository.getNotifications(userId);
    await NotificationRepository.markNotificationsAsRead(userId);
    return notifications;
}

export const getNotificationsCount = async (userId) => {
    const count = await NotificationRepository.getNotificationsCount(userId);
    return count;
}

export const deleteNotifications = async (userId) => {
    await NotificationRepository.deleteNotifications(userId);
    return "Notifications deleted successfully.";
}

export const deleteNotification = async (notificationId, userId) => {
    const notification = await NotificationRepository.findNotificationById(notificationId);
    if (!notification) {
        throw new NotFoundError("Notification not found.");
    }
    if (notification.to.toString() !== userId.toString()) {
        throw new AuthorizationError("Unauthorized - You are not authorized to delete this notification.");
    }
    await NotificationRepository.deleteNotification(notificationId);
    return "Notification deleted successfully.";
}

export const createNotification = async (notificationData) => {
    if (!notificationData.from || !notificationData.to || !notificationData.type) {
        throw new ServiceError("Missing required fields for notification creation.");
    }
    const isRecipientTheSameAsSender = notificationData.from.toString() === notificationData.to.toString();
    if (isRecipientTheSameAsSender) {
        return null;
    }
    const newNotification = await NotificationRepository.createNotification(notificationData);
    if (newNotification) {
        try {
            eventBus.emit('notification:created', { notification: newNotification });
            console.log(`Notification created and event emitted: ${newNotification._id}`);
        } catch (error) {
            console.error("Failed to emit notification:created event:", eventError.message);

        }
    } else {
        console.warn("NotificationService: createNotification did not return a notification.");
    }

    return newNotification;
}
