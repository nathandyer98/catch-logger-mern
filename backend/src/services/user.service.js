import UserRepository from "../repository/user.repository.js";
import * as NotificationService from "./notification.service.js";
import { NotFoundError } from '../errors/applicationErrors.js';

export const getUserProfile = async (username) => {
    const user = await UserRepository.findByUsername(username);
    if (!user) {
        throw new NotFoundError("User not found");
    }
    return user
}

export const searchUsers = async (currentUserId, usernameQuery) => {
    const users = await UserRepository.findUsersByUsernameQuery(currentUserId, usernameQuery)
    return users
}

export const followUnfollowUser = async (currentUserId, targetUserId) => {
    const currentUser = await UserRepository.findByIdMongooseDoc(currentUserId)
    const targetUser = await UserRepository.findById(targetUserId)
    if (!targetUser || !currentUser) {
        throw new NotFoundError("User not found");
    }

    let user;
    let message;

    if (currentUser.following.includes(targetUserId)) {
        user = await UserRepository.unfollowUserById(currentUserId, targetUserId);
        message = "You are no longer following this user."
    } else {
        user = await UserRepository.followUserById(currentUserId, targetUserId);
        message = "You are now following this user."

        await NotificationService.createNotification({
            from: currentUserId,
            to: targetUserId,
            type: "follow",
        });
    }
    return { user, message }
}

export const getSuggestedUsers = async (userId) => {
    const amount = 4
    const followingList = await UserRepository.getFollowingList(userId);
    if (!followingList) {
        throw new NotFoundError("Current user not found when fetching following list.");
    }

    const followedUsers = followingList.following.map(user => user._id.toString());
    const usersSample = await UserRepository.findOtherUsersSample(userId);

    const filteredUsers = usersSample.filter(user => !followedUsers.includes(user._id.toString()));
    return filteredUsers.slice(0, amount)
}