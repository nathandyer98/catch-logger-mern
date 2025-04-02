import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import UserRepository from "../repository/user.repository.js";

export const authenticatedRoute = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;

        if (!token) {
            return res.status(401).json({ message: "Unauthorized - No token" });
        }

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET)

        const user = await UserRepository.findById(decodedToken.userId);

        if (!user) {
            return res.status(404).json({ message: "User associated with this token not found" });
        }

        req.user = user;
        next();
    } catch (error) {
        console.log("Error in auth middleware", error);
        res.status(500).json({ message: "Internal server error" });
    }
}
