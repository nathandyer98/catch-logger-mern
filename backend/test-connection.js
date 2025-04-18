// test-connection.js
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from './src/models/user.model.js';

// --- ADD THIS ---
console.log('>>> Registered Mongoose models (after import):', Object.keys(mongoose.models));
console.log('>>> Is User model constructor available directly?', typeof mongoose.models.User);
// --- END ADDITION ---

mongoose.set('debug', true); // Keep trying for debug logs

// Inside runTest function in test-connection.js
async function runTest() {
    // ... (mongod setup, mongoose connect) ...
    try {
        // ... (direct driver ping check - keep this) ...
        console.log('Direct driver ping via Mongoose connection SUCCEEDED.');

        // --- Test Minimal Local Model ---
        console.log('Defining minimal local schema/model...');
        const minimalSchema = new mongoose.Schema({ name: String });
        // Use a unique name to avoid conflicts if 'Minimal' was somehow registered before
        const MinimalModel = mongoose.model(`Minimal_${Date.now()}`, minimalSchema);
        console.log('MinimalModel defined:', typeof MinimalModel, MinimalModel.modelName);

        console.log('Attempting MinimalModel.countDocuments...');
        const count = await MinimalModel.countDocuments(); // Use the minimal model
        console.log('MinimalModel count result:', count); // <<< Does this succeed?
        if (typeof count !== 'number') throw new Error('MinimalModel count failed');

        console.log('Minimal Model test seems to PASS!');
        // --- End Minimal Model Test ---

        // Now try the imported User model again (it will likely fail here)
        console.log('Attempting Imported User.countDocuments...');
        const userCount = await User.countDocuments();
        console.log('Imported User count result:', userCount);


        console.log('Full Test PASSED!'); // Will likely not be reached

    } catch (error) {
        console.error('Test FAILED:', error);
        process.exitCode = 1;
    } finally {
        // ... (cleanup) ...
    }
}
runTest();