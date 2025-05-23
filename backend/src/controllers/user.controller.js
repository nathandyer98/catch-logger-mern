import * as UserService from "../services/user.service.js"
import { handleControllerError } from '../utils/errorHandler.js';

export const getUsersProfile = async (req, res) => { // Add META data to check if you are following the user
    const { username } = req.params
    try {
        const userProfile = await UserService.getUserProfile(username)
        res.status(200).json(userProfile);
    } catch (error) {
        console.log("---Get User Profile Controller Error---", error);
        handleControllerError(error, res)
    }
}

export const searchUsers = async (req, res) => {
    const userId = req.user._id;
    const { username } = req.query;
    if (!username || username.trim().length < 2) {
        return res.status(200).json([]);
    }
    const cleanInput = username.replace(/[-\/\\^$*+?.()|[\]{}]/ig, '\\$&').trim();
    try {
        const users = await UserService.searchUsers(userId, cleanInput)
        res.status(200).json(users);
    } catch (error) {
        console.log("---Search Users Controller Error---", error);
        handleControllerError(error, res)
    }
};

export const followUnfollowUser = async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    if (id === userId.toString()) {
        return res.status(400).json({ message: "You cannot follow yourself." });
    }
    try {
        const { user, message } = await UserService.followUnfollowUser(userId, id)
        res.status(200).json({ data: user, message });
    } catch (error) {
        console.log("---Follow/Unfollow Controller Error---", error);
        handleControllerError(error, res)
    }
}

export const getSuggestedUsers = async (req, res) => {
    const userId = req.user._id;
    try {
        const users = await UserService.getSuggestedUsers(userId)
        res.status(200).json(users)
    } catch (error) {
        console.log("---Get Suggested Users Controller Error---", error);
        handleControllerError(error, res)
    }
}
