import mongoose from "mongoose";

const ConversationTypes = ["Direct", "Group"];

const conversationSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ConversationTypes
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }],
    accessedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }],
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
        default: null
    },
    lastMessageAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;