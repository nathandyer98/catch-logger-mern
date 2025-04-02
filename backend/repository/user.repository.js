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
     * Find a user by email.Excludes password by default.
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
     * Find a user by username. Excludes password by default
     * @param {*} username - User's Username
     * @returns {Promise<object|null>} - Plain User object or null
     */
    async findByUsername(username) {
        return User.findOne({ username }).lean();
    }

    /**
     * Check if a user exists based on a query criteria. (Email and Username)
     * @param {object} query - e.g. {email: "test@emample.com", username: "testUser"}
     * @return {Promise<boolean>} - True if user exists, false otherwise
     */
    async userExists(query) {
        const result = await User.exists(query);
        return result !== null;
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
     * Update a user by ID
     * @param {string} userId - The ID of the user to update
     * @param {object} userData - Fields to update
     * @return {Promise<object|null>} - Plain User object (excluding password) or null if not found
     */
    async updateUseById(userId, userData) {
        return User.findByIdAndUpdate(userId, userData, { new: true, runValidators: true }).select("-password").lean();
    }

}

export default new UserRepository();