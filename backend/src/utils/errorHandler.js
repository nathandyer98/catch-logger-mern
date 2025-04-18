import {
    AuthenticationError,
    UserInputError,
    ConflictError,
    NotFoundError,
    ServiceError,
    ApplicationError
} from '../errors/applicationErrors.js';
import mongoose from 'mongoose';

/**
 * Sends appropriate HTTP error response based on caught error type.
 * @param {Error} error - The error caught in the controller.
 * @param {object} res - The Express response object.
 */
export const handleControllerError = (error, res) => {
    console.error("Controller Error Caught:", error.name, "-", error.message);

    //  --- Handle Specific Custom Application Errors ---
    if (error instanceof AuthenticationError) {
        res.status(error.statusCode || 400).json({ message: error.message });
    } else if (error instanceof UserInputError) {
        res.status(error.statusCode || 400).json({ message: error.message });
    } else if (error instanceof ConflictError) {
        res.status(error.statusCode || 409).json({ message: error.message });
    } else if (error instanceof NotFoundError) {
        res.status(error.statusCode || 404).json({ message: error.message });
    } else if (error instanceof ServiceError) {
        res.status(error.statusCode || 500).json({ message: error.message });
    } else if (error instanceof ApplicationError) {
        res.status(error.statusCode || 500).json({ message: error.message });
    }

    //  --- Handle Mongoose Errors ---
    else if (error instanceof mongoose.Error.CastError) {
        res.status(400).json({ message: `Invalid format for resource ID: ${error.path}` });
    } else if (error instanceof mongoose.Error.ValidationError) {
        const errors = Object.values(error.errors).map(el => el.message);
        res.status(400).json({ message: "Validation Failed", errors: errors });
    }

    // --- Handle Base Custom Error (if any others exist) ---
    else if (error instanceof ApplicationError) {
        res.status(error.statusCode || 500).json({ message: error.message });
    }

    // --- Default Fallback for Unhandled/Unexpected Errors ---
    else {
        console.error("Unhandled Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}
