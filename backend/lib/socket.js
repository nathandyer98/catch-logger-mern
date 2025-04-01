import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
    }
})

app.set('socketio', io);

io.on("connection", (socket) => {
    const userId = socket.handshake.auth.userId;

    if (!userId) {
        console.log(`Socket ${socket.id} connected without userId. Disconnecting.`);
        // Optionally emit an error back to client before disconnecting
        // socket.emit('auth_error', { message: 'User ID not provided' });
        socket.disconnect(true); // Force disconnect
        return;
    }

    // *** Join a room based on the user ID ***
    socket.join(userId);

    console.log(`User ${userId.toString()} connected with socket ${socket.id}`);

    socket.on("disconnect", (reason) => {
        console.log(`User ${userId} disconnected socket ${socket.id}. Reason: ${reason}`);
    });
})

export { io, app, server }