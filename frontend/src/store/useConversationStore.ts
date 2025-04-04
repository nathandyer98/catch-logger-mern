import { create } from "zustand";
import { axiosInstance } from "../services/api-client";
import { Participant } from "../types/users";
import { Conversation } from "../types/conversations";

import toast from "react-hot-toast";

interface ConversationState {
    conversations: Conversation[];
    conversationCount: number;

    selectedConversation: Conversation | null;

    isFetchingConversations: boolean;
    isCreatingConversation: boolean;

    fetchConversations: () => Promise<void>;
    createConversation: (participants: Participant[]) => Promise<void>;
    setSelectedConversation: (conversationId: string) => void;
    deleteConversation: (conversationId: string) => Promise<void>;

    updateConversationsArray: (conversation: Conversation) => void;
    updateConversationCount: (count: number) => void;
}

export const useConversationStore = create<ConversationState>((set, get) => ({
    conversations: [],
    conversationCount: 0,
    selectedConversation: null,

    isFetchingConversations: false,
    isCreatingConversation: false,
    isLoadingConversations: false,

    fetchConversations: async () => {
        set({ isFetchingConversations: true });
        try {
            const res = await axiosInstance.get("/conversations");
            set({ conversations: res.data });
        } catch (error) {
            console.log("Error in fetchConversations: " + error);
            toast.error("Error getting conversations");
        } finally {
            set({ isFetchingConversations: false });
        }
    },

    createConversation: async (participants: Participant[]) => {
        set({ isCreatingConversation: true });
        let conversationToSelect: Conversation | null = null;
        try {
            const res = await axiosInstance.post("/conversations", { participants });

            const conversationExistsLocally = get().conversations.some((c) => c._id === res.data._id);

            if (conversationExistsLocally) {
                conversationToSelect = res.data;

                set(state => ({ conversations: state.conversations.map(c => c._id === res.data._id ? res.data : c) }));
                toast.success("Opening Chat.");
            } else {
                set((state) => ({ conversations: [...state.conversations, res.data] }))
                conversationToSelect = res.data;
                toast.success("New Chat Created!");
            }
            if (conversationToSelect) {
                set({ selectedConversation: conversationToSelect });
            }
        } catch (error) {
            console.log("Error in createConversation: " + error);
            toast.error("Error creating conversation");
        } finally {
            set({ isCreatingConversation: false });
        }
    },
    setSelectedConversation: (conversationId: string) => {
        set({ selectedConversation: get().conversations.find(c => c._id === conversationId) });
    },

    deleteConversation: async (conversationId: string) => {
        try {
            const res = await axiosInstance.delete(`/conversations/${conversationId}`);
            set(state => ({ conversations: state.conversations.filter(c => c._id !== conversationId) }));
            toast.success(res.data.message);
        } catch (error) {
            console.log("Error in deleteConversation: " + error);
            toast.error("Error deleting conversation");
        }
    },

    updateConversationsArray: (conversation: Conversation) => {
        set(state => {
            const conversationExists = state.conversations.some(c => c._id === conversation._id);
            if (conversationExists) {
                return { conversations: state.conversations.map(c => c._id === conversation._id ? conversation : c) };
            } else {
                return { conversations: [conversation, ...state.conversations] };
            }
        });
    },
    updateConversationCount: (count: number) => {
        set({ conversationCount: count });
    }
}));