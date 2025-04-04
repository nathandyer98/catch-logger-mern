import User from "../models/user.model.js";

class UserRepository {
    /**
     * Find a user by ID. Excludes password by default.
     * @param {string} userId - User's ID
     * @returns {Promise<object|null>} - Plain User object or null 
     */
    async findById(userId) {
        return User.findById(userId).select("-password").lean();
    }

    /**
     * Find a user by ID. Excludes password by default.
     * @param {string} userId - User's ID
     * @returns {Promise<object|null>} - A User (mongoose) object or null 
     */
    async findByIdMongooseDoc(userId) {
        return User.findById(userId).select("-password");
    }

    /**
     * Find a user by email. Excludes password by default.
     * @param {string} email - User's Email
     * @returns {Promise<object|null>} - Plain User object without password or null
     */
    async findByEmail(email) {
        return User.findOne({ email }).select("-password").lean();
    }

    /**
     * Find a user by email. INCLUDES password for hashing.
     * @param {string} email - User's Email
     * @returns {Promise<object|null>} - Plain User object with password or null 
     */
    async findByEmailWithPassword(email) {
        return User.findOne({ email }).lean();
    }

    /**
     * Find a user by username. Excludes password by default.
     * @param {*} username - User's Username
     * @returns {Promise<object|null>} - Plain User object or null
     */
    async findByUsername(username) {
        return User.findOne({ username }).select("-password").lean();
    }

    /**
    * Find a user by username. Excludes password by default.
    * @param {*} username - User's Username
    * @returns {Promise<object|null>} - A User (mongoose) object or null 
    */
    async findByUsernameMongooseDoc(username) {
        return User.findOne({ username }).select("-password");
    }

    /**
     * Check if a user exists based on a query criteria. (Email and Username)
     * @param {object} query - e.g, {email: "test@emample.com", username: "testUser"}
     * @return {Promise<boolean>} - True if user exists, false otherwise
     */
    async userExists(query) {
        const result = await User.exists(query);
        return result !== null;
    }

    /**
     * Do users exist based on an array of user IDs
     * @param {Array<string>} userIds - Array of user IDs
     * @returns {Promise<boolean>} - True if all users exist, false otherwise
     */
    async checkUsersExist(userIds) {
        const userCount = await User.countDocuments({ _id: { $in: userIds } })
        return userCount === userIds.length
    }

    /**
     * Does user exist by ID?
     * @param {string} userId - User ID to check
     * @return {Promise<boolean>} - True if user exists, false otherwise
     */
    async doesUserExistById(userId) {
        const user = await User.findOne({ _id: userId });
        return user !== null;
    }

    /**
     * Create a new user. 
     * @param {object} userData - Data for new users (password should be hashed)
     * @returns {Promise<object>} - Plain User object created by the user (excluding password)
     */
    async createUser(userData) {
        const newUser = new User(userData);
        await newUser.save();
        const userObject = newUser.toObject();
        delete userObject.password;
        return userObject;
    }

    /**
     * Update a user by ID.
     * @param {string} userId - The ID of the user to update
     * @param {object} userData - Fields to update
     * @return {Promise<object|null>} - Plain User object (excluding password) or null if not found
     */
    async updateUserById(userId, userData) {
        return User.findByIdAndUpdate(userId, userData, { new: true, runValidators: true }).select("-password").lean();
    }

    /**
     * Find users matching the username query, excluding current user in search.
     * @param {string} usernameQuery - A query string to search within users' usernames.
     * @param {string} currentUserId -  The ID of the user performing the search (to exclude them).
     * @return {Promise<Array<object>>|null>} - A list of plain user objects (excluding password, and email) matching the query.
     */
    async findUsersByUsernameQuery(currentUserId, usernameQuery) {
        return User.find({ username: { $regex: usernameQuery, $options: "i" }, _id: { $ne: currentUserId } })
            .select("-password -email")
            .limit(10)
            .lean();
    }

    /**
     * Follow a user by Id and return the target User.
     * @param {string} currentUserId - The ID of the current user
     * @param {string} targetUserId - The ID of the target user the current user intends to follow
     * @return {Promise<object|null>} - Plain User object (excluding password) or null if not found
     */
    async followUserById(currentUserId, targetUserId) {
        await User.findByIdAndUpdate(currentUserId, { $push: { following: targetUserId } }, { new: true });
        return User.findByIdAndUpdate(targetUserId, { $push: { followers: currentUserId } }, { new: true }).select("-password").lean();
    }

    /**
    * Unfollow a user by Id and return the target User.
    * @param {string} currentUserId - The ID of the current user
    * @param {string} targetUserId - The ID of the target user the current user intends to unfollow
    * @return {Promise<object|null>} - Plain User object (excluding password) or null if not found
    */
    async unfollowUserById(currentUserId, targetUserId) {
        await User.findByIdAndUpdate(currentUserId, { $pull: { following: targetUserId } }, { new: true });
        return User.findByIdAndUpdate(targetUserId, { $pull: { followers: currentUserId } }, { new: true }).select("-password").lean();
    }

    /**
     * Retrieves the list of user IDs that a specific user is following.
     * @param {string} userId - The ID of the user whose 'following' list is to be fetched
     * @return {Promise<object|null>} - A User object containing the user's _id and their 'following' array, or null if the user is not found.
     */
    async getFollowingList(userId) {
        return User.findById(userId).select('following').lean();
    }

    /**
     * Fetches a limited sample of users, excluding a specific user by ID.
     * Only includes essential profile fields in the results.
     * @param {string} userId - The ID of the user to exclude from the results.
     * @return {Promise<Array<object>>} - An array of up to 10 plain user objects, excluding the specified user.
     * Each object contains the _id, fullName, username, and profilePic.
     * Returns an empty array ([]) if no other users are found.
     */
    async findOtherUsersSample(userId) {
        return User.find({ _id: { $ne: userId } })
            .limit(10)
            .select("_id fullName username profilePic")
            .lean();
    }

    /**
     * Like a catch by ID. And add it to the user's likedCatches.
     * @param {string} catchId - The ID of the catch to like.
     * @param {string} userId - The ID of the user who is liking the catch.
     * @returns {Promise<void>} - A promise that resolves when the catch is liked.
     */
    async likeCatchById(catchId, userId) {
        await User.findByIdAndUpdate(userId, { $push: { likedCatches: catchId } }, { new: true });
    }

    /**
    * Unlike a catch by ID. And remove it from the user's likedCatches.
    * @param {string} catchId - The ID of the catch to unlike.
    * @param {string} userId - The ID of the user who is liking the catch.
    * @returns {Promise<void>} - A promise that resolves when the catch is unliked.
    */
    async unlikeCatchById(catchId, userId) {
        await User.findByIdAndUpdate(userId, { $pull: { likedCatches: catchId } }, { new: true });
    }
}

export default new UserRepository();