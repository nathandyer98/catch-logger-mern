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

export const editMessage = async (req, res) => {
    const { id: conversationId, messageId } = req.params;
    const userId = req.user._id;
    const { text, image } = req.body;
    if (!text && !image) return res.status(400).json({ message: "No updates provided" });

    try {
        const updatedMessage = await MessageService.editMessage(conversationId, messageId, userId, { text, image });
        res.status(200).json(updatedMessage);
    } catch (error) {
        console.log("---Edit Messages Controller Error---", error);
        handleControllerError(error, res)
    }
}

export const deleteMessage = async (req, res) => {
    const { id: conversationId, messageId } = req.params;
    const userId = req.user._id;
    try {
        await MessageService.deleteMessage(conversationId, messageId, userId);
        res.status(200).json({ message: 'Message deleted successfully' });
    } catch (error) {
        console.log("---Delete Messages Controller Error---", error);
        handleControllerError(error, res)
    }
}

export const readMessages = async (req, res) => {
    const userId = req.user._id;
    const { id: conversationId, messageIds } = req.params;
    console.log(req.params)
    // console.log("----------------------------------------------------------------------------------------")
    // console.log(id, messageIds)
    // console.log("----------------------------------------------------------------------------------------")
    try {
        await MessageService.readMessages(conversationId, userId, messageIds);
        res.status(200).json({ message: 'Messages read successfully' });
    } catch (error) {
        console.log("---Read Messages Controller Error---", error);
        handleControllerError(error, res)
    }
}