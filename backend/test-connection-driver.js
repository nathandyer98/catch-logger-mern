// test-connection-driver.js
import { MongoClient } from 'mongodb'; // Use the driver
import { MongoMemoryServer } from 'mongodb-memory-server';

async function runTest() {
    let mongod;
    let client;
    console.log('Starting MMS...');
    try {
        mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        console.log('Connecting MongoClient to:', uri);

        client = new MongoClient(uri);
        await client.connect(); // Connect the driver client
        console.log('MongoClient connected.');

        const db = client.db(); // Get default DB (or specify name if needed)
        console.log('Attempting db.command({ ping: 1 })...');
        const pingResult = await db.command({ ping: 1 }); // Simple command
        console.log('Ping result:', pingResult); // Should be { ok: 1 }

        if (!pingResult || pingResult.ok !== 1) throw new Error('Ping command failed');

        // Optional: Try counting documents with the driver
        const usersCollection = db.collection('users');
        console.log('Attempting usersCollection.countDocuments()...');
        const count = await usersCollection.countDocuments();
        console.log('Count result:', count);

        console.log('Test PASSED!');

    } catch (error) {
        console.error('Test FAILED:', error);
        process.exitCode = 1;
    } finally {
        if (client) {
            console.log('Closing MongoClient...');
            await client.close();
        }
        if (mongod) {
            console.log('Stopping MMS...');
            await mongod.stop();
        }
        console.log('Done.');
    }
}
runTest();