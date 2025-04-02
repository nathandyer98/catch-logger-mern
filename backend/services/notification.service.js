import NotificationRepository from "../repository/notification.repository.js";
import { NotFoundError, ServiceError, AuthorizationError } from '../errors/applicationErrors.js';

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

