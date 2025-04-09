import CatchRepository from "../repository/catch.repository.js";
import UserRepository from "../repository/user.repository.js";
import * as NotificationService from "./notification.service.js";
import cloudinary from "../lib/cloudinary.js";
import {
    AuthenticationError,
    NotFoundError,
    ServiceError
} from '../errors/applicationErrors.js';

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
    if (!user) throw new NotFoundError("User not found.");

    let photoUrl = null;
    if (catchData.photo) {
        try {
            const uploadedResponse = await cloudinary.uploader.upload(catchData.photo, { folder: "messages" });
            photoUrl = uploadedResponse.secure_url;
        } catch (uploadError) {
            console.error("Cloudinary upload failed:", uploadError);
            throw new ServiceError("Failed to upload message photo."); // Or handle differently
        }
    }
    catchData = { ...catchData, photo: photoUrl };
    try {
        const createCatch = await CatchRepository.createCatch(catchData);
        const newCatch = await CatchRepository.getCatchById(createCatch._id);
        return newCatch
    } catch (error) {
        console.log("Error creating catch in repository:", error);
        throw new ServiceError("Failed to fetch all catches due to a service issue.");
    }
}

export const updateCatch = async (catchId, userId, updateData) => {
    const catchToUpdate = await CatchRepository.getCatchById(catchId);
    if (!catchToUpdate) throw new NotFoundError("Catch not found.");
    if (!catchToUpdate.user === userId) throw new AuthenticationError("Not authorized to update this catch.");

    let photoUrl = null;
    if (updateData.photo) {
        try {
            if (catchToUpdate.photo) {
                try {
                    await cloudinary.uploader.destroy(catchToUpdate.photo.split('/').pop().split('.')[0]);
                } catch (error) {
                    console.warn("Cloudinary delete failed:", deletedResponse);
                }
            }
            const uploadedResponse = await cloudinary.uploader.upload(updateData.photo, { folder: "messages" });
            photoUrl = uploadedResponse.secure_url;
        } catch (uploadError) {
            console.error("Cloudinary upload failed:", uploadError);
            throw new ServiceError("Failed to upload message photo."); // Or handle differently
        }
    }
    const updatePayload = { ...updateData, photo: photoUrl };
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
        try {
            await cloudinary.uploader.destroy(catchToDelete.photo.split('/').pop().split('.')[0]);
        } catch (error) {
            console.log("Error deleting catch photo in repository:", error);
            throw new ServiceError("Failed to delete catch photo due to a service issue.");
        }
    }
    try {
        await CatchRepository.deleteCatchById(catchId);
        return "Catch deleted successfully";
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
            await UserRepository.unlikeCatchById(catchId, userId);
            message = "Catch Unliked";
        } else {
            catchLikes = await CatchRepository.likeCatchById(catchId, userId);
            await UserRepository.likeCatchById(catchId, userId);
            message = "Liked Catch";

            await NotificationService.createNotification({
                from: userId,
                to: catchToLikeUnlike.user._id,
                type: "like",
            });
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

        await NotificationService.createNotification({
            from: userId,
            to: catchToComment.user._id,
            type: "comment",
        });

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

