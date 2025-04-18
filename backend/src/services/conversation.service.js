import ConversationRepository from "../repository/conversation.repository.js";
import UserRepository from "../repository/user.repository.js";
import MessageRepository from "../repository/message.repository.js";
import { AuthenticationError, NotFoundError, ServiceError } from '../errors/applicationErrors.js';
import eventBus from '../utils/eventBus.js';

export const getAllConversationsForUser = async (userId) => {
    const conversations = await ConversationRepository.getConversations(userId);

    if (conversations.length === 0) return [];

    const conversationsWithUnreadMessagesCount = await Promise.all(conversations.map(async (conversation) => {
        const unreadMessagesCount = await MessageRepository.getUnreadMessagesCount(conversation._id, userId);
        return {
            ...conversation,
            unreadMessagesCount: unreadMessagesCount
        }
    }));
    return conversationsWithUnreadMessagesCount;
}

export const getConversationById = async (conversationId, userId) => {
    const conversation = await await authoriseAndValidateConversation(conversationId, userId);
    return conversation;

}

export const createConversation = async (currentUserId, participants) => {
    const conversationType = participants.length === 1 ? "Direct" : "Group";

    const participantVerification = await UserRepository.checkUsersExist(participants);
    if (!participantVerification) throw new NotFoundError("One or more participants not found");

    if (conversationType === "Direct") {
        const existingConversation = await ConversationRepository.findDirectConversation(currentUserId, participants[0]);
        if (existingConversation) {
            const updatedConversation = await ConversationRepository.addParticipantToConversation(existingConversation._id, currentUserId);
            return updatedConversation;
        } else {
            const newConversation = await ConversationRepository.createDirectConversation(currentUserId, participants[0]);
            return newConversation;
        }
    }
    if (conversationType === "Group") {
        const allParticipants = Array.from(new Set([...participants, currentUserId]));
        const newConversation = await ConversationRepository.createGroupConversation(allParticipants);

        if (newConversation) {
            try {
                eventBus.emit('groupConversation:created', { conversation: newConversation });
                console.log(`Group Conversation created and event emitted: ${newConversation._id}`);
            } catch (error) {
                console.warn("Failed to emit groupConversation:created event (non-critical):", error);
            }

        } else {
            console.warn("ConversationService: createGroupConversation did not return a conversation.");
        }
        return newConversation;
    }

}

export const deleteConversation = async (conversationId, userId) => {
    const conversationToUpdate = await authoriseAndValidateConversation(conversationId, userId);

    if (conversationToUpdate.type === "Direct") {
        await ConversationRepository.removeParticipantFromConversation(conversationId, userId);
        return "Direct conversation removed successfully";
    } else if (conversationToUpdate.type === "Group" && conversationToUpdate.accessedBy.length > 1) {
        await ConversationRepository.removeParticipantFromConversation(conversationId, userId);
        const updatedConversation = await ConversationRepository.getConversationById(conversationId);

        if (updatedConversation) {
            try {
                eventBus.emit('conversation:updated', { conversation: updatedConversation });
                console.log(`Conversation updated and event emitted: ${updatedConversation._id}`);
            } catch (error) {
                console.warn("Failed to emit conversation:updated event (non-critical):", error);
            }
        } else {
            console.warn("ConversationService: updateConversation did not return a conversation.");
        }
        return "You have left the group conversation successfully.";
    } else if (conversationToUpdate.type === "Group" && conversationToUpdate.accessedBy.length === 1) {
        await ConversationRepository.deleteConversation(conversationId);
        return "Group conversation deleted successfully.";
    }

}

export const authoriseAndValidateConversation = async (conversationId, userId) => {
    const isUserInConversation = await ConversationRepository.isUserPartOfConversation(conversationId, userId);

    if (!isUserInConversation) {
        const conversationExists = await ConversationRepository.doesGroupConversationExistById(conversationId);
        if (!conversationExists) {
            throw new NotFoundError("Conversation not found.");
        } else {
            throw new AuthenticationError("Unauthorized - User is not authorized to access this conversation.");
        }
    }
    const conversation = await ConversationRepository.getConversationById(conversationId);
    if (!conversation) throw new NotFoundError("Conversation not found.");
    return conversation;
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
        const updatedConversation = await ConversationRepository.updateConversation(conversationId, updatePayload);

        if (updatedConversation) {
            try {
                eventBus.emit('conversation:updated', { conversation: updatedConversation });
                console.log(`Conversation updated and event emitted: ${updatedConversation._id}`);
            } catch (error) {
                console.warn("Failed to emit conversation:updated event (non-critical):", error);
            }

        } else {
            console.warn("ConversationService: updateConversation did not return a conversation.");
        }
    }
}