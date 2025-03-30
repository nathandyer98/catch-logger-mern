import { create } from "zustand";
import { axiosInstance } from "../services/api-client";
import { Message, MessageData } from "../types/conversations";

interface MessageState {
    messages: Message[];

    isMessagesLoading: boolean;

    getMessages: (conversationId: string) => Promise<void>;
    sendMessage: (conversationId: string, messageData: MessageData) => Promise<void>;
}

export const useMessageStore = create<MessageState>((set) => ({
    messages: [],
    conversationId: null,

    isMessagesLoading: false,

    getMessages: async (conversationId: string) => {
        set({ isMessagesLoading: true });
        try {
            const res = await axiosInstance.get(`/conversations/${conversationId}/messages`);
            set({ messages: res.data });
        } catch (error) {
            console.log("Error in getMessages: " + error);
        } finally {
            set({ isMessagesLoading: false });
        }
    },
    sendMessage: async (conversationId: string, messageData: MessageData) => {
        try {
            const res = await axiosInstance.post(`/conversations/${conversationId}/messages`, messageData);
            set((state) => ({
                messages: [...state.messages, res.data],
            }))
        } catch (error) {
            console.log("Error in sendMessage: " + error);
        }
    },

}));

