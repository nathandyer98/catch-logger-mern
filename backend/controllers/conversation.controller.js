import * as ConversationService from "../services/conversation.service.js"
import { handleControllerError } from '../utils/errorHandler.js';

export const getConversations = async (req, res) => {
    const userId = req.user._id
    try {
        const conversations = await ConversationService.getAllConversationsForUser(userId);
        res.status(200).json(conversations);
    } catch (error) {
        console.log("---Get Conversations Controller Error---", error);
        handleControllerError(error, res)
    }
}

export const getConversation = async (req, res) => {
    const { id } = req.params
    const userId = req.user._id
    try {
        const conversation = await ConversationService.getConversationById(id, userId);
        res.status(200).json(conversation);
    } catch (error) {
        console.log("---Get Conversation Controller Error---", error);
        handleControllerError(error, res)
    }
}

export const createConversation = async (req, res) => {
    const { participants } = req.body
    const userId = req.user._id
    if (!participants || participants.length === 0) return res.status(400).json({ message: "No participants provided." })

    const participantsIds = participants.map(participant => typeof participant === "string" ? participant : participant.toString())

    if (participants.length === 1 && participantsIds[0] === userId.toString()) return res.status(400).json({ message: "You cannot create a conversation with yourself." })

    try {
        const conversation = await ConversationService.createConversation(userId, participantsIds);
        res.status(201).json(conversation);
    } catch (error) {
        console.log("---Create Conversation Controller Error---", error);
        handleControllerError(error, res)
    }
}

export const deleteConversation = async (req, res) => {
    const { id } = req.params
    const userId = req.user._id
    try {
        const message = await ConversationService.deleteConversation(id, userId);
        res.status(200).json({ message });
    } catch (error) {
        console.log("---Delete Conversation Controller Error---", error);
        handleControllerError(error, res)
    }
}