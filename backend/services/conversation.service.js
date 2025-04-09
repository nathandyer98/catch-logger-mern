import ConversationRepository from "../repository/conversation.repository.js";
import UserRepository from "../repository/user.repository.js";
import MessageRepository from "../repository/message.repository.js";
import { AuthenticationError, NotFoundError, ServiceError } from '../errors/applicationErrors.js';
import eventBus from "../src/eventBus.js";

export const getAllConversationsForUser = async (userId) => {
    try {
        const conversations = await ConversationRepository.getConversations(userId);
        const conversationsWithUnreadMessagesCount = await Promise.all(conversations.map(async (conversation) => {
            const unreadMessagesCount = await MessageRepository.getUnreadMessagesCount(conversation._id, userId);
            return {
                ...conversation,
                unreadMessagesCount: unreadMessagesCount
            }
        }));

        return conversationsWithUnreadMessagesCount;
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
                await ConversationRepository.addParticipantToConversation(existingConversation._id, currentUserId);
                return existingConversation;
            } else {
                const newConversation = await ConversationRepository.createDirectConversation(currentUserId, participants[0]);
                return newConversation;
            }
        }
        if (conversationType === "Group") {
            const allParticipants = Array.from(new Set([...participants, currentUserId]));
            const newConversation = await ConversationRepository.createGroupConversation(allParticipants);

            if (newConversation) {
                eventBus.emit('groupConversation:created', { conversation: newConversation });
                console.log(`Group Conversation created and event emitted: ${newConversation._id}`);
            } else {
                console.warn("ConversationService: createGroupConversation did not return a conversation.");
            }
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
            await ConversationRepository.removeParticipantFromConversation(conversationId, userId);
            return "Direct conversation removed successfully";
        } else if (conversationToUpdate.type === "Group" && conversationToUpdate.participants.length > 1) {
            await ConversationRepository.removeParticipantFromConversation(conversationId, userId);
            const updatedConversation = await ConversationRepository.getConversationById(conversationId);

            if (updatedConversation) {
                eventBus.emit('conversation:updated', { conversation: updatedConversation });
                console.log(`Conversation updated and event emitted: ${updatedConversation._id}`);
            } else {
                console.warn("ConversationService: updateConversation did not return a conversation.");
            }
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
        const updatedConversation = await ConversationRepository.updateConversation(conversationId, updatePayload);

        if (updatedConversation) {
            eventBus.emit('conversation:updated', { conversation: updatedConversation });
            console.log(`Conversation updated and event emitted: ${updatedConversation._id}`);
        } else {
            console.warn("ConversationService: updateConversation did not return a conversation.");
        }
    }
}