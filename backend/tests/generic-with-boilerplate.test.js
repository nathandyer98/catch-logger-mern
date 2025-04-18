import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../src/models/user.model.js'; // Assuming path is correct

// Include other necessary imports like bcrypt if hashPassword is used in beforeEach

let mongoServer;

// --- Your existing beforeAll ---
beforeAll(async () => {
    try {
        // --- ENSURE IT'S HERE ---
        console.log('Enabling Mongoose Debugging...');
        mongoose.set('debug', true);
        console.log('Setting up MongoDB Memory Server (Generic)...');
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        console.log('Memory Server URI (Generic):', mongoUri);
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 30000, // Increased from default 30000 (might not change much)
            connectTimeoutMS: 15000,        // Default 30000 usually
            socketTimeoutMS: 45000,         // Default 0 (no timeout), let's add one
            bufferTimeoutMS: 20000,          // Default 10000, increase buffer specifically
            useNewUrlParser: true, useUnifiedTopology: true
        });
        console.log(`MongoDB Memory Server started (Generic)`);
        console.log('>>> Mongoose connection state (Generic beforeAll):', mongoose.connection.readyState);
        console.log('>>> Mongoose Connection Host:', mongoose.connection.host);
        console.log('>>> Mongoose Connection Port:', mongoose.connection.port);
        console.log('>>> Mongoose Connection DB Name:', mongoose.connection.name);
        if (mongoose.connection.readyState !== 1) {
            throw new Error('Mongoose connection failed to reach readyState 1');
        }
    } catch (error) {
        console.error('Error during test setup (Generic beforeAll):', error);
        process.exit(1);
    }
}, 30000); // Longer timeout for setup

// --- Your existing afterAll ---
afterAll(async () => {
    try {
        console.log('Disconnecting Mongoose (Generic)...');
        await mongoose.disconnect();
        if (mongoServer) {
            console.log('Stopping MongoDB Memory Server (Generic)...');
            await mongoServer.stop();
        }
    } catch (error) {
        console.error('Error during test teardown (Generic afterAll):', error);
    }
}, 30000);


// --- Your existing beforeEach (Likely to timeout here) ---
beforeEach(async () => {
    console.log('--- Entering beforeEach (Generic) ---');
    // Add delay if you were testing that:
    // await new Promise(resolve => setTimeout(resolve, 200));
    try {
        console.log('>>> Checking User model (Generic beforeEach):', typeof User, User?.modelName);
        if (!User || typeof User.deleteMany !== 'function') {
            throw new Error('User model is invalid in Generic beforeEach!');
        }

        console.log('Attempting User.deleteMany (Generic)...');
        await User.deleteMany({}); // <-- PROBLEM AREA
        console.log('User.deleteMany completed (Generic).');

        // Include other setup from your original beforeEach if needed for context,
        // but know this might not be reached due to the timeout above.
        // e.g., hashing, creating initial users...

    } catch (error) {
        console.error('!!! ERROR occurred within beforeEach (Generic) !!!:', error);
        process.exit(1);
    }
    console.log('--- Exiting beforeEach (Generic) ---');
}, 20000); // Timeout for the hook itself


// --- Simple Test Suite ---
describe('Generic Test Suite with Boilerplate', () => {
    it('should run a basic expectation after setup hooks', () => {
        // This test likely won't run if beforeEach times out
        console.log('--- Running simple "it" block (Generic) ---');
        expect(true).toBe(true);
        console.log('--- Simple "it" block passed (Generic) ---');
    });

    it('should perform simple addition', () => {
        // This test likely won't run if beforeEach times out
        console.log('--- Running addition "it" block (Generic) ---');
        expect(1 + 1).toBe(2);
        console.log('--- Addition "it" block passed (Generic) ---');
    });
});