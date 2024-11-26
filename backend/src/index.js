import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoute from "../routes/auth.route.js";
import catchRoute from "../routes/catch.route.js"
import { connectDB } from "../lib/db.js";

dotenv.config();
const app = express();

const PORT = process.env.PORT || 5001;

app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use("/api/auth", authRoute);
app.use("/api/catches", catchRoute);


app.listen(PORT, () => {
    console.log("Server is running on port:",PORT);
    connectDB();
})