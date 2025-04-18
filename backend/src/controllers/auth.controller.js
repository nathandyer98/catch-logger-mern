import * as AuthService from "../services/auth.service.js"
import { handleControllerError } from '../utils/errorHandler.js';
import { generateToken } from "../utils/generateToken.js";

export const signup = async (req, res) => {
    const { fullName, email, password, username } = req.body;

    if (!fullName || !username || !email || !password || !fullName.trim() || !username.trim() || !email.trim() || !password.trim()) {
        return res.status(400).json({ message: "All fields are required" });
    }
    if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
    }
    try {
        const newUser = await AuthService.signUpUser({ fullName, email, password, username })
        generateToken(newUser._id, res);

        res.status(200).json(newUser);
    } catch (error) {
        console.error("---Sign Up Controller Error---");
        handleControllerError(error, res)
    }
}

export const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password || !email.trim() || !password.trim()) {
        return res.status(400).json({ message: "Email and Password are required" });
    }
    try {
        const loggedInUser = await AuthService.loginUser(email, password)
        generateToken(loggedInUser._id, res);

        res.status(200).json(loggedInUser);
    } catch (error) {
        console.error("---Login Controller Error---");
        handleControllerError(error, res)
    }
}

export const logout = (req, res) => {
    try {
        res.cookie("jwt", "", { maxAge: 0 });
        res.status(200).json({ message: "Logged out successful" });
    } catch (error) {
        console.error("---Logout Controller Error---");
        handleControllerError(error, res)
    }
}

export const updateUserProfile = async (req, res) => {
    const { fullName, profilePic } = req.body;
    const userId = req.user._id

    if (!fullName && !profilePic) {
        return res.status(400).json({ message: "No data provided" });
    }

    try {
        const updatedUser = await AuthService.updateUserProfile(userId, { fullName, profilePic })
        res.status(200).json(updatedUser);
    } catch (error) {
        console.error("---Updating Controller Error---");
        handleControllerError(error, res)
    }
}

export const checkAuth = async (req, res) => {
    try {
        res.status(200).json(req.user);
    } catch (error) {
        console.log("Error in checkAuth controller", error);
        res.status(500).json({ message: "Internal server error" });
    }
}