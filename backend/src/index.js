import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoute from "../routes/auth.route.js";
import catchRoute from "../routes/catch.route.js"
import userRoute from "../routes/user.route.js"
import notificationRoute from "../routes/notification.route.js"
import converstaionRoute from "../routes/conversation.route.js"

import { app, server, io } from "../lib/socket.js";
import { connectDB } from "../lib/db.js";
import { SocketService } from '../services/socket.service.js';

dotenv.config();
SocketService.initialize(io);

const PORT = process.env.PORT || 5001;

app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use("/api/auth", authRoute);
app.use("/api/catches", catchRoute);
app.use("/api/users", userRoute);
app.use("/api/notifications", notificationRoute);
app.use("/api/conversations", converstaionRoute)

server.listen(PORT, () => {
    console.log("Server is running on port:", PORT);
    connectDB();
})