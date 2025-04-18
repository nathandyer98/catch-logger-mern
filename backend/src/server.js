import http from "http";
import { Server as SocketIOServer } from "socket.io";
import dotenv from "dotenv";
import app from "./app.js";
import { connectDB } from "../src/config/db.js";
import { initializeSocketHandlers } from "./socket/socket.handler.js";
import { SocketService } from './services/socket.service.js';
import { initializeRealtimeListeners } from "./listeners/realtime.listener.js";

dotenv.config();

const PORT = process.env.PORT || 5001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

const server = http.createServer(app);

const io = new SocketIOServer(server, {
    cors: {
        origin: CORS_ORIGIN,
        methods: ["GET", "POST"],
    },
});

SocketService.initialize(io);
initializeSocketHandlers(io);
initializeRealtimeListeners();

const startServer = async () => {
    try {
        await connectDB();

        server.listen(PORT, () => {
            console.log(`🚀 Server is running on http://localhost:${PORT}`);
            console.log(`🔌 Socket.IO is listening for connections from ${CORS_ORIGIN}`);
        });
    } catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1);
    }
};

if (process.env.NODE_ENV !== "test") {
    startServer();
} else {
    console.log("🧪 Test environment detected. Server start skipped.");
}
// ----For Testing----
export { app, server };

const shutdownServer = async (signal) => {
    console.log(`\nReceived ${signal}. Closing server...`);
    server.close(async () => {
        console.log('✅ HTTP server closed.');
        try {
            await mongoose.connection.close();
            console.log('✅ MongoDB connection closed.');
            process.exit(0);
        } catch (err) {
            console.error('❌ Error closing MongoDB connection:', err);
            process.exit(1);
        }
    });

    // Force shutdown
    setTimeout(() => {
        console.error('⚠️ Could not close connections in time, forcing shutdown.');
        process.exit(1);
    }, 10000);
}

process.on('SIGTERM', () => shutdownServer('SIGTERM'));
process.on('SIGINT', () => shutdownServer('SIGINT'));


// --- Unhandled Promise Rejection & Uncaught Exception ---
process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
    shutdownServer('unhandledRejection');
});

process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
    process.exit(1); // Or exit immediately as the app state is unknown
});