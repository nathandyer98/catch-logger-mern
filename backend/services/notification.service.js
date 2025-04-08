import NotificationRepository from "../repository/notification.repository.js";
import { NotFoundError, ServiceError, AuthorizationError } from '../errors/applicationErrors.js';
import eventBus from "../src/eventBus.js";

export const getNotifications = async (userId) => {
    try {
        const notifications = await NotificationRepository.getNotifications(userId);
        await NotificationRepository.markNotificationsAsRead(userId);
        return notifications;
    } catch (error) {
        console.log("Error fetching notifications in repository: ", error.message);
        throw new ServiceError("Failed to fetch notifications due to a service issue.");
    }
}

export const getNotificationsCount = async (userId) => {
    try {
        const count = await NotificationRepository.getNotificationsCount(userId);
        return count;
    } catch (error) {
        console.log("Error fetching notifications count in repository: ", error.message);
        throw new ServiceError("Failed to fetch notifications count due to a service issue.");
    }
}

export const deleteNotifications = async (userId) => {
    let message;
    try {
        await NotificationRepository.deleteNotifications(userId);
        message = "Notifications deleted successfully";
        return message;
    } catch (error) {
        console.log("Error deleting notifications in repository: ", error.message);
        throw new ServiceError("Failed to delete notifications due to a service issue.");
    }
}

export const deleteNotification = async (notificationId, userId) => {
    let message;
    const notification = await NotificationRepository.findNotificationById(notificationId);
    if (!notification) {
        throw new NotFoundError("Notification not found");
    }

    if (notification.to.toString() !== userId.toString()) {
        throw new AuthorizationError("You are not authorized to delete this notification");
    }
    try {
        await NotificationRepository.deleteNotification(notificationId);
        message = "Notification deleted successfully";
        return message;
    } catch (error) {
        console.log("Error deleting notification in repository: ", error.message);
        throw new ServiceError("Failed to delete notification due to a service issue.");
    }
}

export const createNotification = async (notificationData) => {
    if (!notificationData.from || !notificationData.to || !notificationData.type) {
        throw new ServiceError("Missing required fields for notification creation.");
    }

    const isRecipientTheSameAsSender = notificationData.from.toString() === notificationData.to.toString();
    if (isRecipientTheSameAsSender) {
        return null;
    }

    try {
        const newNotification = await NotificationRepository.createNotification(notificationData);

        if (newNotification) {
            eventBus.emit('notification:created', { notification: newNotification });
            console.log(`Notification created and event emitted: ${newNotification._id}`);
        } else {
            console.warn("NotificationService: createNotification did not return a notification.");
        }

        return newNotification;
    } catch (error) {
        console.log("Error creating notification in repository: ", error.message);
        throw new ServiceError("Failed to create notification due to a service issue.");
    }
}
