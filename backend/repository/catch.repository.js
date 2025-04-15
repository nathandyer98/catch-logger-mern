import Catch from "../models/catch.model.js";

class CatchRepository {

    //Populate options
    userPopulate = { path: 'user', select: 'username fullName profilePic', };
    commentsPopulate = { path: 'comments.user', select: 'username fullName profilePic', };

    /**
     * Get all catches with pagination
     * @param {number} page - The page number
     * @param {number} limit - The number of items per page
     * @returns {Promise<Array<object>>} - An array of plain catch objects sorted by dateCaught.
     * Each object contains the catch details, including the user's fullname, username and profile picture, and comments.
     * Each comment contains the user's fullname, username and profile picture.
     * Returns an empty array ([]) if no other users are found.
     */
    async getCatches(page, limit) {
        return Catch.find()
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ dateCaught: -1 })
            .populate(this.userPopulate)
            .populate(this.commentsPopulate)
            .lean();
    }

    /**
     * Get all catches for a specific user ID with pagination
     * @param {string} userId - The ID of the user
     * @param {number} page - The page number
     * @param {number} limit - The number of items per page
     * @returns {Promise<Array<object>>} - An array of plain catch objects sorted by dateCaught.
     * Each object contains the catch details, including the user's fullname, username and profile picture, and comments.
     * Each comment contains the user's fullname, username and profile picture.
     * Returns an empty array ([]) if no other users are found.
     */
    async getCatchesById(userId, page, limit) {
        return Catch.find({ user: userId })
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ dateCaught: -1 })
            .populate(this.userPopulate)
            .populate(this.commentsPopulate)
            .lean();
    }

    /**
     * Get catches for people you follow with pagination
     * @param {array<string>} userIds - The IDs of the users you follow, including yourself
     * @param {number} page - The page number
     * @param {number} limit - The number of items per page
     * @returns {Promise<Array<object>>} - An array of plain catch objects sorted by dateCaught.
     * Each object contains the catch details, including the user's fullname, username and profile picture, and comments.
     * Each comment contains the user's fullname, username and profile picture.
     * Returns an empty array ([]) if no other users are found.
     */
    async getCatchesByUserIds(userIds, page, limit) {
        return Catch.find({ user: { $in: userIds } })
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ dateCaught: -1 })
            .populate(this.userPopulate)
            .populate(this.commentsPopulate)
            .lean();
    }

    /**
     * Get a catch by ID
     * @param {string} catchId - The ID of the catch
     * @returns {Promise<object>} - The catch object as a plain object. Returns null if no catch is found.
     * Each catch will contain the user's fullname, username and profile picture, and comments.
     * Each comment contains the user's fullname, username and profile picture.
     */
    async getCatchById(catchId) {
        return Catch.findById(catchId)
            .populate(this.userPopulate)
            .populate(this.commentsPopulate)
            .lean();
    }

    /**
     * Get a catch by ID
     * @param {string} catchId - The ID of the catch
     * @returns {Promise<Catch>} - The catch object. Returns null if no catch is found.
     * Each catch will contain the user's fullname, username and profile picture, and comments.
     * Each comment contains the user's fullname, username and profile picture.
     */
    async getCatchByIdMongooseDoc(catchId) {
        return Catch.findById(catchId)
            .populate(this.userPopulate)
            .populate(this.commentsPopulate)
    }

    /**
     * Create a new catch.
     * @param {object} catchData - The data for the new catch.
     * @returns {Promise<object>} - The newly created catch object as a plain object.
     */
    async createCatch(catchData) {
        const newCatch = new Catch(catchData);
        await newCatch.save();
        const catchObject = newCatch.toObject();
        return catchObject;
    }

    /**
     * Create a new catch and return it populated
     * @param {object} catchData - The data for the new catch.
     * @returns {Promise<object>} - The newly created catch poulatedobject as a plain object.
     * Each catch will contain the user's fullname, username and profile pictur
     */
    async createCatchPopulated(catchData) {
        const newCatch = new Catch(catchData);
        await newCatch.save();
        return await Catch.findById(newCatch._id)
            .populate(this.userPopulate)
            .populate(this.commentsPopulate)
            .lean()
    }

    /** 
     * Update a catch by ID.
     * @param {string} catchId - The ID of the catch to update.
     * @param {object} updatePayload - The data to update the catch with.
     * @returns {Promise<object>} - The updated catch object as a plain object.
     */
    async updateCatchById(catchId, updatePayload) {
        return Catch.findByIdAndUpdate(catchId, { $set: updatePayload },
            { new: true, runValidators: true })
            .populate(this.userPopulate)
            .populate(this.commentsPopulate)
            .lean();
    }

    /**
     * Is user the owner of the catch?
     * @param {string} userId - The ID of the user
     * @param {string} catchId - The ID of the catch
     * @returns {Promise<boolean>} - True if the user is the owner of the catch, false otherwise
     */
    async isOwner(userId, catchId) {
        const catchObject = await Catch.findById(catchId);
        return catchObject.user.equals(userId);
    }

    /**
     * Delete a catch by ID.
     * @param {string} catchId - The ID of the catch to delete.
     * @returns {Promise<object>} - The deleted catch object as a plain object.
     */
    async deleteCatchById(catchId) {
        return Catch.findByIdAndDelete(catchId).lean();
    }

    /**
     * Like a catch by ID.
     * @param {string} catchId - The ID of the catch to like.
     * @returns {Promise<Array<String>} - The updated catch's like array.
     */
    async likeCatchById(catchId, userId) {
        const updatedCatch = await Catch.findByIdAndUpdate(catchId, { $push: { likes: userId } }, { new: true });
        return updatedCatch.likes;
    }

    /**
     * Unlike a catch by ID.
     * @param {string} catchId - The ID of the catch to unlike.
     * @returns {Promise<Array<String>} - The updated catch's like array.
     */
    async unlikeCatchById(catchId, userId) {
        const updatedCatch = await Catch.findByIdAndUpdate(catchId, { $pull: { likes: userId } }, { new: true });
        return updatedCatch.likes;
    }

    /**
     * Comment on a catch by ID.
     * @param {string} catchId - The ID of the catch to comment on.
     * @param {string} userId - The ID of the user who is commenting.
     * @param {string} comment - The data for the new comment.
     * @returns {Promise<Array<object>} - Returns an array of comments.
     * Each comment contains the user's fullname, username and profile picture.
     */
    async commentOnCatchById(catchId, userId, comment) {
        const updatedCatch = await Catch.findByIdAndUpdate(catchId, { $push: { comments: { user: userId, text: comment } } }, { new: true }).populate(this.commentsPopulate);
        return updatedCatch.comments;
    }

    /**
     * Delete a comment by ID.
     * @param {string} catchId - The ID of the catch to delete the comment from.
     * @param {string} commentId - The ID of the comment to delete.
     * @returns {Promise<void>} - A promise that resolves when the comment is deleted.
     */
    async deleteCommentById(catchId, commentId) {
        return await Catch.findByIdAndUpdate(catchId, { $pull: { comments: { _id: commentId } } }, { new: true })
    }

    /**
     * Update a comment by ID.
     * @param {string} catchId - The ID of the catch to update the comment in.
     * @param {string} commentId - The ID of the comment to update.
     * @param {string} comment - The data for the new comment.
     * @returns {Promise<Array<object>} - Returns an array of comments.
     * Each comment contains the user's fullname, username and profile picture.
     */
    async updateCommentById(catchId, commentId, comment) {
        const updatedCatch = await Catch.findOneAndUpdate(
            { _id: catchId, "comments._id": commentId },
            { $set: { "comments.$.text": comment, "comments.$.updatedAt": Date.now() } },
            { new: true }
        ).populate(this.commentsPopulate);
        return updatedCatch.comments;
    }
}

export default new CatchRepository();