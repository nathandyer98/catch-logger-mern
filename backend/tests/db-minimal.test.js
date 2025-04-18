import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../src/models/user.model.js'; // Verify this path is correct

let mongod;
let mongoUri;

// Keep debug enabled - maybe it works in this simpler setup?
mongoose.set('debug', true);

beforeAll(async () => {
    try {
        console.log('[Minimal] Creating MMS...');
        mongod = await MongoMemoryServer.create();
        mongoUri = mongod.getUri();
        console.log('[Minimal] Connecting Mongoose to:', mongoUri);
        await mongoose.connect(mongoUri); // Use default options for now
        console.log('[Minimal] Mongoose connected, state:', mongoose.connection.readyState);
        if (mongoose.connection.readyState !== 1) {
            throw new Error('[Minimal] Mongoose connection failed!');
        }
    } catch (error) {
        console.error('[Minimal] beforeAll error:', error);
        process.exit(1);
    }
}, 30000); // Setup timeout

afterAll(async () => {
    try {
        console.log('[Minimal] Disconnecting Mongoose...');
        await mongoose.disconnect();
        if (mongod) {
            console.log('[Minimal] Stopping MMS...');
            await mongod.stop();
        }
        console.log('[Minimal] Teardown complete.');
    } catch (error) {
        console.error('[Minimal] afterAll error:', error);
    }
}, 30000); // Teardown timeout

describe('Minimal DB Test', () => {
    it('should perform a countDocuments operation directly in the test', async () => {
        console.log('[Minimal Test] Entering test...');
        try {
            console.log('[Minimal Test] Checking User model:', typeof User, User?.modelName);
            if (!User || typeof User.countDocuments !== 'function') {
                throw new Error('[Minimal Test] User model invalid!');
            }

            console.log('[Minimal Test] Attempting User.countDocuments...');
            // Use a simple read operation first
            const count = await User.countDocuments();
            console.log('[Minimal Test] User.countDocuments result:', count); // Do we get here?
            expect(count).toBeGreaterThanOrEqual(0); // Basic check

            // Optional: If count works, uncomment deleteMany to test it here
            // console.log('[Minimal Test] Attempting User.deleteMany...');
            // await User.deleteMany({});
            // console.log('[Minimal Test] User.deleteMany completed.');

            console.log('[Minimal Test] Test Passed.');
        } catch (error) {
            console.error('[Minimal Test] Error in test execution:', error);
            throw error; // Make Jest fail the test
        }
    }, 20000); // Test timeout
});