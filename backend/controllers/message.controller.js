import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import Conversation from "../models/conversation.model.js";
import Notification from "../models/notification.model.js";

import cloudinary from "../lib/cloudinary.js";

export const getMessages = async (req, res) => {
    const userId = req.user._id
    const { id: conversationId } = req.params
    try {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        const isUserInConversation = await Conversation.findOne({ _id: conversationId, participants: userId, });

        if (!isUserInConversation) {
            return res.status(403).json({ message: "Unauthorized access" });
        }

        const messages = await Message.find({ conversationId: conversationId });

        res.status(200).json(messages);
    } catch (error) {
        console.log("Error in getConversations controller: " + error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export const sendMessage = async (req, res) => {
    const { text, image } = req.body;
    const { id: conversationId } = req.params;
    const userId = req.user._id;
    try {
        if (!text && !image) return res.status(400).json({ message: 'Please enter text or image' });

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        const isUserInConversation = conversation.participants.map(id => id.toString()).includes(userId.toString());
        if (!isUserInConversation) {
            return res.status(403).json({ message: "Unauthorized access" });
        }

        let imageUrl
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = await Message.create({
            conversationId,
            from: userId,
            text,
            image: imageUrl
        });

        const updateFields = {
            lastMessage: newMessage._id,
            lastMessageAt: newMessage.createdAt || new Date(),
        };

        if (conversation.type === "Direct" && conversation.lastMessage === null) {
            updateFields.$addToSet = { accessedBy: { $each: conversation.participants } };
        }

        await Conversation.findByIdAndUpdate(conversationId, updateFields, { new: true, runValidators: true });

        res.status(200).json(newMessage);
    } catch (error) {
        console.log("Error in sendMessage controller: " + error);
        res.status(500).json({ message: 'Internal server error' });
    }
}
