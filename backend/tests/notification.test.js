import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt from 'bcryptjs';
import Notification from '../src/models/notification.model.js';
import User from '../src/models/user.model.js';
import { user1Fixture, user2Fixture } from './fixtures/users.fixture.js';
import Catch from '../src/models/catch.model.js';
import { catch1Fixture, catch2Fixture, catch3Fixture, catch4Fixture } from './fixtures/catches.fixture.js';
import { comment1Fixture } from './fixtures/catches.comments.fixture.js';
import { createLoggedInAgent, createUnloggedInAgent } from './utils/apiTestAgent.js';
jest.mock('../src/lib/cloudinary.js');

let mongoServer;
let agentUser1, agentUser2, unauthenticatedAgent;
let user1Object, user2Object;

const createUser = async (userData) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    const user = await User.create({
        fullName: userData.fullName,
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
    });
    return user;
};

const createCatch = async (user, catchData) => {
    catchData = ({ user: user._id, ...catchData });
    const newCatch = await Catch.create(catchData);
    return newCatch;
};


beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    console.log(`MongoDB Memory Server started at ${mongoUri}`);
});


afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    console.log('MongoDB Memory Server stopped');
});



beforeEach(async () => {
    await User.deleteMany({});
    await Catch.deleteMany({});
    await Notification.deleteMany({});

    user1Object = await createUser(user1Fixture);
    user2Object = await createUser(user2Fixture);

    try {
        agentUser1 = await createLoggedInAgent(user1Fixture);
        agentUser2 = await createLoggedInAgent(user2Fixture);
        unauthenticatedAgent = createUnloggedInAgent();
    } catch (error) {
        console.error('Error setting up agent users in beforeEach:', error);
        throw error;
    }
});


// Test suit for retrieving all notifications
describe('GET /api/notifications', () => {
    it('should retrieve all notifications', async () => {
        const response = await agentUser1.get('/api/notifications');
        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(0);

        //Agent 2 follows agent 1
        await agentUser2.post(`/api/users/${user1Object._id.toString()}/followUnfollow`);
        const response1 = await agentUser1.get('/api/notifications');
        expect(response1.status).toBe(200);
        expect(response1.body).toHaveLength(1);
        expect(response1.body[0]).toHaveProperty('from', expect.objectContaining({
            _id: user2Object._id.toString(),
            fullName: user2Object.fullName,
            username: user2Object.username,
            profilePic: user2Object.profilePic
        }))
        expect(response1.body[0]).toHaveProperty('type', 'follow');

        //Agent 2 comments on Agent 1's catch
        const newCatch = await createCatch(user1Object, catch1Fixture);
        await agentUser2.post(`/api/catches/${newCatch._id.toString()}/comments`).send(comment1Fixture);
        const response2 = await agentUser1.get('/api/notifications');
        expect(response2.status).toBe(200);
        expect(response2.body).toHaveLength(2);
        expect(response2.body[0]).toHaveProperty('from', expect.objectContaining({
            _id: user2Object._id.toString(),
            fullName: user2Object.fullName,
            username: user2Object.username,
            profilePic: user2Object.profilePic
        }))
        expect(response2.body[0]).toHaveProperty('type', 'comment');

        //Agent 2 likes Agent 1's catch
        await agentUser2.post(`/api/catches/${newCatch._id.toString()}/like`);
        const response3 = await agentUser1.get('/api/notifications');
        expect(response3.status).toBe(200);
        expect(response3.body).toHaveLength(3);
        expect(response3.body[0]).toHaveProperty('from', expect.objectContaining({
            _id: user2Object._id.toString(),
            fullName: user2Object.fullName,
            username: user2Object.username,
            profilePic: user2Object.profilePic
        }))
        expect(response3.body[0]).toHaveProperty('type', 'like');
    });

    it('should return previously fetched notifications as read', async () => {

        const newCatch = await createCatch(user1Object, catch1Fixture);
        await agentUser2.post(`/api/catches/${newCatch._id.toString()}/comments`).send(comment1Fixture);
        await agentUser2.post(`/api/catches/${newCatch._id.toString()}/like`);

        const response = await agentUser1.get('/api/notifications');
        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(2);

        response.body.forEach(notification => {
            expect(notification).toHaveProperty('read', false);
            expect(notification).toHaveProperty('_id', expect.any(String));
            expect(notification).toHaveProperty('from', expect.objectContaining({
                _id: expect.any(String),
                fullName: expect.any(String),
                username: expect.any(String),
                profilePic: expect.any(String)
            }))
            expect(notification).toHaveProperty('createdAt', expect.any(String));
            expect(notification).toHaveProperty('updatedAt', expect.any(String));
        })

        const response2 = await agentUser1.get('/api/notifications');
        expect(response2.status).toBe(200);
        expect(response2.body).toHaveLength(2);

        response2.body.forEach(notification => {
            expect(notification).toHaveProperty('read', true);
            expect(notification).toHaveProperty('_id', expect.any(String));
            expect(notification).toHaveProperty('from', expect.objectContaining({
                _id: expect.any(String),
                fullName: expect.any(String),
                username: expect.any(String),
                profilePic: expect.any(String)
            }))
            expect(notification).toHaveProperty('createdAt', expect.any(String));
            expect(notification).toHaveProperty('updatedAt', expect.any(String));
        })
    });

    it('should return 401 if user is not logged in', async () => {
        const response = await unauthenticatedAgent.get('/api/notifications');
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message', 'Unauthorized - No token');
    })

});


// Test suit retrieving notications count
describe('GET /api/notifications/count', () => {
    it('should retrieve notifications count', async () => {
        const newCatch = await createCatch(user1Object, catch1Fixture);

        const response = await agentUser1.get('/api/notifications/count');
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('count', 0);

        //Agent 2 follows agent 1, count should be 1
        await agentUser2.post(`/api/users/${user1Object._id.toString()}/followUnfollow`);
        const response1 = await agentUser1.get('/api/notifications/count');
        expect(response1.status).toBe(200);
        expect(response1.body).toHaveProperty('count', 1);

        //Fetching the same count again should return 0 as it has already been read
        await agentUser1.get('/api/notifications');
        const response2 = await agentUser1.get('/api/notifications/count');
        expect(response2.status).toBe(200);
        expect(response2.body).toHaveProperty('count', 0);

        //Agent 2 comments and likes on agent 1's catch
        await agentUser2.post(`/api/catches/${newCatch._id.toString()}/comments`).send(comment1Fixture);
        await agentUser2.post(`/api/catches/${newCatch._id.toString()}/like`);

        const response3 = await agentUser1.get('/api/notifications/count');
        expect(response3.status).toBe(200);
        expect(response3.body).toHaveProperty('count', 2);

        //Fetching the same count again should return 0 as it has already been read
        await agentUser1.get('/api/notifications');
        const response4 = await agentUser1.get('/api/notifications/count');
        expect(response4.status).toBe(200);
        expect(response4.body).toHaveProperty('count', 0);
    });

    it('should return 401 if user is not logged in', async () => {
        const response = await unauthenticatedAgent.get('/api/notifications/count');
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message', 'Unauthorized - No token');
    });
});

//Test suit for deleting all notifications
describe('DELETE /api/notifications', () => {
    it('should delete all notifications', async () => {
        const newCatch = await createCatch(user1Object, catch1Fixture);
        await agentUser2.post(`/api/catches/${newCatch._id.toString()}/comments`).send(comment1Fixture);
        await agentUser2.post(`/api/catches/${newCatch._id.toString()}/like`);
        await agentUser2.post(`/api/users/${user1Object._id.toString()}/followUnfollow`);

        const response = await agentUser1.get('/api/notifications');
        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(3);

        const response1 = await agentUser1.delete('/api/notifications');
        expect(response1.status).toBe(200);
        expect(response1.body).toHaveProperty('message', 'Notifications deleted successfully.');
        const response2 = await agentUser1.get('/api/notifications');
        expect(response2.status).toBe(200);
        expect(response2.body).toHaveLength(0);
    });

    it('should return 401 if user is not logged in', async () => {
        const response = await unauthenticatedAgent.delete('/api/notifications');
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message', 'Unauthorized - No token');
    });
})

//Test suit for deleting a notification
describe('DELETE /api/notifications/:notificationId', () => {
    it('should delete a notification', async () => {
        const newCatch = await createCatch(user1Object, catch1Fixture);
        await agentUser2.post(`/api/catches/${newCatch._id.toString()}/comments`).send(comment1Fixture);
        await agentUser2.post(`/api/catches/${newCatch._id.toString()}/like`);
        await agentUser2.post(`/api/users/${user1Object._id.toString()}/followUnfollow`);

        const response = await agentUser1.get('/api/notifications');
        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(3);

        const response1 = await agentUser1.delete(`/api/notifications/${response.body[0]._id.toString()}`);
        expect(response1.status).toBe(200);
        expect(response1.body).toHaveProperty('message', 'Notification deleted successfully.');

        const response2 = await agentUser1.get('/api/notifications');
        expect(response2.status).toBe(200);
        expect(response2.body).toHaveLength(2);
    });

    it('should return 401 if user is not logged in', async () => {
        const response = await unauthenticatedAgent.delete('/api/notifications/1');
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message', 'Unauthorized - No token');
    });

    it('should return 404 if notification is not found', async () => {
        const response = await agentUser1.delete(`/api/notifications/${new mongoose.Types.ObjectId().toString()}`);
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('message', 'Notification not found.');
    });

    it('should return 403 if user is not the owner of the notification', async () => {
        const newCatch = await createCatch(user1Object, catch1Fixture);
        await agentUser2.post(`/api/catches/${newCatch._id.toString()}/comments`).send(comment1Fixture);

        const response = await agentUser1.get('/api/notifications');
        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(1);

        const noticationId = response.body[0]._id.toString();
        const response1 = await agentUser2.delete(`/api/notifications/${noticationId}`);
        expect(response1.status).toBe(403);
        expect(response1.body).toHaveProperty('message', 'Unauthorized - You are not authorized to delete this notification.');
    });
})