import { ServiceError } from '../errors/applicationErrors.js';

let ioInstance;

export const SocketService = {
    initialize: (io) => {
        if (ioInstance) {
            console.warn("SocketService already initialized.");
            return;
        }
        ioInstance = io;
        console.log("SocketService initialized.");
    },

    notifyUserOfNotification: async (userId, notificationData, unreadNotificationCount) => {
        if (!ioInstance) console.error("SocketService has not been initialized.");
        if (!userId || !notificationData || typeof unreadNotificationCount === 'undefined') {
            throw new ServiceError(`SocketService: Invalid data received. User: ${userId}, NotifID: ${notificationData?._id}, Count: ${unreadCount}`);
        }
        try {
            const userRoom = userId.toString();

            ioInstance.to(userRoom).emit('newNotification', notificationData);
            console.log(`SocketService: Emitted newNotification ${notificationData?._id} to user ${userId}`);

            ioInstance.to(userRoom).emit('updatedNotificationCount', unreadNotificationCount);
            console.log(`SocketService: Emitted updatedNotificationCount (${unreadNotificationCount}) to user ${userId}`);

        } catch (error) {
            console.error(`SocketService: Error emitting notification updates for user ${userId}:`, error);
        }
    },

    notifyUserOfNewGroupConversation: async (participantIds, populatedConversation) => {
        if (!ioInstance) return console.error("SocketService: IO not initialized.");
        if (!participantIds || !populatedConversation) {
            throw new ServiceError(`SocketService: Invalid data received. Participants: ${participantIds}, Conversation: ${populatedConversation}`);
        }
        try {
            participantIds.forEach(participantId => {
                ioInstance.to(participantId).emit('newGroupConversation', populatedConversation);
                console.log(`SocketService: Emitted newGroupConversation ${populatedConversation._id} to user ${participantId}`);
            });
        } catch (error) {
            console.error(`SocketService: Error emitting newGroupConversation for participants ${participantIds}:`, error);
        }
    },

    notifyConversationUpdate: async (participantIds, populatedConversation) => {
        if (!ioInstance) return console.error("SocketService: IO not initialized.");
        if (!participantIds || !populatedConversation) {
            throw new ServiceError(`SocketService: Invalid data received. Participants: ${participantIds}, Conversation: ${populatedConversation}`);
        }
        try {
            participantIds.forEach(participantId => {
                ioInstance.to(participantId).emit('updatedConversation', populatedConversation);
                console.log(`SocketService: Emitted updateConversations ${populatedConversation._id} to user ${participantId}`);
            });
        } catch (error) {
            console.error(`SocketService: Error emitting updateConversations for participants ${participantIds}:`, error);
        }
    },

    notifyConversationRoomOfNewMessage: async (conversationId, message) => {
        if (!ioInstance) return console.error("SocketService: IO not initialized.");
        if (!conversationId || !message) {
            throw new ServiceError(`SocketService: Invalid data received. Conversation: ${conversationId}, Message: ${message}`);
        }
        const roomName = `conversation:${conversationId}`;
        try {
            ioInstance.to(roomName).emit('newMessage', message);
            console.log(`SocketService: Emitted newMessage ${message._id} to conversation ${conversationId}`);
        } catch (error) {
            console.error(`SocketService: Error emitting newMessage for conversation ${conversationId}:`, error);
        }
    },

    notifyUserOfUnreadMessagesCountInConversation: async (conversationId, participantId, unreadMessagesCount) => {
        if (!ioInstance) return console.error("SocketService: IO not initialized.");
        if (!conversationId || !participantId || typeof unreadMessagesCount === 'undefined') {
            throw new ServiceError(`SocketService: Invalid data received. Conversation: ${conversationId}, Participant: ${participantId}, Count: ${unreadMessagesCount}`);
        }
        try {
            ioInstance.to(participantId).emit('updatedUnreadMessagesCount', { conversationId, unreadMessagesCount });
            console.log(`SocketService: Emitted updatedUnreadMessagesCount (${conversationId}, ${unreadMessagesCount}) to user ${participantId}`);
        } catch (error) {
            console.error(`SocketService: Error emitting updatedUnreadMessagesCount for user ${participantId}:`, error);
        }
    },
};
