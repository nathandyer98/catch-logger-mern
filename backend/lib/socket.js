import { Server } from "socket.io";
import http from "http";
import express from "express";
import * as ConversationService from "../services/conversation.service.js";
import * as MessageService from "../services/message.service.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
    }
})

io.on("connection", async (socket) => {
    const userId = socket.handshake.auth.userId;

    if (!userId) {
        console.log(`Socket ${socket.id} connected without userId. Disconnecting.`);
        socket.disconnect(true); // Force disconnect
        return;
    }

    // *** Join a room based on the user ID ***
    socket.join(userId);
    console.log(`User ${userId.toString()} connected with socket ${socket.id}`);
    socket.emit("welcome", `Welcome ${userId}`);


    // ---- Listening for Client Actions ----

    socket.on('joinConversation', async (conversationId) => {
        if (!conversationId) {
            console.warn(`Socket ${socket.id} tried to join conversation without conversationId.`);
            return;
        }
        console.log(`Attempting to join User ${userId} to conversation ${conversationId}`);
        try {
            await ConversationService.authoriseAndValidateConversation(conversationId, userId);

            const roomName = `conversation:${conversationId}`;
            socket.join(roomName);
            console.log(`User ${userId} joined room ${roomName}`);
            socket.emit("joinedConversationSuccess", conversationId);
        } catch (error) {
            console.error(`Error while joining conversation ${conversationId} for user ${userId}:`, error);
            socket.emit("joinedConversationError", `Failed to join conversation ${conversationId}`);
        }
    });

    socket.on("leaveConversation", (conversationId) => {
        if (!conversationId) {
            console.warn(`Socket ${socket.id} (User ${userId}) tried to leave conversation without conversationId.`);
            return;
        }
        const roomName = `conversation:${conversationId}`; // Use prefix
        socket.leave(roomName);
        console.log(`User ${userId} left room ${roomName}`);
        socket.emit("leftConversationSuccess", conversationId);
    });

    socket.on("disconnect", (reason) => {
        console.log(`User ${userId} disconnected socket ${socket.id}. Reason: ${reason}`);
    });


    socket.on('markMessageRead', async ({ conversationId, messageId }, response) => {
        if (!conversationId || !messageId) {
            console.warn(`Socket ${socket.id} (User ${userId}) tried to mark message read without conversationId or messageId.`);
            return;
        }
        try {
            await MessageService.readMessage(conversationId, userId, messageId);
            response({ success: true });
        } catch (error) {
            console.error(`Error while marking message read for conversation ${conversationId} and message ${messageId} for user ${userId}:`, error);
            response({ success: false, error: `Failed to mark message as read` });
        }
    });
})

export { io, app, server }