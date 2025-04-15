import Conversation from "../models/conversation.model.js";

class ConversationRepository {

    // Populate options
    participantPopulate = { path: "participants", select: "username fullName profilePic" };
    lastMessagePopulate = {
        path: "lastMessage", select: "_id from text createdAt",
        populate: { path: "from", select: "username fullname profilePic" }
    };

    /**
     * Get all conversations for a user. 
     * (All conversations where the user is accessedBy)
     * @param {string} userId - The ID of the user
     * @returns {Promise<Array<object>} - A sorted array at of plain conversation objects 
     * Sorted on the the most recent last message or updated at
     * Contains the conversation details, including the all the participants's fullname, username and profile picture 
     * And the last message details, including the user's fullname, username and profile picture or null if there is no last message
     * Returns an empty array ([]) if no conversations are foundf for the user.
     */
    async getConversations(userId) {
        return Conversation.find({ accessedBy: userId })
            .populate(this.participantPopulate)
            .populate(this.lastMessagePopulate)
            .sort({ lastMessageAt: -1, updatedAt: -1 })
            .lean();
    }

    /**
     * Get a conversation by ID
     * @param {string} conversationId - The ID of the conversation
     * @returns {Promise<object>} - A plain conversation object 
     * Contains the conversation details, including the all the participants's fullname, username and profile picture 
     * And the last message details, including the user's fullname, username and profile picture or null if there is no last message
     * Returns null if no conversation is found for the ID.
     */
    async getConversationById(conversationId) {
        return Conversation.findById(conversationId)
            .populate(this.participantPopulate)
            .populate(this.lastMessagePopulate)
            .lean();
    }

    /**
     * Create a direct conversation
     * @param {string} user1Id - The ID of the first user
     * @param {string} user2Id - The ID of the second user
     * @returns {Promise<object>} - The new conversation object as a plain object. 
     * Contains the conversation details, including the all the participants's fullname, username and profile picture 
     */
    async createDirectConversation(user1Id, user2Id) {
        const conversation = new Conversation({
            type: "Direct",
            participants: [user1Id, user2Id],
            accessedBy: [user1Id] // The first user is automatically added accessBy, which controls who can see direct conversations.
        });
        await conversation.save()
        const populatedConversation = this.getConversationById(conversation._id);
        return populatedConversation
    }

    /**
     * Create a group conversation
     * @param {Array<string>} participants - The IDs of the participants
     * @returns {Promise<object>} - The new conversation object as a plain object 
     * Contains the conversation details, including the all the participants's fullname, username and profile picture
     */
    async createGroupConversation(participants) {
        const conversation = new Conversation({ type: "Group", participants, accessedBy: participants });
        await conversation.save()
        const populatedConversation = this.getConversationById(conversation._id);
        return populatedConversation
    }

    /** 
     * Does direct conversation exist for the users
     * @param {string} user1Id - The ID of the first user
     * @param {string} user2Id - The ID of the second user
     * @returns {Promise<boolean>} - True if a direct conversation exists between the users, false otherwise
     */
    async doesDirectConversationExist(user1Id, user2Id) {
        const conversation = await Conversation.findOne({ type: "Direct", participants: { $all: [user1Id, user2Id] } });
        return conversation !== null;
    }
    /**
     * Does coversation exist for the ID
     * @param {string} consversationId - The ID of the conversation
     * @returns {Promise<boolean>} - True if a conversation exists for the ID, false otherwise
     */
    async doesGroupConversationExistById(consversationId) {
        const conversation = await Conversation.findById(consversationId);
        return conversation !== null;
    }

    /**
     * Find exisiting direct conversation between the users
     * @param {string} user1Id - The ID of the first user
     * @param {string} user2Id - The ID of the second user
     * @returns {Promise<object>} - A plain conversation object 
     * Contains the conversation details, including the user's fullname, username and profile picture 
     * And the last message details, including the user's fullname, username and profile picture or null if there is no last message
     */
    async findDirectConversation(user1Id, user2Id) {
        return Conversation.findOne({ type: "Direct", participants: { $all: [user1Id, user2Id] } })
            .populate(this.participantPopulate)
            .populate(this.lastMessagePopulate)
            .lean();
    }

    /**
     * Add user to exising direct conversation, so they can see the direct conversation
     * @param {string} conversationId - The ID of the conversation
     * @param {string} userId - The ID of the user
     * @returns {Promise<object>} - A plain conversation object, but with the user added to accessedBy
     */
    async addParticipantToConversation(conversationId, userId) {
        return Conversation.findByIdAndUpdate(conversationId,
            { $addToSet: { accessedBy: userId } },
            { new: true })
            .populate(this.participantPopulate)
            .populate(this.lastMessagePopulate)
            .lean();
    }

    /**
     * Remove user from exising conversation, so they can no longer see the conversation.
     * @param {string} conversationId - The ID of the conversation
     * @param {string} userId - The ID of the user
     * @returns {Promise<object>} - A plain conversation object, but with the user removed from accessedBy
     */
    async removeParticipantFromConversation(conversationId, userId) {
        return Conversation.findByIdAndUpdate(conversationId, { $pull: { accessedBy: userId } }, { new: true }).lean();
    }

    /**
    * Remove user from existing group conversation, so they can no longer see the group conversation
    * @param {string} conversationId - The ID of the conversation
    * @param {string} userId - The ID of the user
    * @returns {Promise<object>} - A plain conversation object, but with the user removed from participants  
     */
    async removeParticipantFromGroupConversation(conversationId, userId) {
        return Conversation.findByIdAndUpdate(conversationId, { $pull: { participants: userId } }, { new: true }).lean();
    }

    /**
     * Delete a conversation by ID
     * @param {string} conversationId - The ID of the conversation
     * @returns {Promise<void>} - A promise that resolves when the conversation is deleted
     */
    async deleteConversation(conversationId) {
        return Conversation.findByIdAndDelete(conversationId);
    }

    /**
     * Update a conversation by ID
     * @param {string} conversationId - The ID of the conversation
     * @param {object} updatePayload - The ID of the message
     * @returns {Promise<object>} - A the updated conversation object as a plain object 
     * Contains the conversation details, including the all the participants's fullname, username and profile picture
     * And the last message details, including the user's fullname, username and profile picture or null if there is no last message
     */
    async updateConversation(conversationId, updatePayload) {
        return Conversation.findByIdAndUpdate(conversationId, updatePayload, { new: true, runValidators: true })
            .populate(this.participantPopulate)
            .populate(this.lastMessagePopulate)
            .lean();
    }

    /**
     * Is user apart of the conversation
     * @param {string} conversationId - The ID of the conversation
     * @param {string} userId - The ID of the user
     * @returns {Promise<boolean>} - True if the user is apart of the conversation, false otherwise
     */
    async isUserPartOfConversation(conversationId, userId) {
        const conversation = await Conversation.findOne({ _id: conversationId, accessedBy: userId });
        return conversation !== null;
    }

    /**
     * Get conversation with specified fields
     * @param {string} conversationId - The ID of the conversation
     * @param {Array<String>} fields - The fields to select
     * @returns {Promise<object>} - A plain conversation object with the specified fields
     */
    async getConversationFields(conversationId, fields) {
        return Conversation.findById(conversationId).select(fields).lean();
    }
}

export default new ConversationRepository();