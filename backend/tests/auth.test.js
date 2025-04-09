import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt from 'bcryptjs';
import { app } from '../src/index.js';
import User from '../models/user.model.js'; // Adjust the path to your User model
import cloudinary from '../lib/cloudinary.js';


let mongoServer;
jest.mock('../lib/cloudinary.js');

//TEST CONSTANTS
const TEST_EMAIL = 'testuser@example.com';
const TEST_PASSWORD = 'password123';
const TEST_SHORT_PASSWORD = 'pass';
const TEST_USERNAME = 'testuser';
const TEST_FULLNAME = 'Test User';


// Jest Hooks for Setup and Teardown
beforeAll(async () => {
    // Start the in-memory MongoDB server before all tests
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    // Connect Mongoose to the in-memory server
    await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        // Add any other Mongoose connection options you use
    });
    console.log(`MongoDB Memory Server started at ${mongoUri}`);
});

afterAll(async () => {
    // Disconnect Mongoose and stop the in-memory server after all tests
    await mongoose.disconnect();
    await mongoServer.stop();
    console.log('MongoDB Memory Server stopped.');
});

beforeEach(async () => {
    // Clear the User collection before each test to ensure isolation
    await User.deleteMany({});
});


// Test Suite for Login Endpoint
describe('POST /api/auth/login', () => {

    // Helper function to create a user directly in the DB for testing login
    const createTestUser = async () => {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(TEST_PASSWORD, salt);
        await User.create({
            fullName: TEST_FULLNAME,
            username: TEST_USERNAME,
            email: TEST_EMAIL,
            password: hashedPassword,
        });
    };

    it('should login successfully with correct credentials and return user data and JWT cookie', async () => {
        // Arrange: Create the user in the database first
        await createTestUser();

        // Act: Send a POST request to the login endpoint
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: TEST_EMAIL,
                password: TEST_PASSWORD,
            });

        // Assert: Check the response status and body
        expect(response.statusCode).toBe(200);
        expect(response.body).toBeDefined();
        expect(response.body).toHaveProperty('_id'); // Check for ID
        expect(response.body).toHaveProperty('email', TEST_EMAIL);
        expect(response.body).toHaveProperty('username', TEST_USERNAME);
        expect(response.body).toHaveProperty('fullName', TEST_FULLNAME);
        expect(response.body).not.toHaveProperty('password'); // IMPORTANT: ensure password is NOT returned

        // Assert: Check if the JWT cookie was set
        // Supertest stores cookies in response.headers['set-cookie'] (an array)
        expect(response.headers['set-cookie']).toBeDefined();
        const jwtCookie = response.headers['set-cookie'].find(cookie => cookie.startsWith('jwt='));
        expect(jwtCookie).toBeDefined();
        expect(jwtCookie).toContain('HttpOnly'); // Assuming generateToken sets HttpOnly
        // You could add more checks like Path=/; Max-Age=... if needed
    });

    it('should return 401 Unauthorized for incorrect password', async () => {
        // Arrange: Create the user
        await createTestUser();

        // Act
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: TEST_EMAIL,
                password: 'wrongPassword123', // Incorrect password
            });

        // Assert: Check status code and error message (based on your service/controller logic)
        expect(response.statusCode).toBe(401); // Assuming AuthenticationError maps to 401
        expect(response.body).toHaveProperty('message', 'Incorrect Email or Password');
        expect(response.headers['set-cookie']).toBeUndefined(); // No cookie should be set on failure
    });

    it('should return 401 Unauthorized if user email does not exist', async () => {
        // Arrange: No user is created with this email

        // Act
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'nonexistent@example.com', // Email not in DB
                password: TEST_PASSWORD,
            });

        // Assert
        expect(response.statusCode).toBe(401); // Assuming AuthenticationError maps to 401
        expect(response.body).toHaveProperty('message', 'Incorrect Email or Password');
        expect(response.headers['set-cookie']).toBeUndefined();
    });

    it('should return 400 Bad Request if password is missing', async () => {
        // Arrange: Create the user (though not strictly necessary for this validation test)
        await createTestUser();

        // Act
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: TEST_EMAIL,
                // password field is missing
            });

        // Assert
        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('message', 'Email and Password are required');
        expect(response.headers['set-cookie']).toBeUndefined();
    });

    it('should return 400 Bad Request if email is missing', async () => {
        // Act
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                password: TEST_PASSWORD,
                // email field is missing
            });

        // Assert
        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('message', 'Email and Password are required');
        expect(response.headers['set-cookie']).toBeUndefined();
    });

    it('should return 400 Bad Request if email is empty (whitespace)', async () => {
        // Act
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: '   ', // Whitespace email
                password: TEST_PASSWORD,
            });

        // Assert
        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('message', 'Email and Password are required');
        expect(response.headers['set-cookie']).toBeUndefined();
    });

    it('should return 400 Bad Request if password is empty (whitespace)', async () => {
        // Act
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: TEST_EMAIL,
                password: '   ', // Whitespace password
            });

        // Assert
        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('message', 'Email and Password are required');
        expect(response.headers['set-cookie']).toBeUndefined();
    });

});

// Test Suite for Sign Up Endpoint
describe('POST /api/auth/signup', () => {

    it('should signup successfully with valid data, return user data (minus password), and set JWT cookie', async () => {
        // Arrange: Valid data, DB is clean via beforeEach

        // Act
        const response = await request(app)
            .post('/api/auth/signup')
            .send({
                fullName: TEST_FULLNAME,
                username: TEST_USERNAME,
                email: TEST_EMAIL,
                password: TEST_PASSWORD,
            });

        // Assert: Check Response
        expect(response.statusCode).toBe(201); // 201 Created for successful resource creation
        expect(response.body).toBeDefined();
        expect(response.body).toHaveProperty('_id');
        expect(response.body).toHaveProperty('fullName', TEST_FULLNAME);
        expect(response.body).toHaveProperty('username', TEST_USERNAME.toLowerCase()); // Service converts to lowercase
        expect(response.body).toHaveProperty('email', TEST_EMAIL.toLowerCase());    // Service converts to lowercase
        expect(response.body).not.toHaveProperty('password'); // Ensure password is NOT returned

        // Assert: Check JWT Cookie
        expect(response.headers['set-cookie']).toBeDefined();
        const jwtCookie = response.headers['set-cookie'].find(cookie => cookie.startsWith('jwt='));
        expect(jwtCookie).toBeDefined();
        expect(jwtCookie).toContain('HttpOnly'); // Assuming this flag is set

        // Assert: (Optional but recommended) Check Database directly
        const dbUser = await User.findOne({ email: TEST_EMAIL.toLowerCase() }).lean(); // Use .lean() for plain object
        expect(dbUser).toBeDefined();
        expect(dbUser).not.toBeNull();
        expect(dbUser.username).toBe(TEST_USERNAME.toLowerCase());
        expect(dbUser.password).toBeDefined(); // Check password exists (it should be hashed)
        expect(dbUser.password).not.toBe(TEST_PASSWORD); // Ensure it's not the plain password
        // Check if the stored password is a valid bcrypt hash (optional, more advanced)
        // const isHash = await bcrypt.compare(TEST_PASSWORD, dbUser.password);
        // expect(isHash).toBe(true);
    });

    it('should return 409 Conflict if email already exists', async () => {
        // Arrange: Create a user first with the target email
        await request(app) // Use the signup endpoint itself to create the user easily
            .post('/api/auth/signup')
            .send({
                fullName: "Existing User",
                username: "existinguser",
                email: TEST_EMAIL, // Use the email we want to test for duplication
                password: TEST_PASSWORD,
            });

        // Act: Try signing up again with the SAME email but different username
        const response = await request(app)
            .post('/api/auth/signup')
            .send({
                fullName: TEST_FULLNAME,
                username: "newusername", // Different username
                email: TEST_EMAIL,    // DUPLICATE email
                password: TEST_PASSWORD,
            });

        // Assert
        expect(response.statusCode).toBe(409); // Assuming ConflictError maps to 409
        expect(response.body).toHaveProperty('message', 'Email already exists');
        expect(response.headers['set-cookie']).toBeUndefined();
    });

    it('should return 409 Conflict if username already exists', async () => {
        // Arrange: Create a user first with the target username
        await request(app)
            .post('/api/auth/signup')
            .send({
                fullName: "Existing User",
                username: TEST_USERNAME, // Use the username we want to test for duplication
                email: "existing@example.com",
                password: TEST_PASSWORD,
            });

        // Act: Try signing up again with the SAME username but different email
        const response = await request(app)
            .post('/api/auth/signup')
            .send({
                fullName: TEST_FULLNAME,
                username: TEST_USERNAME, // DUPLICATE username
                email: TEST_EMAIL,       // Different email
                password: TEST_PASSWORD,
            });

        // Assert
        expect(response.statusCode).toBe(409); // Assuming ConflictError maps to 409
        expect(response.body).toHaveProperty('message', 'Username already taken - please choose another');
        expect(response.headers['set-cookie']).toBeUndefined();
    });

    it('should return 400 Bad Request if password is less than 8 characters', async () => {
        // Arrange: Use a short password

        // Act
        const response = await request(app)
            .post('/api/auth/signup')
            .send({
                fullName: TEST_FULLNAME,
                username: TEST_USERNAME,
                email: TEST_EMAIL,
                password: TEST_SHORT_PASSWORD, // Too short
            });

        // Assert
        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('message', 'Password must be at least 8 characters');
        expect(response.headers['set-cookie']).toBeUndefined();
    });

    // Use test.each for repetitive validation checks (missing/empty fields)
    const requiredFields = ['fullName', 'username', 'email', 'password'];
    const baseData = {
        fullName: TEST_FULLNAME,
        username: TEST_USERNAME,
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
    };

    // Test for missing fields
    test.each(requiredFields)(
        'should return 400 Bad Request if required field "%s" is missing',
        async (missingField) => {
            // Arrange
            const invalidData = { ...baseData };
            delete invalidData[missingField]; // Remove the field for this test case

            // Act
            const response = await request(app)
                .post('/api/auth/signup')
                .send(invalidData);

            // Assert
            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty('message', 'All fields are required');
            expect(response.headers['set-cookie']).toBeUndefined();
        }
    );

    // Test for empty/whitespace fields
    test.each(requiredFields)(
        'should return 400 Bad Request if required field "%s" is empty or whitespace',
        async (emptyField) => {
            // Arrange
            const invalidData = { ...baseData };
            invalidData[emptyField] = '   '; // Set the field to whitespace

            // Act
            const response = await request(app)
                .post('/api/auth/signup')
                .send(invalidData);

            // Assert
            expect(response.statusCode).toBe(400);
            // Your controller checks !field.trim(), so this message is correct
            expect(response.body).toHaveProperty('message', 'All fields are required');
            expect(response.headers['set-cookie']).toBeUndefined();
        }
    );

});

// Test Suite for Logout Endpoint
describe('POST /api/auth/logout', () => {

    it('should return 200, success message, clear JWT cookie, and prevent access to protected routes', async () => {
        // Arrange:
        // 1. Create user
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(TEST_PASSWORD, salt);
        await User.create({
            fullName: TEST_FULLNAME,
            username: TEST_USERNAME,
            email: TEST_EMAIL,
            password: hashedPassword,
        });

        // 2. Log the user in using an agent to establish session
        const agent = request.agent(app);
        const loginResponse = await agent
            .post('/api/auth/login')
            .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

        // Sanity check login
        expect(loginResponse.statusCode).toBe(200);
        const loginCookie = loginResponse.headers['set-cookie']?.find(c => c.startsWith('jwt='));
        expect(loginCookie).toBeDefined(); // Ensure we got a cookie

        // Act: Call the logout endpoint using the same agent
        const logoutResponse = await agent.post('/api/auth/logout').send(); // No body needed

        // Assert (Logout Response):
        expect(logoutResponse.statusCode).toBe(200);
        expect(logoutResponse.body).toEqual({ message: 'Logged out successful' }); // Use toEqual for object comparison

        // Assert (Cookie Cleared): Check the Set-Cookie header from the logout response
        expect(logoutResponse.headers['set-cookie']).toBeDefined();
        const logoutCookieHeader = logoutResponse.headers['set-cookie'].find(cookie => cookie.startsWith('jwt='));
        expect(logoutCookieHeader).toBeDefined();
        // Check that the cookie value is empty and expiry is immediate (Max-Age=0)
        expect(logoutCookieHeader).toMatch(/^jwt=;/); // Starts with 'jwt=;'
        expect(logoutCookieHeader).toMatch(/Max-Age=0/);

        // Assert (Verification): Attempt to access a protected route AFTER logout using the same agent
        const checkResponse = await agent.get('/api/auth/check'); // Agent *should* now have the cleared/expired cookie state

        // Expect access to be denied (middleware should reject)
        expect(checkResponse.statusCode).toBe(401); // Should be unauthorized now
    });

    it('should return 200 and success message even if called when not logged in', async () => {
        // Arrange: Use a fresh request instance (not logged in)
        // Act: Call logout directly
        const response = await request(app).post('/api/auth/logout').send();

        // Assert: Should still succeed gracefully
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ message: 'Logged out successful' });

        // Assert: Should still attempt to clear the cookie
        expect(response.headers['set-cookie']).toBeDefined();
        const cookieHeader = response.headers['set-cookie'].find(cookie => cookie.startsWith('jwt='));
        expect(cookieHeader).toBeDefined();
        expect(cookieHeader).toMatch(/^jwt=;/);
        expect(cookieHeader).toMatch(/Max-Age=0/);
    });

});

// Test Suite for Checking Auth token Endpoint
describe('GET /api/auth/check', () => {

    it('should return 401 Unauthorized if no token/cookie is provided', async () => {
        // Arrange: No prior login needed

        // Act: Make request directly without logging in
        const response = await request(app).get('/api/auth/check');

        // Assert: Expect middleware to block with 401
        expect(response.statusCode).toBe(401);
        // Optionally, check for a specific error message if your middleware provides one
        // expect(response.body).toHaveProperty('message', 'Unauthorized'); // Example
    });

    it('should return 401 Unauthorized if an invalid/malformed token/cookie is provided', async () => {
        // Arrange: No prior login needed

        // Act: Make request with a clearly invalid cookie
        const response = await request(app)
            .get('/api/auth/check')
            .set('Cookie', 'jwt=thisisnotavalidtoken'); // Set invalid cookie header

        // Assert: Expect middleware to reject the token and return 401
        expect(response.statusCode).toBe(401);
        // Optionally, check for a specific error message
        // expect(response.body).toHaveProperty('message', 'Invalid token'); // Example
    });

    it('should return 200 OK and user data (minus password) if a valid token/cookie is provided', async () => {
        // Arrange:
        // 1. Create a user
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(TEST_PASSWORD, salt);
        const user = await User.create({ // Get the created user ID
            fullName: TEST_FULLNAME,
            username: TEST_USERNAME,
            email: TEST_EMAIL,
            password: hashedPassword,
        });

        // 2. Log the user in to get a valid cookie using a Supertest agent
        const agent = request.agent(app); // Create an agent to persist cookies
        const loginResponse = await agent // Use the agent for the login request
            .post('/api/auth/login')
            .send({
                email: TEST_EMAIL,
                password: TEST_PASSWORD,
            });

        // Sanity check: ensure login was successful before proceeding
        expect(loginResponse.statusCode).toBe(200);
        expect(loginResponse.headers['set-cookie']).toBeDefined(); // Agent now has the cookie
        expect(agent).toBeDefined(); // Ensure agent is defined
        expect(agent.jar).toBeDefined(); // Ensure agent's cookie jar is defined

        // Act: Make the request to the protected route using the SAME agent
        const checkResponse = await agent.get('/api/auth/check'); // Agent automatically sends the cookie

        // Assert: Check the response from the protected route
        //console.log(checkResponse.body); // Log the response body for debugging
        expect(checkResponse.statusCode).toBe(200);
        expect(checkResponse.body).toBeDefined();
        expect(checkResponse.body).toHaveProperty('_id', user._id.toString()); // Verify correct user ID
        expect(checkResponse.body).toHaveProperty('email', TEST_EMAIL.toLowerCase());
        expect(checkResponse.body).toHaveProperty('username', TEST_USERNAME.toLowerCase());
        expect(checkResponse.body).toHaveProperty('fullName', TEST_FULLNAME);
        expect(checkResponse.body).not.toHaveProperty('password'); // Ensure password is NOT included
    });

    it('should return 404 Not Found if the user associated with a valid token no longer exists', async () => { // <-- Updated description slightly for clarity
        // Arrange:
        // 1. Create user and log in to get a valid cookie
        const agent = request.agent(app);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(TEST_PASSWORD, salt);
        const user = await User.create({
            fullName: TEST_FULLNAME,
            username: TEST_USERNAME,
            email: TEST_EMAIL,
            password: hashedPassword,
        });

        const loginResponse = await agent
            .post('/api/auth/login')
            .send({ email: TEST_EMAIL, password: TEST_PASSWORD });
        expect(loginResponse.statusCode).toBe(200); // Login succeeded, agent has cookie

        // 2. Delete the user from the database AFTER logging in
        await User.findByIdAndDelete(user._id);

        // Act: Attempt to access the protected route with the now-orphaned cookie
        const checkResponse = await agent.get('/api/auth/check');

        // Assert: Expect middleware to fail finding the user and return 404 (as implemented)
        expect(checkResponse.statusCode).toBe(404);
        expect(checkResponse.body).toHaveProperty('message', 'User associated with this token not found');
    });

});

// Add this describe block to your existing auth test file
// Assumes previous setup (imports, beforeAll, afterAll, beforeEach clearing User, etc.)
// Assumes TEST_EMAIL, TEST_PASSWORD, User model are available

describe('PUT /api/auth/update-profile', () => {
    let agent; // Agent for authenticated requests
    let testUser; // Store created user info

    // Set up a logged-in agent before each test in this block
    beforeEach(async () => {
        // Clear Cloudinary mock calls before each test
        cloudinary.uploader.upload.mockClear();
        cloudinary.uploader.destroy.mockClear();

        // 1. Create user
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(TEST_PASSWORD, salt);
        testUser = await User.create({ // Store user data
            fullName: TEST_FULLNAME,
            username: TEST_USERNAME,
            email: TEST_EMAIL,
            password: hashedPassword,
            profilePic: '', // Start with no profile pic
        });

        // 2. Log in user with agent
        agent = request.agent(app);
        const loginResponse = await agent
            .post('/api/auth/login')
            .send({ email: TEST_EMAIL, password: TEST_PASSWORD });
        expect(loginResponse.statusCode).toBe(200); // Ensure login works
    });

    it('should update fullName successfully', async () => {
        // Arrange
        const newFullName = "Updated Test User";

        // Act
        const response = await agent // Use the logged-in agent
            .put('/api/auth/update-profile')
            .send({ fullName: newFullName });

        // Assert Response
        expect(response.statusCode).toBe(200);
        expect(response.body).toBeDefined();
        expect(response.body).toHaveProperty('_id', testUser._id.toString());
        expect(response.body).toHaveProperty('fullName', newFullName); // Check updated name
        expect(response.body).toHaveProperty('email', TEST_EMAIL.toLowerCase()); // Ensure other fields remain
        expect(response.body).not.toHaveProperty('password');

        // Assert Database (Optional but good)
        const dbUser = await User.findById(testUser._id).lean();
        expect(dbUser.fullName).toBe(newFullName);
    });

    it('should update profilePic successfully (using mocked Cloudinary)', async () => {
        // Arrange
        const mockProfilePicData = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA..."; // Example mock data

        // Act
        const response = await agent
            .put('/api/auth/update-profile')
            .send({ profilePic: mockProfilePicData });

        // Assert Response
        expect(response.statusCode).toBe(200);
        expect(response.body).toBeDefined();
        expect(response.body).toHaveProperty('_id', testUser._id.toString());
        expect(response.body).toHaveProperty('profilePic', 'mock-cloudinary-url.jpg'); // Check URL from mock
        expect(response.body).toHaveProperty('fullName', TEST_FULLNAME); // Ensure other fields remain

        // Assert Cloudinary Mock Calls
        expect(cloudinary.uploader.upload).toHaveBeenCalledTimes(1);
        expect(cloudinary.uploader.upload).toHaveBeenCalledWith(mockProfilePicData, { folder: "user_profiles" });
        expect(cloudinary.uploader.destroy).not.toHaveBeenCalled(); // Destroy shouldn't be called if original pic was empty

        // Assert Database
        const dbUser = await User.findById(testUser._id).lean();
        expect(dbUser.profilePic).toBe('mock-cloudinary-url.jpg');
    });

    it('should update both fullName and profilePic successfully, destroying old pic', async () => {
        // Arrange: Give the initial user an existing profile pic
        const initialPicUrl = 'existing-pic-url.jpg';
        const initialPublicId = 'user_profiles/existing-pic-url'; // Assumes public ID is filename without extension
        await User.findByIdAndUpdate(testUser._id, { profilePic: initialPicUrl });

        const newFullName = "Updated Again";
        const newProfilePicData = "data:image/jpeg;base64,/9j/4AAQSkZJRgA...";

        // Act
        const response = await agent
            .put('/api/auth/update-profile')
            .send({ fullName: newFullName, profilePic: newProfilePicData });

        // Assert Response
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('fullName', newFullName);
        expect(response.body).toHaveProperty('profilePic', 'mock-cloudinary-url.jpg'); // From mock upload

        // Assert Cloudinary Mock Calls
        expect(cloudinary.uploader.destroy).toHaveBeenCalledTimes(1);
        // Your service extracts public ID like: user.profilePic.split('/').pop().split('.')[0]
        expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(initialPublicId);
        expect(cloudinary.uploader.upload).toHaveBeenCalledTimes(1);
        expect(cloudinary.uploader.upload).toHaveBeenCalledWith(newProfilePicData, { folder: "user_profiles" });

        // Assert Database
        const dbUser = await User.findById(testUser._id).lean();
        expect(dbUser.fullName).toBe(newFullName);
        expect(dbUser.profilePic).toBe('mock-cloudinary-url.jpg');
    });


    it('should return 401 Unauthorized if not authenticated', async () => {
        // Arrange: Use standard request, not agent
        const newFullName = "No Auth Update";

        // Act
        const response = await request(app) // No agent used here
            .put('/api/auth/update-profile')
            .send({ fullName: newFullName });

        // Assert
        expect(response.statusCode).toBe(401);
    });

    it('should return 400 Bad Request if no data is provided in the body', async () => {
        // Arrange: Logged in via agent

        // Act
        const response = await agent
            .put('/api/auth/update-profile')
            .send({}); // Empty body

        // Assert
        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('message', 'No data provided'); // From Controller check
    });

    it('should return 400 Bad Request if only whitespace is provided for fullName', async () => {
        // Arrange: Logged in via agent

        // Act
        const response = await agent
            .put('/api/auth/update-profile')
            .send({ fullName: '   ' }); // Whitespace only

        // Assert
        expect(response.statusCode).toBe(400);
        // This error comes from the Service layer's check after trimming
        expect(response.body).toHaveProperty('message', 'No valid data provided for update');
    });

});