import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const authenticatedRoute = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;

        if(!token){
            res.status(401).json({ message: "Unauthorized - No token" });
        }
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET)

        if(!decodedToken){
            res.status(401).json({ message: "Unauthorized - No token" });
        }
        const user = await User.findById(decodedToken.userId).select("-password");

        if(!user){
            res.status(404).json({ message: "User not found" });
        }

        req.user = user;
        next();
    } catch (error) {
        console.log("Error in auth middleware", error);
        res.status(500).json({ message: "Internal server error" });
    }
}
