import { ConversationTypes } from "../enum/ConversationTypes";
import { Participant, User } from "./users";

export interface Conversation {
    _id: string;
    type: ConversationTypes;
    participants: Participant[];
    lastMessage: LastMessage | null;
    lastMessageAt: Date | null;
}

export interface LastMessage {
    _id: string;
    from: Participant;
    text: string;
    createdAt: Date;
}

export interface Message {
    _id: string;
    conservationId: string;
    from: string;
    text: string;
    image: string;
    readBy: User[];
    createdAt: Date;
    UpdatedAt: Date;
}

export interface MessageData {
    text: string;
    image: string;
}