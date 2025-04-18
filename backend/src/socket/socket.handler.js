import * as ConversationService from "../../services/conversation.service.js";
import * as MessageService from "../../services/message.service.js";

/**
 * Initialises Socket.IO event handlers and listeners
 * @param {import("socket.io").Server} io - Socket.IO server instance
 */

export const initializeSocketHandlers = (io) => {

    io.on("connection", async (socket) => {
        const userId = socket.handshake.auth.userId;

        // --- Authentication & Initial Setup ---
        if (!userId) {
            console.warn(`Socket ${socket.id}: Connection attempt without userId. Disconnecting.`);
            socket.disconnect(true); // Force disconnect if no user identified
            return;
        }

        // *** Join a room based on the user ID ***
        socket.join(userId.toString());
        console.log(`Socket ${socket.id}: User ${userId} connected & joined room: ${userId}`);
        socket.emit("welcome", `Welcome, User ${userId}! You are connected.`); // Welcome message to the specific client


        // ---- Listening for Client Actions ----

        // --- Conversation Events ---
        socket.on('joinConversation', async (conversationId) => {
            console.log(`Socket ${socket.id}: User ${userId} attempting to join conversation ${conversationId}`);
            if (!conversationId) {
                console.warn(`Socket ${socket.id} (User ${userId}): Missing conversationId for joinConversation.`);
                return;
            }
            try {
                await ConversationService.authoriseAndValidateConversation(conversationId, userId);
                const roomName = `conversation:${conversationId}`;
                socket.join(roomName);
                console.log(`Socket ${socket.id}: User ${userId} successfully joined room ${roomName}`);
                socket.emit("joinedConversationSuccess", conversationId);

            } catch (error) {
                console.error(`Socket ${socket.id}: Error joining conversation ${conversationId} for user ${userId}:`, error.message);
                socket.emit("joinedConversationError", `Failed to join conversation ${conversationId}`);
            }
        });

        socket.on("leaveConversation", (conversationId) => {
            if (!conversationId) {
                console.warn(`Socket ${socket.id} (User ${userId}): Missing conversationId for leaveConversation.`);
                return;
            }
            const roomName = `conversation:${conversationId}`;
            socket.leave(roomName);
            console.log(`Socket ${socket.id}: User ${userId} left room ${roomName}`);
            socket.emit("leftConversationSuccess", conversationId);
        });

        // --- Message Events ---
        socket.on('markMessageRead', async ({ conversationId, messageId }, response) => {
            if (!conversationId || !messageId) {
                console.warn(`Socket ${socket.id} (User ${userId}): Missing IDs for markMessageRead.`);
                response({ success: false, error: "Missing IDs for markMessageRead" });
                return;
            }
            try {
                await MessageService.readMessage(conversationId, userId, messageId);
                console.log(`Socket ${socket.id}: User ${userId} marked message ${messageId} in convo ${conversationId} as read.`);
                response({ success: true });
            } catch (error) {
                console.error(`Socket ${socket.id}: Error marking message read for user ${userId}, convo ${conversationId}, msg ${messageId}:`, error.message);
                response({ success: false, error: `Failed to mark message as read` });
            }
        });

        // --- Disconnect Event ---
        socket.on("disconnect", (reason) => {
            console.log(`Socket ${socket.id}: User ${userId} disconnected. Reason: ${reason}`);
        });

        // --- Socket Error Handler ---
        socket.on("error", (error) => {
            console.error(`Socket ${socket.id} (User ${userId}) Error:`, error);
        });

    });
    console.log("Socket.IO event handlers initialized.");
};