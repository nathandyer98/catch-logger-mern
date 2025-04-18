import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";

import authRoute from "../routes/auth.route.js"
import catchRoute from "../routes/catch.route.js"
import userRoute from "../routes/user.route.js"
import notificationRoute from "../routes/notification.route.js"
import converstaionRoute from "../routes/conversation.route.js"

dotenv.config();

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

// --- API Routes Setup ---
app.use("/api/auth", authRoute);
app.use("/api/catches", catchRoute);
app.use("/api/users", userRoute);
app.use("/api/notifications", notificationRoute);
app.use("/api/conversations", converstaionRoute);


app.get("/health", (req, res) => {
    res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

app.use((req, res) => {
    res.status(404).json({ message: "404: Resource not found on this server." });
});

app.use((err, req, res) => {
    console.error("Unhandled Error:", err.stack || err);
    const statusCode = err.status || 500;
    res.status(statusCode).json({
        message: err.message || "Internal Server Error",
        // Only include stack in development for security reasons
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

export default app;