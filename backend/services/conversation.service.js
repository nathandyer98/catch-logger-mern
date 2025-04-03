import ConversationRepository from "../repository/conversation.repository.js";
import UserRepository from "../repository/user.repository.js";
import { AuthenticationError, NotFoundError, ServiceError } from '../errors/applicationErrors.js';

export const getAllConversationsForUser = async (userId) => {
    try {
        const conversations = await ConversationRepository.getConversations(userId);
        return conversations;
    } catch (error) {
        console.log("Error fetching conversations in repository:", error);
        throw new ServiceError("Failed to fetch conversations due to a service issue.");
    }
}

export const getConversationById = async (conversationId, userId) => {
    try {
        const conversation = await await authoriseAndValidateConversation(conversationId, userId);
        return conversation;
    } catch (error) {
        console.log("Error fetching conversation in repository:", error);
        throw new ServiceError("Failed to fetch conversation due to a service issue.");
    }
}

export const createConversation = async (currentUserId, participants) => {
    const conversationType = participants.length === 1 ? "Direct" : "Group";

    const participantVerification = UserRepository.checkUsersExist(participants);

    if (!participantVerification) throw new NotFoundError("One or more participants not found");

    try {
        if (conversationType === "Direct") {
            const existingConversation = await ConversationRepository.findDirectConversation(currentUserId, participants[0]);
            if (existingConversation) {
                await ConversationRepository.addParticipantToDirectConversation(existingConversation._id, currentUserId);
                return existingConversation;
            } else {
                const newConversation = await ConversationRepository.createDirectConversation(currentUserId, participants[0]);
                return newConversation;
            }
        }
        if (conversationType === "Group") {
            const allParticipants = Array.from(new Set([...participants, currentUserId]));
            const newConversation = await ConversationRepository.createGroupConversation(allParticipants);
            return newConversation;
        }
    } catch (error) {
        console.log("Error creating conversation in repository:", error);
        throw new ServiceError("Failed to create conversation due to a service issue.");
    }

}

export const deleteConversation = async (conversationId, userId) => {
    const conversationToUpdate = await authoriseAndValidateConversation(conversationId, userId);

    try {
        if (conversationToUpdate.type === "Direct") {
            await ConversationRepository.removeParticipantFromDirectConversation(conversationId, userId);
            return "Direct conversation removed successfully";
        } else if (conversationToUpdate.type === "Group" && conversationToUpdate.participants.length > 1) {
            await ConversationRepository.removeParticipantFromGroupConversation(conversationId, userId);
            return "You have left the group conversation successfully";
        } else if (conversationToUpdate.type === "Group" && conversationToUpdate.participants.length === 1) {
            await ConversationRepository.deleteConversation(conversationId);
            return "Group Conversation deleted successfully";
        }
    } catch (error) {
        console.log("Error deleting conversation in repository:", error);
        throw new ServiceError("Failed to delete conversation due to a service issue.");
    }
}

export const authoriseAndValidateConversation = async (conversationId, userId) => {
    try {
        const isUserInConversation = await ConversationRepository.isUserPartOfConversation(conversationId, userId);

        if (!isUserInConversation) {
            const conversationExists = await ConversationRepository.doesGroupConversationExistById(conversationId);
            if (!conversationExists) {
                throw new NotFoundError("Conversation not found.");
            } else {
                throw new AuthenticationError("Unauthorized.");
            }
        }
        const conversation = await ConversationRepository.getConversationById(conversationId);
        if (!conversation) throw new NotFoundError("Conversation not found.");

        return conversation;
    } catch (error) {
        console.log("Error authorising and validating conversation:", error);
        if (error instanceof AuthenticationError || error instanceof NotFoundError) {
            throw error;
        }
        throw new ServiceError("Failed to authorize conversation due to a service issue.");
    }

}

export const recordNewMessageActivity = async (conversationId, newMessage) => {
    const conversation = await ConversationRepository.getConversationFields(conversationId, ['type', 'participants']);
    if (!conversation) throw new NotFoundError("Conversation not found.");

    let updatePayload = {
        lastMessage: newMessage._id,
        lastMessageAt: newMessage.createdAt || new Date(),
        $addToSet: {}
    };

    if (conversation.type === "Direct") {
        const participantIds = conversation.participants.map(p => typeof p === 'object' ? p._id : p);
        updatePayload.$addToSet.accessedBy = participantIds;
    }

    if (Object.keys(updatePayload.$addToSet).length === 0) {
        delete updatePayload.$addToSet;
    }

    if (Object.keys(updatePayload).length > 0) {
        await ConversationRepository.updateConversation(conversationId, updatePayload);
    }
}