import eventBus from '../eventBus.js';
import NotificationRepository from "../../repository/notification.repository.js";
import MessageRepository from '../../repository/message.repository.js';
import { SocketService } from "../../services/socket.service.js";
import { NotFoundError } from '../../errors/applicationErrors.js';

export const initializeRealtimeListeners = () => {

    eventBus.on('notification:created', async ({ notification }) => {
        if (!notification || !notification.to) {
            console.error("RealtimeListener: Received invalid notification:created event data.");
            return;
        }
        const recipientId = notification.to.toString();
        const newNotificationId = notification._id.toString();
        try {
            const populatedNotification = await NotificationRepository.getNotificationById(newNotificationId);
            if (!populatedNotification) {
                throw new NotFoundError("Notification not found");
            }
            const notificationUnreadCount = await NotificationRepository.getNotificationsCount(recipientId) || 0;
            await SocketService.notifyUserOfNotification(recipientId, populatedNotification, notificationUnreadCount);
        } catch (error) {
            console.error(`RealtimeListener: Error processing notification:created event for Recipient ${recipientId}:`, error);
        }
    });

    eventBus.on('groupConversation:created', async ({ conversation }) => {
        if (!conversation || !conversation._id) {
            console.error("RealtimeListener: Received invalid conversation:created event data.");
            return;
        }
        const conversationId = conversation._id.toString();
        const participantIds = conversation.participants.map(participant => participant._id.toString());
        try {
            await SocketService.notifyUserOfNewGroupConversation(participantIds, conversation);
        } catch (error) {
            console.error(`RealtimeListener: Error processing conversation:created event for Conversation ${conversationId}:`, error);
        }
    });

    eventBus.on('conversation:updated', async ({ conversation }) => {
        if (!conversation || !conversation._id) {
            console.error("RealtimeListener: Received invalid conversation:updated event data.");
            return;
        }
        const conversationId = conversation._id.toString();
        const participantIds = conversation.participants.map(participant => participant._id.toString());
        const senderId = conversation.lastMessage.from._id.toString();
        try {
            //Emit the updated conversation  recieved to all participants
            await SocketService.notifyConversationUpdate(participantIds, conversation);

            //Emit the unread message count to all participants except the sender
            const recipientIds = participantIds.filter(pid => pid !== senderId);
            for (const recipientId of recipientIds) {
                try {
                    const unreadMessageCount = await MessageRepository.getUnreadMessagesCount(conversationId, recipientId);
                    await SocketService.notifyUserOfUnreadMessagesCountInConversation(conversationId, recipientId, unreadMessageCount);
                } catch (error) {
                    console.error(`RealtimeListener: Error getting/sending unread count for User ${recipientId} in Conv ${conversationId}:`, error);
                }
            }
        } catch (error) {
            console.error(`RealtimeListener: Error processing conversation:updated event for Conversation ${conversationId}:`, error);
        }
    })

    eventBus.on('message:created', async ({ message }) => {
        console.log(message);
        if (!message || !message.conversationId) {
            console.error("RealtimeListener: Received invalid message:created event data.");
            return;
        }
        const conversationId = message.conversationId.toString();
        try {
            await SocketService.notifyConversationRoomOfNewMessage(conversationId, message);
        } catch (error) {
            console.error(`RealtimeListener: Error processing message:created event for Conversation ${conversationId}:`, error);
        }
    })
    console.log("Real-time event listeners initialized.");
};