import * as MessageService from "../services/message.service.js";
import { handleControllerError } from '../utils/errorHandler.js';

export const getMessages = async (req, res) => {
    const userId = req.user._id
    const { id: conversationId } = req.params
    try {
        const messages = await MessageService.getMessagesForAConversation(conversationId, userId);
        res.status(200).json(messages);
    } catch (error) {
        console.log("---Get Messages Controller Error---", error);
        handleControllerError(error, res)
    }
}

export const sendMessage = async (req, res) => {
    const { text, image } = req.body;
    const { id: conversationId } = req.params;
    const userId = req.user._id;
    if (!text && !image) return res.status(400).json({ message: 'Please enter text or image' });
    try {
        const newMessage = await MessageService.sendMessage(conversationId, userId, { text, image });
        res.status(200).json(newMessage);
    } catch (error) {
        console.log("---Send Messages Controller Error---", error);
        handleControllerError(error, res)
    }
}
