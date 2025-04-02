import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";
import UserRepository from "../repository/user.repository.js";
import {
    AuthenticationError,
    UserInputError,
    ConflictError,
    NotFoundError,
    ServiceError
} from '../errors/applicationErrors.js';


export const signUpUser = async (userData) => {
    const { fullName, email, password, username } = userData;

    const emailLower = email.toLowerCase();
    const usernameLower = username.toLowerCase();

    const emailExists = await UserRepository.userExists({ email: emailLower });
    if (emailExists) {
        throw new ConflictError("Email already exists");
    }

    const usernameExists = await UserRepository.userExists({ username: usernameLower });
    if (usernameExists) {
        throw new ConflictError("Username already taken - please choose another");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUserInput = {
        fullName,
        username: usernameLower,
        email: emailLower,
        password: hashedPassword,
    };

    try {
        const user = await UserRepository.createUser(newUserInput);
        return user;
    } catch (error) {
        console.log("Error creating user in repository:", error);
        throw new ServiceError(error.message);
    };
}

export const loginUser = async (email, password) => {
    const user = await UserRepository.findByEmailWithPassword(email)
    if (!user) {
        throw new AuthenticationError("Incorrect Email or Password")
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
        return res.status(400).json({ message: "Invalid Credentials" });
    }

    delete user.password;
    return user;
}

export const updateUserProfile = async (userId, updatePayload) => {
    const { fullName, profilePic } = updatePayload;

    const user = UserRepository.findByIdMongooseDoc(userId);
    if (!user) {
        throw new NotFoundError("User not found");
    }

    const fieldsToUpdate = {};

    if (fullName?.trim()) {
        fieldsToUpdate.fullName = fullName.trim();
    }

    if (profilePic) {
        if (user.profilePic) {
            await cloudinary.uploader.destroy(user.profilePic.split('/').pop().split('.')[0]);
        }
        const uploadedResponse = await cloudinary.uploader.upload(profilePic, { folder: "user_profiles" });
        fieldsToUpdate.profilePic = uploadedResponse.secure_url;
    }

    if (Object.keys(fieldsToUpdate).length === 0) {
        throw new UserInputError("No valid data provided for update");
    }

    try {
        const updatedUser = await UserRepository.updateUserById(userId, fieldsToUpdate);
        if (!updatedUser) {
            throw new NotFoundError("User not found during update operation.");
        }
        return updatedUser
    } catch (error) {
        console.error("Error updating user in repository:", error);
        throw new ServiceError("Failed to update user profile.");
    }
}