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
    // const verficationToken = Math.floor(100000 + Math.random() * 900000).toString();
    // const verficationTokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    const newUserInput = {
        fullName,
        username: usernameLower,
        email: emailLower,
        password: hashedPassword,
        // verficationToken,
        // verficationTokenExpiry
    };

    try {
        const user = await UserRepository.createUser(newUserInput);
        return user;
    } catch (error) {
        console.error("Error creating user in repository:", error);
        throw new ServiceError(error.message);
    };
}

export const loginUser = async (email, password) => {
    try {
        const user = await UserRepository.findByEmailWithPassword(email)
        if (!user) {
            throw new AuthenticationError("Incorrect Email or Password")
        }
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            throw new AuthenticationError("Incorrect Email or Password")
        }
        delete user.password;
        return user;
    } catch (error) {
        if (error instanceof AuthenticationError) {
            throw error; // Re-throw the error if it's an authentication error
        } else if (error instanceof NotFoundError) {
            throw new NotFoundError("User not found");
        }
        // Handle other errors (e.g., database errors)
        console.error("Error logging in user:", error);
        throw new ServiceError("Failed to login due to a service issue.");
    }
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
        try {
            if (user.profilePic) {
                try {
                    await cloudinary.uploader.destroy(user.profilePic.split('/').pop().split('.')[0]);
                } catch (error) {
                    console.warn("Cloudinary delete failed:", deletedResponse);
                }
            }
            const uploadedResponse = await cloudinary.uploader.upload(profilePic, { folder: "user_profiles" });
            fieldsToUpdate.profilePic = uploadedResponse.secure_url;
        } catch (uploadError) {
            console.error("Cloudinary upload failed:", uploadError);
            throw new ServiceError("Failed to upload message image.");
        }
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