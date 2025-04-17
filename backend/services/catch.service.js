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
    const catches = await CatchRepository.getCatches(page, limit);
    return catches
}

export const getCatchesByUser = async (username, { page, limit }) => {
    const user = await UserRepository.findByUsername(username);
    if (!user) throw new NotFoundError("User not found.");

    const catches = await CatchRepository.getCatchesById(user._id, page, limit);
    return catches
}

export const getCatchesFeed = async (userId, { page, limit }) => {
    const user = await UserRepository.findById(userId);
    if (!user) throw new NotFoundError("User not found.");

    const userIds = [user._id, ...user.following];
    const catches = await CatchRepository.getCatchesByUserIds(userIds, page, limit);
    return catches
}

export const createCatch = async (catchData) => {
    const user = await UserRepository.findById(catchData.user);
    if (!user) throw new NotFoundError("User not found.");

    let photoUrl = null;
    if (catchData.photo) {
        try {
            const uploadedResponse = await cloudinary.uploader.upload(catchData.photo, { folder: "catch_photos" });
            photoUrl = uploadedResponse.secure_url;
        } catch (uploadError) {
            console.error("Cloudinary upload failed:", uploadError);
            throw new ServiceError("Failed to upload message photo.");
        }
    }

    catchData = { ...catchData, photo: photoUrl };
    const newCatch = await CatchRepository.createCatchPopulated(catchData);
    return newCatch
}

export const updateCatch = async (catchId, userId, updateData) => {
    const catchToUpdate = await CatchRepository.getCatchById(catchId);
    if (!catchToUpdate) throw new NotFoundError("Catch not found.");
    if (catchToUpdate.user._id.toString() !== userId.toString()) throw new AuthenticationError("Unauthorized - User is not authorized to update this catch.");

    let photoUrl = null;
    let updatePayload = { ...updateData };
    if (updateData.photo) {
        try {
            if (catchToUpdate.photo) {
                try {
                    console.log("Trying to delete catch photo:", catchToUpdate.photo);
                    await cloudinary.uploader.destroy(`catch_photos/${catchToUpdate.photo.split('/').pop().split('.')[0]}`);
                    console.log("Cloudinary delete successful.");
                } catch (deleteError) {
                    console.warn("Cloudinary delete failed (non-critical):", deleteError);
                }
            }
            const uploadedResponse = await cloudinary.uploader.upload(updateData.photo, { folder: "catch_photos" });
            photoUrl = uploadedResponse.secure_url;
            updatePayload = { ...updateData, photo: photoUrl };
        } catch (uploadError) {
            console.error("Cloudinary upload failed:", uploadError);
            throw new ServiceError("Failed to upload message photo.");
        }
    }
    const updatedCatch = await CatchRepository.updateCatchById(catchId, updatePayload);
    const newCatch = await CatchRepository.getCatchById(updatedCatch._id);
    return updatedCatch
}

export const deleteCatch = async (catchId, userId) => {
    const catchToDelete = await CatchRepository.getCatchById(catchId);
    if (!catchToDelete) throw new NotFoundError("Catch not found.");
    if (catchToDelete.user._id.toString() !== userId.toString()) throw new AuthenticationError("Unauthorized - User is not authorized to delete this catch.");

    if (catchToDelete.photo) {
        try {
            console.log("Trying to delete catch photo:", catchToDelete.photo);
            await cloudinary.uploader.destroy(`catch_photos/${catchToDelete.photo.split('/').pop().split('.')[0]}`);
            console.log("Cloudinary delete successful.");
        } catch (deleteError) {
            console.warn("Cloudinary delete failed (non-critical):", deleteError);
        }
    }
    await CatchRepository.deleteCatchById(catchId);
    return "Catch deleted successfully.";
}

export const likeUnlikeCatch = async (catchId, userId) => {
    const catchToLikeUnlike = await CatchRepository.getCatchByIdMongooseDoc(catchId);
    if (!catchToLikeUnlike) throw new NotFoundError("Catch not found.");

    const user = await UserRepository.findById(userId);
    if (!user) throw new NotFoundError("User not found.");

    let catchLikes;
    let message;

    if (catchToLikeUnlike.likes.includes(userId)) {
        catchLikes = await CatchRepository.unlikeCatchById(catchId, userId);
        await UserRepository.unlikeCatchById(catchId, userId);
        message = "Unliked Catch.";
    } else {
        catchLikes = await CatchRepository.likeCatchById(catchId, userId);
        await UserRepository.likeCatchById(catchId, userId);
        message = "Liked Catch.";

        await NotificationService.createNotification({
            from: userId,
            to: catchToLikeUnlike.user._id,
            type: "like",
        });
    }
    return { catchLikes, message }
}

export const createComment = async (catchId, userId, comment) => {
    const catchToComment = await CatchRepository.getCatchByIdMongooseDoc(catchId);
    if (!catchToComment) throw new NotFoundError("Catch not found.");

    const user = await UserRepository.findById(userId);
    if (!user) throw new NotFoundError("User not found.");

    const updatedComments = await CatchRepository.commentOnCatchById(catchId, userId, comment);

    await NotificationService.createNotification({
        from: userId,
        to: catchToComment.user._id,
        type: "comment",
    });

    return updatedComments
}

export const deleteComment = async (catchId, userId, commentId) => {
    const catchToDeleteComment = await CatchRepository.getCatchByIdMongooseDoc(catchId);
    if (!catchToDeleteComment) throw new NotFoundError("Catch not found.");

    const user = await UserRepository.findById(userId);
    if (!user) throw new NotFoundError("User not found.");

    const CommentExists = catchToDeleteComment.comments.find(comment => comment._id.toString() === commentId);
    if (!CommentExists) throw new NotFoundError("Comment not found.");

    if (CommentExists && CommentExists.user._id.toString() !== userId.toString()) throw new AuthenticationError("Unauthorized - User is not authorized to delete this comment.");

    await CatchRepository.deleteCommentById(catchId, commentId);
    return "Comment deleted successfully."

}

export const updateComment = async (catchId, userId, commentId, comment) => {
    const catchToUpdateComment = await CatchRepository.getCatchByIdMongooseDoc(catchId);
    if (!catchToUpdateComment) throw new NotFoundError("Catch not found.");

    const user = await UserRepository.findById(userId);
    if (!user) throw new NotFoundError("User not found.");

    const CommentExists = catchToUpdateComment.comments.find(comment => comment._id.toString() === commentId);
    if (!CommentExists) throw new NotFoundError("Comment not found.");

    if (CommentExists && CommentExists.user._id.toString() !== userId.toString()) throw new AuthenticationError("Unauthorized - User is not authorized to update this comment.");

    const updatedComment = await CatchRepository.updateCommentById(catchId, commentId, comment);
    return updatedComment
}

