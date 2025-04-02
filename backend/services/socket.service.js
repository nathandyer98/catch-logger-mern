import NotificationRepository from "../repository/notification.repository.js";
import { ServiceError, NotFoundError } from '../errors/applicationErrors.js';

let ioInstance;

export const SocketService = {
    initialize: (io) => {
        ioInstance = io;
        console.log("SocketService initialized.");
    },

    notifyUserOfNotification: async (userId, newNotificationId) => {
        if (!ioInstance) console.error("SocketService has not been initialized.");
        if (!userId || !newNotificationId) {
            throw new ServiceError(`Internal error: Missing required data (userId or notificationId) for notification. User: ${userId}, NotifID: ${newNotificationId}`);
        }
        try {
            const notification = await NotificationRepository.getNotificationById(newNotificationId);
            if (!notification) {
                throw new NotFoundError("Notification not found");
            }

            const notificationUnreadCount = await NotificationRepository.getNotificationsCount(userId) || 0;

            ioInstance.to(userId.toString()).emit('newNotification', notification);
            console.log(`SocketService: Emitted newNotification ${newNotificationId} to user ${userId}`);

            // Emit 'updateNotificationCount' (renamed from your example for consistency)
            ioInstance.to(userId.toString()).emit('updateNotificationCount', notificationUnreadCount);
            console.log(`SocketService: Emitted updateNotificationCount (${notificationUnreadCount}) to user ${userId}`);

        } catch (error) {
            console.error(`SocketService: Error emitting notification updates for user ${userId}:`, error);
        }
    },

};
