import CatchRepository from "../repository/catch.repository.js";
import UserRepository from "../repository/user.repository.js";
import NotificationRepository from "../repository/notification.repository.js";
import cloudinary from "../lib/cloudinary.js";
import {
    AuthenticationError,
    NotFoundError,
    ServiceError
} from '../errors/applicationErrors.js';
import { SocketService } from '../services/socket.service.js';


export const getAllCatches = async ({ page, limit }) => {
    try {
        const catches = await CatchRepository.getCatches(page, limit);
        return catches
    } catch (error) {
        console.log("Error fetching all cathches in repository:", error);
        throw new ServiceError("Failed to fetch all catches due to a service issue.");
    }
}

export const getCatchesByUser = async (username, { page, limit }) => {
    const user = await UserRepository.findByUsername(username);
    console.log(user)
    if (!user) throw new NotFoundError("User not found.");
    try {
        const catches = await CatchRepository.getCatchesById(user._id, page, limit);
        return catches
    } catch (error) {
        console.log("Error fetching all cathches in repository:", error);
        throw new ServiceError("Failed to fetch all catches due to a service issue.");
    }
}

export const getCatchesFeed = async (userId, { page, limit }) => {
    const user = await UserRepository.findById(userId);
    if (!user) throw new NotFoundError("User not found.");

    const userIds = [user._id, ...user.following];
    try {
        const catches = await CatchRepository.getCatchesByUserIds(userIds, page, limit);
        return catches
    } catch (error) {
        console.log("Error fetching all cathches in repository:", error);
        throw new ServiceError("Failed to fetch all catches due to a service issue.");
    }
}

export const createCatch = async (catchData) => {
    const user = await UserRepository.findById(catchData.user);
    console.log(user)
    if (!user) throw new NotFoundError("User not found.");

    if (catchData.photo) {
        const uploadedResponse = await cloudinary.uploader.upload(catchData.photo, { folder: "catches" });
        catchData.photo = uploadedResponse.secure_url;
    }

    try {
        const createCatch = await CatchRepository.createCatch(catchData);
        const newCatch = await CatchRepository.getCatchById(createCatch._id);
        return newCatch
    } catch (error) {
        console.log("Error creating catch in repository:", error);
        throw new ServiceError("Failed to fetch all catches due to a service issue.");
    }
}

export const updateCatch = async (catchId, userId, updatePayload) => {
    const catchToUpdate = await CatchRepository.getCatchById(catchId);
    if (!catchToUpdate) throw new NotFoundError("Catch not found.");

    if (!catchToUpdate.user === userId) throw new AuthenticationError("Not authorized to update this catch.");

    if (updatePayload.photo) {
        if (catchToUpdate.photo) {
            await cloudinary.uploader.destroy(catchToUpdate.photo.split('/').pop().split('.')[0]);
        }
        const uploadedResponse = await cloudinary.uploader.upload(updatePayload.photo, { folder: "catches" });
        updatePayload.photo = uploadedResponse.secure_url;
    }
    try {
        const updatedCatch = await CatchRepository.updateCatchById(catchId, updatePayload);
        return updatedCatch
    } catch (error) {
        console.log("Error updating catch in repository:", error);
        throw new ServiceError("Failed to update catch due to a service issue.");
    }
}

export const deleteCatch = async (catchId, userId) => {
    const catchToDelete = await CatchRepository.getCatchById(catchId);
    if (!catchToDelete) throw new NotFoundError("Catch not found.");

    if (!catchToDelete.user === userId) throw new AuthenticationError("Not authorized to delete this catch.");

    if (catchToDelete.photo) {
        await cloudinary.uploader.destroy(catchToDelete.photo.split('/').pop().split('.')[0]);
    }

    let message;
    try {
        await CatchRepository.deleteCatchById(catchId);
        message = "Catch deleted successfully";
        return message
    } catch (error) {
        console.log("Error deleting catch in repository:", error);
        throw new ServiceError("Failed to delete catch due to a service issue.");
    }
}

export const likeUnlikeCatch = async (catchId, userId) => {
    const catchToLikeUnlike = await CatchRepository.getCatchByIdMongooseDoc(catchId);
    if (!catchToLikeUnlike) throw new NotFoundError("Catch not found.");

    const user = await UserRepository.findById(userId);
    if (!user) throw new NotFoundError("User not found.");

    let catchLikes;
    let message;

    try {
        if (catchToLikeUnlike.likes.includes(userId)) {
            catchLikes = await CatchRepository.unlikeCatchById(catchId, userId);
            message = "Catch Unliked";
        } else {
            catchLikes = await CatchRepository.likeCatchById(catchId, userId);
            message = "Liked Catch";

            if (catchToLikeUnlike.user._id.toString() !== userId.toString()) {
                const newNotification = await NotificationRepository.createNotification({
                    from: userId,
                    to: catchToLikeUnlike.user._id,
                    type: 'like'
                })
                if (newNotification && catchToLikeUnlike.user._id) {
                    await SocketService.notifyUserOfNotification(catchToLikeUnlike.user._id, newNotification._id);
                }
            }
        }
        return { catchLikes, message }
    } catch (error) {
        console.log("Error liking/unliking catch in repository:", error);
        throw new ServiceError("Failed to like/unlike catch due to a service issue.");
    }
}

export const createComment = async (catchId, userId, comment) => {
    const catchToComment = await CatchRepository.getCatchByIdMongooseDoc(catchId);
    if (!catchToComment) throw new NotFoundError("Catch not found.");

    const user = await UserRepository.findById(userId);
    if (!user) throw new NotFoundError("User not found.");

    try {
        const updatedComments = await CatchRepository.commentOnCatchById(catchId, userId, comment);

        if (catchToComment.user._id.toString() !== userId.toString()) {
            const newNotification = await NotificationRepository.createNotification({
                from: userId,
                to: catchToComment.user._id,
                type: 'comment'
            })
            if (newNotification && catchToComment.user._id) {
                await SocketService.notifyUserOfNotification(catchToComment.user._id, newNotification._id);
            }
        }
        return updatedComments
    } catch (error) {
        console.log("Error creating comment in repository:", error);
        throw new ServiceError("Failed to create comment due to a service issue.");
    }
}

export const deleteComment = async (catchId, userId, commentId) => {
    const catchToDeleteComment = await CatchRepository.getCatchByIdMongooseDoc(catchId);
    if (!catchToDeleteComment) throw new NotFoundError("Catch not found.");

    const user = await UserRepository.findById(userId);
    if (!user) throw new NotFoundError("User not found.");

    const CommentExists = catchToDeleteComment.comments.find(comment => comment._id.toString() === commentId);
    if (!CommentExists) throw new NotFoundError("Comment not found.");

    if (CommentExists && CommentExists.user._id.toString() !== userId.toString()) throw new AuthenticationError("Not authorized to delete this comment.");

    try {
        await CatchRepository.deleteCommentById(catchId, commentId);
        return "Comment deleted successfully"
    } catch (error) {
        console.log("Error deleting comment in repository:", error);
        throw new ServiceError("Failed to delete comment due to a service issue.");
    }

}

export const updateComment = async (catchId, userId, commentId, comment) => {
    const catchToUpdateComment = await CatchRepository.getCatchByIdMongooseDoc(catchId);
    if (!catchToUpdateComment) throw new NotFoundError("Catch not found.");

    const user = await UserRepository.findById(userId);
    if (!user) throw new NotFoundError("User not found.");

    const CommentExists = catchToUpdateComment.comments.find(comment => comment._id.toString() === commentId);
    if (!CommentExists) throw new NotFoundError("Comment not found.");

    if (CommentExists && CommentExists.user._id.toString() !== userId.toString()) throw new AuthenticationError("Not authorized to update this comment.");

    try {
        const updatedComment = await CatchRepository.updateCommentById(catchId, commentId, comment);
        return updatedComment
    } catch (error) {
        console.log("Error updating comment in repository:", error);
        throw new ServiceError("Failed to update comment due to a service issue.");
    }
}

