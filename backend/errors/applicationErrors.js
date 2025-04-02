export class ApplicationError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode
    }
}

export class AuthenticationError extends ApplicationError {
    constructor(message = "Invalid Credentials") {
        super(message, 401);
    }
}

export class AuthorizationError extends ApplicationError {
    constructor(message = "Unauthorized") {
        super(message, 403);
    }
}

export class NotFoundError extends ApplicationError {
    constructor(message = "Resource not found") {
        super(message, 404);
    }
}

export class ConflictError extends ApplicationError {
    constructor(message = "Conflict") {
        super(message, 409);
    }
}

export class ServiceError extends ApplicationError {
    constructor(message = "Internal server error") {
        super(message, 500);
    }
}

export class UserInputError extends ApplicationError {
    constructor(message = "Invalid user input") {
        super(message, 400);
    }
}