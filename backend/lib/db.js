import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log("Mongo DB connected successfully", conn.connection.host);
    } catch (error) {
        console.log("Mongo DB connection error", error);
    }
}