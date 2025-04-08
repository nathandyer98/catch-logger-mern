import MessageRepository from "../repository/message.repository.js";
import * as ConversationService from "./conversation.service.js";
import { SocketService } from "../services/socket.service.js";
import cloudinary from "../lib/cloudinary.js";
import {
    ServiceError,
    UserInputError,
    AuthenticationError,
    NotFoundError
} from '../errors/applicationErrors.js';
import eventBus from "../src/eventBus.js";

export const getMessagesForAConversation = async (conversationId, userId) => {
    await ConversationService.authoriseAndValidateConversation(conversationId, userId);

    try {
        const messages = await MessageRepository.getMessagesByConversationId(conversationId);

        //Updating the read status of messages
        const unreadMessageCount = await MessageRepository.getUnreadMessagesCount(conversationId, userId);
        if (unreadMessageCount > 0) await MessageRepository.markMessagesAsRead(messages.map(message => message._id), userId);

        return messages;
    } catch (error) {
        console.log("Error in getMessagesForAConversation: " + error);
        throw new ServiceError("Failed to get messages due to a service issue.");
    }
}

export const readMessage = async (conversationId, userId, messageId) => {
    await ConversationService.authoriseAndValidateConversation(conversationId, userId);
    try {
        const message = await MessageRepository.findMessageById(conversationId, messageId);
        if (!message) throw new NotFoundError("Message not found.");
        try {
            await MessageRepository.markMessageAsRead(messageId, userId);

            // Calculate and Emit the newly updated unread count
            try {
                const newUnreadCount = await MessageRepository.getUnreadMessagesCount(conversationId, userId);
                await SocketService.notifyUserOfUnreadMessagesCountInConversation(conversationId, userId, newUnreadCount);
            } catch (countError) {
                console.error(`Error calculating/emitting unread count after marking read for User ${userId} in Conv ${conversationId}:`, countError);
            }

        } catch (error) {
            console.log("Error in readMessages: " + error);
            throw new ServiceError("Failed to mark messages as read due to a service issue.");
        }
    } catch (error) {
        console.log("Error in readMessages: " + error);
        if (error instanceof NotFoundError) {
            throw error;
        }
        throw new ServiceError("Failed to mark messages as read due to a service issue.");
    }
}

export const sendMessage = async (conversationId, userId, messageData) => {
    await ConversationService.authoriseAndValidateConversation(conversationId, userId);

    let imageUrl = null;
    if (messageData.image) {
        try {
            const uploadedResponse = await cloudinary.uploader.upload(messageData.image, { folder: "messages" });
            imageUrl = uploadedResponse.secure_url;
        } catch (uploadError) {
            console.error("Cloudinary upload failed:", uploadError);
            throw new ServiceError("Failed to upload message image."); // Or handle differently
        }
    }
    const messagePayload = {
        ...messageData,
        from: userId,
        conversationId,
        image: imageUrl,
        readBy: [userId],
    };
    try {
        const newMessage = await MessageRepository.createMessage(messagePayload);
        if (newMessage) {
            eventBus.emit('message:created', { message: newMessage });
            console.log(`Message created and event emitted: ${newMessage._id}`);
        } else {
            console.warn("MessageService: createMessage did not return a message.");
        }
        try {
            await ConversationService.recordNewMessageActivity(conversationId, newMessage);
        } catch (conversationUpdateError) {
            console.error(`CRITICAL: Failed to update conversation ${conversationId} after new message ${newMessage._id}. Needs reconciliation. Error:`, conversationUpdateError);
        }
        return newMessage
    } catch (error) {
        console.log("Error in sendMessage: " + error);
        throw new ServiceError("Failed to send message due to a service issue.");
    }
}

export const authoriseAndValidateMessageOwner = async (conversationID, messageId, userId) => {
    try {
        const message = await MessageRepository.findMessageById(messageId, conversationID);
        if (!message) throw new NotFoundError("Message not found.");
        if (message.from !== userId) throw new AuthenticationError("Unauthorized.");
        return message;
    } catch (error) {
        console.log("Error authorising and validating message:", error);
        if (error instanceof AuthenticationError || error instanceof NotFoundError) {
            throw error;
        }
        throw new ServiceError("Failed to authorise message due to a service issue.");
    }
}

export const editMessage = async (conversationId, messageId, userId, messageData) => {
    const message = await authoriseAndValidateMessageOwner(conversationId, messageId, userId);
    const { text, image } = messageData;
    const updatePayload = {}

    if (text?.trim()) {
        updatePayload.text = text.trim();
    }
    let imageUrl = null;

    if (messageData.image) {
        try {
            if (message.image) {
                try {
                    await cloudinary.uploader.destroy(message.image.split('/').pop().split('.')[0]);
                } catch (error) {
                    console.warn("Cloudinary delete failed:", error);
                }
            }
            const uploadedResponse = await cloudinary.uploader.upload(messageData.image, { folder: "messages" });
            imageUrl = uploadedResponse.secure_url;
            updatePayload.image = imageUrl;
        } catch (uploadError) {
            console.error("Cloudinary upload failed:", uploadError);
            throw new ServiceError("Failed to upload message image."); // Or handle differently
        }
    }
    if (Object.keys(updatePayload).length === 0) {
        throw new UserInputError("No valid data provided to update.");
    }

    try {
        const updatedMessage = await MessageRepository.editMessageById(conversationId, messageId, updatePayload);
        return updatedMessage;
    } catch (error) {
        console.log("Error in editMessage: " + error);
        throw new ServiceError("Failed to edit message due to a service issue.");
    }
}

export const deleteMessage = async (messageId, userId) => {
    const message = await authoriseAndValidateMessageOwner(messageId, userId);
    try {
        await MessageRepository.deleteMessageById(messageId);
        if (message.image) {
            try {
                await cloudinary.uploader.destroy(message.image.split('/').pop().split('.')[0]);
            }
            catch (error) {
                console.warn("Cloudinary delete failed:", error);
            }
        }
        return true;
    } catch (error) {
        console.log("Error in deleteMessage: " + error);
        throw new ServiceError("Failed to delete message due to a service issue.");
    }
}


