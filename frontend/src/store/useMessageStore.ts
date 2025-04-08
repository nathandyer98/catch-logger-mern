import { create } from "zustand";
import { axiosInstance } from "../services/api-client";
import { Message, MessageData } from "../types/conversations";
import { useConversationStore } from "./useConversationStore";

interface MessageState {
    messages: Message[];

    isMessagesLoading: boolean;
    isUpdatingMessage: boolean;

    getMessages: (conversationId: string) => Promise<void>;
    sendMessage: (conversationId: string, messageData: MessageData) => Promise<void>;
    editMessage: (messageId: string, messageData: MessageData) => Promise<void>;
    deleteMessage: (messageId: string) => Promise<void>;

    updateMessagesArray: (message: Message) => void;
}


export const useMessageStore = create<MessageState>((set) => ({
    messages: [],
    messagesCount: 0,

    isMessagesLoading: false,
    isUpdatingMessage: false,

    getMessages: async (conversationId: string) => {
        set({ isMessagesLoading: true });
        try {
            const res = await axiosInstance.get(`/conversations/${conversationId}/messages`);
            set({ messages: res.data });
            useConversationStore.getState().updateUnreadMessagesCount(conversationId, 0);
        } catch (error) {
            console.log("Error in getMessages: " + error);
        } finally {
            set({ isMessagesLoading: false });
        }
    },
    sendMessage: async (conversationId: string, messageData: MessageData) => {
        try {
            await axiosInstance.post(`/conversations/${conversationId}/messages`, messageData);
        } catch (error) {
            console.log("Error in sendMessage: " + error);
        }
    },

    editMessage: async (messageId: string, messageData: MessageData) => {
        set({ isUpdatingMessage: true });
        try {
            const res = await axiosInstance.put(`/messages/${messageId}`, messageData);
            set((state) => ({
                messages: state.messages.map((message) =>
                    message._id === messageId ? res.data : message
                ),
            }));
        }
        catch (error) {
            console.log("Error in editMessage: " + error);
        }
        finally {
            set({ isUpdatingMessage: false });
        }
    },

    deleteMessage: async (messageId: string) => {
        try {
            await axiosInstance.delete(`/messages/${messageId}`);
            set((state) => ({
                messages: state.messages.filter((message) => message._id !== messageId),
            }));
        } catch (error) {
            console.log("Error in deleteMessage: " + error);
        }
    },

    updateMessagesArray: (message: Message) => {
        set((state) => ({
            messages: [...state.messages, message],
        }));
    },

}));