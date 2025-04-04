import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { useNotificationStore } from "./useNotificationStore";
import { useConversationStore } from "./useConversationStore";
import { useMessageStore } from "./useMessageStore";
import { Notification } from "../types/notifcations";
import { Conversation, Message } from "../types/conversations";

const BASE_URL = "http://localhost:5001/"

export type NotificationHandler = (notification: Notification) => void;
export type NotificationCountHandler = (count: number) => void;
export type ConversationHandler = (conversation: Conversation) => void;
export type ConversationCountHandler = (count: number) => void;
export type MessageHandler = (message: Message) => void;
export type MessageCountHandler = (count: number) => void;

interface SocketState {
    socket: Socket | null;
    connect: (userId: string) => void;
    disconnect: () => void;
    joinConversation: (conversationId: string) => void;
    leaveConversation: (conversationId: string) => void;
}

export const useSocketStore = create<SocketState>((set, get) => {
    const handleNewNotification: NotificationHandler = (notification: Notification) => {
        console.log('Handler: New notification received:', notification);
        useNotificationStore.getState().addNotification(notification);
    }

    const handleNewNotificationCount: NotificationCountHandler = (count: number) => {
        console.log('Handler: New notification count received:', count);
    }

    const handleNewConversation: ConversationHandler = (conversation: Conversation) => {
        console.log('Handler: New conversation received:', conversation);
        useConversationStore.getState().updateConversationsArray(conversation);
    }

    const handleUpdatedConversation: ConversationHandler = (conversation: Conversation) => {
        console.log('Handler: : Updated conversation recieved', conversation);
        useConversationStore.getState().updateConversationsArray(conversation);
    }


    const handleNewMessage: MessageHandler = (message: Message) => {
        console.log('Handler: New message received:', message);
        useMessageStore.getState().updateMessagesArray(message);
    }

    return {
        socket: null,

        connect: (userId: string) => {
            if (get().socket?.connected) {
                console.warn("Socket connection attemp ignored. Already connected");
            }
            console.log(`Attempting to connect socket for user: ${userId}`);
            const newSocket = io(BASE_URL, {
                auth: { userId },
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
            });
            newSocket.on("connect", () => {
                console.log("Socket connected successfully");
                set({ socket: newSocket });
            });

            newSocket.on("disconnect", (reason) => {
                console.log("Socket disconnected", reason);
                set({ socket: null });
            });

            newSocket.on("connect_error", (error) => {
                console.log("Socket connection error", error);
                set({ socket: null });
            });

            newSocket.on("welcome", (message) => {
                console.log("Message from server", message);
            });

            newSocket.on("newNotification", handleNewNotification);

            newSocket.on("newNotificationCount", handleNewNotificationCount);

            newSocket.on("newGroupConversation", handleNewConversation);

            newSocket.on("updatedConversation", handleUpdatedConversation);

            newSocket.on("newMessage", handleNewMessage);

            set({ socket: newSocket });
        },

        disconnect: () => {
            const socket = get().socket;
            if (!socket) {
                console.log("Disconnecting socket and removing listeners...");
                socket!.off("newNotification", handleNewNotification);
                socket!.off("newNotificationCount", handleNewNotificationCount);
                socket!.off("newGroupConversation", handleNewConversation);
                socket!.off("newMessage", handleNewMessage);
                get().socket?.disconnect();
                set({ socket: null });
            }
        },

        joinConversation: (conversationId: string) => {
            const socket = get().socket;
            if (socket?.connected && conversationId) {
                socket.emit("joinConversation", conversationId);
                console.log("Client Emitting: joinConversation for conversation: ", conversationId);
            } else {
                console.warn(`Socket not connected or conversationId is missing. Cannot join room ${conversationId}.`);
            }
        },

        leaveConversation: (conversationId: string) => {
            const socket = get().socket;
            if (socket?.connected && conversationId) {
                socket.emit("leaveConversation", conversationId);
                console.log("Client Emitting: leaveConversation for conversation: ", conversationId);
            } else {
                console.warn(`Socket not connected or conversationId is missing. Cannot leave room ${conversationId}.`);
            }
        },
    };
});
