import Conversation from "../models/conversation.model.js";
import User from "../models/user.model.js";


export const getConversations = async (req, res) => {
    const userId = req.user._id
    try {
        const conversations = await Conversation.find({
            $or: [{ type: "Group", participants: userId }, { type: "Direct", accessedBy: userId }]
        })
            .select("-accessedBy")
            .populate("participants", "username fullname profilePic")
            .populate({
                path: "lastMessage",
                select: "_id from text createdAt",
                populate: {
                    path: "from",
                    select: "username fullname profilePic"
                }
            })
            .sort({ lastMessageAt: -1, updatedAt: -1 });

        const filteredConversations = conversations.map(conversation => ({
            ...conversation.toObject(),
            participants: conversation.participants.filter(participant => participant && participant._id.toString() !== userId.toString())
        }));

        res.status(200).json(filteredConversations);
    } catch (error) {
        console.log("Error in getConversations controller", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getConversation = async (req, res) => {
    const { id } = req.params
    const userId = req.user._id
    try {
        const conversation = await Conversation.findById(id)
        if (!conversation) return res.status(404).json({ message: "Conversation not found" })

        const isUserInConversation = conversation.participants.includes(userId)
        if (!isUserInConversation) return res.status(403).json({ message: "Unauthorized" })

        res.status(200).json(conversation);
    } catch (error) {
        console.log("Error in getConversation controller", error);
        res.status(500).json({ message: "Internal server error" });
    }
}


export const createConversation = async (req, res) => {
    const { participants } = req.body
    const userId = req.user._id
    try {
        if (!participants) return res.status(400).json({ message: "Participants are required" })

        if (participants.length === 1) {
            if (participants[0] === userId.toString()) {
                return res.status(400).json({ message: "You cannot create a conversation with yourself" });
            }

            const existingConversation = await Conversation.findOne({
                type: "Direct",
                participants: { $all: [userId, participants[0]] },
            });

            if (existingConversation) {
                await Conversation.findByIdAndUpdate(existingConversation._id, { $addToSet: { accessedBy: userId }, })

                const populatedConversation = await Conversation.findById(existingConversation._id).select("-accessedBy").populate("participants", "username fullname profilePic").populate({
                    path: "lastMessage",
                    select: "_id from text createdAt",
                    populate: {
                        path: "from",
                        select: "username fullname profilePic"
                    }
                });
                const filteredConversation = { ...populatedConversation.toObject(), participants: populatedConversation.participants.filter((participant) => participant._id.toString() !== userId.toString()) };

                return res.status(201).json(filteredConversation)
            } else {
                const direcetConversation = await Conversation.create({
                    participants: [userId, participants[0]],
                    accessedBy: [userId],
                    createdBy: userId,
                    type: "Direct"
                });

                const populatedConversation = await Conversation.findById(direcetConversation._id).select("-accessedBy").populate("participants", "username fullname profilePic");
                const filteredConversation = { ...populatedConversation.toObject(), participants: populatedConversation.participants.filter((participant) => participant._id.toString() !== userId.toString()) };

                return res.status(201).json(filteredConversation)
            }
        }
        const participantVerification = await Promise.all(participants.map(async (participant) => {
            const doesParticipantExist = await User.findById(participant)
            return doesParticipantExist ? true : false;
        }))

        if (!participantVerification.includes(true)) return res.status(404).json({ message: "One or more participants not found" })

        const allParticipants = Array.from(new Set([...participants, userId]));
        let type = allParticipants.length > 2 ? "Group" : "Direct";

        const conversation = await Conversation.create({
            participants: allParticipants,
            createdBy: userId,
            type: type
        })

        const populatedConversation = await Conversation.findById(conversation._id).select("-accessedBy").populate("participants", "username fullname profilePic");
        const filteredConversation = { ...populatedConversation.toObject(), participants: populatedConversation.participants.filter((participant) => participant._id.toString() !== userId.toString()) };

        res.status(201).json(filteredConversation);
    } catch (error) {
        console.log("Error in createConversation controller", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const deleteConversation = async (req, res) => {
    const { id } = req.params
    const userId = req.user._id
    try {
        const conversation = await Conversation.findById(id)
        if (!conversation) return res.status(404).json({ message: "Conversation not found" })

        const isUserInConversation = conversation.participants.some(participantId => participantId.equals(userId));
        if (!isUserInConversation) return res.status(403).json({ message: "Unauthorized" })

        if (conversation.type === "Direct") {
            await Conversation.findByIdAndUpdate(id, { $pull: { accessedBy: userId } })
        } else if (conversation.type === "Group" && conversation.participants.length > 1) {
            await Conversation.findByIdAndUpdate(id, { $pull: { participants: userId } })
        } else if (conversation.type === "Group" && conversation.participants.length === 1) {
            await Conversation.findByIdAndDelete(id)
        }

        res.status(200).json({ message: "Conversation deleted successfully", conversationId: id });
    } catch (error) {
        console.log("Error in deleteConversation controller", error);
        res.status(500).json({ message: "Internal server error" });
    }
}


