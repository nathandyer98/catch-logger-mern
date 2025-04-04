import UserRepository from "../repository/user.repository.js";
import * as NotificationService from "./notification.service.js";
import { NotFoundError, ServiceError } from '../errors/applicationErrors.js';

export const getUserProfile = async (username) => {
    const user = await UserRepository.findByUsername(username);
    if (!user) {
        throw new NotFoundError("User not found");
    }
    return user
}

export const searchUsers = async (currentUserId, usernameQuery) => {
    try {
        const users = await UserRepository.findUsersByUsernameQuery(currentUserId, usernameQuery)
        return users
    } catch (error) {
        console.log("Error searching users in repository: ", error);
        throw new ServiceError("Failed to search users due to a service issue.");
    }
}

export const followUnfollowUser = async (currentUserId, targetUserId) => {
    const currentUser = await UserRepository.findByIdMongooseDoc(currentUserId)
    const targetUser = await UserRepository.findById(targetUserId)
    if (!targetUser || !currentUser) {
        throw new NotFoundError("User not found");
    }

    let user;
    let message;

    try {
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
    } catch (error) {
        console.log("Error following/unfollowing in repository: ", error);
        throw new ServiceError("Failed to follow/unfollow user due to service issue.");
    }
}

export const getSuggestedUsers = async (userId) => {
    const amount = 4
    try {
        const followedUsers = await UserRepository.getFollowingList(userId);
        const usersSample = await UserRepository.findOtherUsersSample(userId);

        if (!followedUsers) {
            throw new NotFoundError("Current user not found when fetching following list.");
        }

        const filteredUsers = usersSample.filter(user => !followedUsers.following.includes(user._id))
        return filteredUsers.slice(0, amount)
    } catch (error) {
        console.error("Error fetching suggested users in repository:", error);
        throw new ServiceError("Failed to fetch suggested users.");
    }

}