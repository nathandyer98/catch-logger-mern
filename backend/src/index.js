import express from "express";
import dotenv from "dotenv";

import authRoute from "../routes/auth.route.js";
import { connectDB } from "../lib/db.js";
import { connect } from "mongoose";

dotenv.config();
const app = express();

const PORT = process.env.PORT || 5001;

app.use(express.json());

app.use("/api/auth", authRoute);


app.listen(PORT, () => {
    console.log("Server is running on port:",PORT);
    connectDB();
})