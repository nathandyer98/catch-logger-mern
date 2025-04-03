import MessageRepository from "../repository/message.repository.js";
import * as ConversationService from "./conversation.service.js";
import cloudinary from "../lib/cloudinary.js";
import {
    ServiceError
} from '../errors/applicationErrors.js';

export const getMessagesForAConversation = async (conversationId, userId) => {
    await ConversationService.authoriseAndValidateConversation(conversationId, userId);

    try {
        const messages = await MessageRepository.getMessagesByConversationId(conversationId);
        const unreadMessageCount = await MessageRepository.getUnreadMessagesCount(conversationId, userId);
        if (unreadMessageCount > 0) await MessageRepository.markMessagesAsRead(messages.map(message => message._id), userId);
        return messages;
    } catch (error) {
        console.log("Error in getMessagesForAConversation: " + error);
        throw new ServiceError("Failed to get messages due to a service issue.");
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
        image: imageUrl
    };
    try {
        const newMessage = await MessageRepository.createMessage(messagePayload);
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


