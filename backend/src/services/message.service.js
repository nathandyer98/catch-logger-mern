import MessageRepository from "../repository/message.repository.js";
import * as ConversationService from "./conversation.service.js";
import { SocketService } from "./socket.service.js";
import cloudinary from "../lib/cloudinary.js";
import {
    ServiceError,
    UserInputError,
    AuthenticationError,
    NotFoundError
} from '../errors/applicationErrors.js';
import eventBus from '../utils/eventBus.js';

export const getMessagesForAConversation = async (conversationId, userId) => {
    await ConversationService.authoriseAndValidateConversation(conversationId, userId);
    let messages = await MessageRepository.getMessagesByConversationId(conversationId);

    //Updating the read status of messages
    const unreadMessageCount = await MessageRepository.getUnreadMessagesCount(conversationId, userId);
    if (unreadMessageCount > 0) {
        try {
            console.log("Marking messages as read... For user:", userId.toString(), "in conversation:", conversationId);
            await MessageRepository.markMessagesAsRead(messages.map(message => message._id), userId);
            //Updating messages in memory
            messages = messages.map(message => {
                const updatedReadBy = Array.from(new Set([...message.readBy.map(user => user.toString()), userId.toString()]));
                return { ...message, readBy: updatedReadBy };
            });
        } catch (error) {
            console.error("Failed to mark messages as read:", error);
        }
    }
    return messages;
}

export const sendMessage = async (conversationId, userId, messageData) => {
    await ConversationService.authoriseAndValidateConversation(conversationId, userId);

    let imageUrl = null;
    if (messageData.image) {
        try {
            console.log("Trying to upload message image...");
            const uploadedResponse = await cloudinary.uploader.upload(messageData.image, { folder: "messages" });
            console.log("Cloudinary upload successful.");
            imageUrl = uploadedResponse.secure_url;
            messageData = { ...messageData, image: imageUrl };
        } catch (uploadError) {
            console.error("Cloudinary upload failed:", uploadError);
            throw new ServiceError("Failed to upload message image."); // Or handle differently
        }
    }
    const messagePayload = {
        ...messageData,
        from: userId,
        conversationId,
        readBy: [userId],
    };

    const newMessage = await MessageRepository.createMessage(messagePayload);
    if (newMessage) {
        try {
            eventBus.emit('message:created', { message: newMessage });
            console.log(`Message created and event emitted: ${newMessage._id}`);
            await ConversationService.recordNewMessageActivity(conversationId, newMessage);
        } catch (conversationUpdateError) {
            console.warn(`NON-CRITICAL: Failed to update conversation ${conversationId} after new message ${newMessage._id}. Needs reconciliation. Error:`, conversationUpdateError);
        }
    }
    return newMessage
}

export const authoriseAndValidateMessageOwner = async (conversationID, messageId, userId) => {
    const message = await MessageRepository.findMessageById(conversationID, messageId);
    if (!message) throw new NotFoundError("Message not found.");
    if (message.from.toString() !== userId.toString()) throw new AuthenticationError("Unauthorized - User is not authorized to update this message.");
    return message;
}

export const editMessage = async (conversationId, messageId, userId, messageData) => {
    const message = await authoriseAndValidateMessageOwner(conversationId, messageId, userId);
    const { text, image } = messageData;
    const updatePayload = {}

    if (text?.trim()) {
        updatePayload.text = text.trim();
    }

    if (image) {
        try {
            if (message.image) {
                try {
                    console.log("Trying to delete message image:", message.image);
                    await cloudinary.uploader.destroy(`messages/${messageData.photo.split('/').pop().split('.')[0]}`);
                    console.log("Cloudinary delete successful.");
                } catch (deleteError) {
                    console.warn("Cloudinary delete failed (non-critical):", deleteError);
                }
            }
            const uploadedResponse = await cloudinary.uploader.upload(messageData.image, { folder: "messages" });
            updatePayload.image = uploadedResponse.secure_url;
        } catch (uploadError) {
            console.error("Cloudinary upload failed:", uploadError);
            throw new ServiceError("Failed to upload message image.");
        }
    }
    if (Object.keys(updatePayload).length === 0) {
        throw new UserInputError("No valid data provided to update.");
    }

    const updatedMessage = await MessageRepository.editMessageById(conversationId, messageId, updatePayload);
    return updatedMessage;
}

export const deleteMessage = async (conversationId, messageId, userId) => {
    const message = await authoriseAndValidateMessageOwner(conversationId, messageId, userId);
    await MessageRepository.deleteMessageById(messageId);

    if (message.image) {
        try {
            console.log("Trying to delete message image:", message.image);
            await cloudinary.uploader.destroy(`messages/${message.image.split('/').pop().split('.')[0]}`);
            console.log("Cloudinary delete successful.");
        }
        catch (deleteError) {
            console.warn("Cloudinary delete failed (non-critical):", deleteError);
        }
    }
    return true;
}

export const readMessage = async (conversationId, userId, messageId) => {
    await ConversationService.authoriseAndValidateConversation(conversationId, userId);
    const message = await MessageRepository.findMessageById(conversationId, messageId);
    if (!message) throw new NotFoundError("Message not found.");
    await MessageRepository.markMessageAsRead(messageId, userId);

    // Calculate and Emit the newly updated unread count
    try {
        const newUnreadCount = await MessageRepository.getUnreadMessagesCount(conversationId, userId);
        await SocketService.notifyUserOfUnreadMessagesCountInConversation(conversationId, userId, newUnreadCount);
    } catch (countError) {
        console.error(`Error calculating/emitting unread count after marking read for User ${userId} in Conv ${conversationId}:`, countError);
    }
    return true;
}