import {
    AuthenticationError,
    UserInputError,
    ConflictError,
    NotFoundError,
    ServiceError,
    ApplicationError
} from '../errors/applicationErrors.js';

/**
 * Sends appropriate HTTP error response based on caught error type.
 * @param {Error} error - The error caught in the controller.
 * @param {object} res - The Express response object.
 */
export const handleControllerError = (error, res) => {
    console.error("Controller Error Caught:", error.name, "-", error.message);

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
    } else {
        res.status(500).json({ message: "Internal server error" });
    }
}