import Message from "../models/message.model.js";

class MessageRepository {

    /**
     * Get Messages for a given conversation by ID
     * @param {string} conversationId - The ID of the conversation
     * @returns {Promise<Array<object>} - An array of message plain message objects
     */
    async getMessagesByConversationId(conversationId) {
        return Message.find({ conversationId }).lean();
    }

    /**
     * Get Unread Messages Count for a user in given conversation by userID and conversationID
     * @param {string} userId - The ID of the user
     * @param {string} conversationId - The ID of the conversation
     * @returns {Promise<number>} - The number of unread messages for the user in the conversation.
     */
    async getUnreadMessagesCount(conversationId, userId) {
        return Message.countDocuments({ conversationId, readyBy: { $ne: userId } });
    }

    /**
     * Add User to readyBy field for an array of messages by ID
     * @param {array<string>} messageIds - The IDs of the messages
     * @param {string} userId - The ID of the user
     * @returns {Promise<void>} - A promise that resolves when the message is updated.
     */
    async markMessagesAsRead(messagesId, userId) {
        return Message.updateMany({ _id: { $in: messagesId } }, { $addToSet: { readyBy: userId } });
    }

    /**
     * Add User to readyBy field for all message in a conversation by userID and conversationID
     * @param {string} userId - The ID of the user
     * @param {string} conversationId - The ID of the conversation
     * @returns {Promise<void>} - A promise that resolves when the message is updated.
     */
    async markAllMessagesAsRead(conversationId, userId) {
        return Message.updateMany({ conversationId }, { $addToSet: { readyBy: userId } });
    }

    /**
     * Create a message
     * @param {object} messageData - The message object
     * @returns {Promise<object>} - The newly created message object as a plain object
     */
    async createMessage(messageData) {
        const newMessage = new Message(messageData);
        await newMessage.save();
        const messageObject = newMessage.toObject();
        return messageObject;
    }
}

export default new MessageRepository();