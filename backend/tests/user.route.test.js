import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../src/index.js';
import bcrypt from 'bcryptjs';
import User from '../models/user.model.js'; // Adjust the path to your User model
jest.mock('../lib/cloudinary.js');

let mongoServer;
let agentUser1, agentUser2;
let user1Object, user2Object, user3Object, user4Object;

let user1 = {
    email: 'testuser@example.com',
    password: 'password123',
    fullName: 'Test User',
    username: 'testuser',
};

let user2 = {
    email: 'testuser2@example.com',
    password: 'password123',
    fullName: 'Test User 2',
    username: 'testuser2',
};

let user3 = {
    email: 'testuser3@example.com',
    password: 'password123',
    fullName: 'Test User 3',
    username: 'testuser3',
};

let user4 = {
    email: 'testuser4@example.com',
    password: 'password123',
    fullName: 'Test User 4',
    username: 'testuser4',
};


const hashPassword = async (password = 'password123') => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};


const createLoggedinUser = async ({ email, password = "password123" }) => {
    const agent = request.agent(app);
    const res = await agent.post('/api/auth/login').send({ email, password });
    if (res.status !== 200) {
        console.log(`Failed to login user: ${email}`, res.body);
        throw new Error(`Failed to login user: ${email} in agent setup`);
    }
    return agent;
}


beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log(`MongoDB Memory Server started at ${mongoUri}`);
});


afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    console.log('MongoDB Memory Server stopped');
});

beforeEach(async () => {
    await User.deleteMany({});

    const hashedPassword = await hashPassword();
    const user1Doc = new User({ ...user1, password: hashedPassword });
    const user2Doc = new User({ ...user2, password: hashedPassword });
    const user3Doc = new User({ ...user3, password: hashedPassword });
    const user4Doc = new User({ ...user4, password: hashedPassword });

    await user1Doc.save();
    await user2Doc.save();
    await user3Doc.save();
    await user4Doc.save();

    user1Object = user1Doc.toObject();
    user2Object = user2Doc.toObject();
    user3Object = user3Doc.toObject();
    user4Object = user4Doc.toObject();

    try {
        agentUser1 = await createLoggedinUser(user1);
        agentUser2 = await createLoggedinUser(user2);
    } catch (error) {
        console.error('Error setting up agent users in beforeEach:', error);
        throw error;
    }
});

//Test Suit for Get User Profile
describe('GET /api/users/:username/profile', () => {
    it('should get user profile of an existing user', async () => {
        const targetUser = user1Object.username;
        const res = await agentUser2.get(`/api/users/${targetUser}/profile`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('_id', user1Object._id.toString());
        expect(res.body).toHaveProperty('email', user1Object.email);
        expect(res.body).toHaveProperty('fullName', user1Object.fullName);
        expect(res.body).toHaveProperty('username', user1Object.username);
        expect(res.body).toHaveProperty('bio', user1Object.bio);
        expect(res.body).toHaveProperty('followers', expect.any(Array));
        expect(res.body).toHaveProperty('following', expect.any(Array));
        expect(res.body).toHaveProperty('likedCatches', expect.any(Array));
    });

    it('should return 404 when trying to get user profile of a non-existing user', async () => {
        const targetUser = 'nonexistentuser';
        const res = await agentUser2.get(`/api/users/${targetUser}/profile`);
        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('message', 'User not found');
    });


});

//Test Suit for Searching Users
describe('GET /api/users/search', () => {
    it('should return an empty array when no users match the query', async () => {
        const res = await agentUser2.get(`/api/users/search`).query({ username: 'nonexistentuser' });
        expect(res.status).toBe(200);
        expect(res.body).toBeInstanceOf(Array);
        expect(res.body.length).toBe(0);
    });

    it('it should return users by username query, excluding the logged-in user', async () => {
        const res = await agentUser2.get(`/api/users/search`).query({ username: 'testuser' });
        expect(res.status).toBe(200);
        expect(res.body).toBeInstanceOf(Array);
        const usernames = res.body.map(user => user.username);
        expect(usernames).toContain(user1Object.username);
        expect(usernames).toContain(user3Object.username);
        expect(usernames).toContain(user4Object.username);
        expect(usernames).not.toContain(user2Object.username);
    });

    it('should return an empty array when the query is less than 2 characters', async () => {
        const res = await agentUser2.get(`/api/users/search`).query({ username: 'a' });
        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    it('should return an empty array when the query is empty', async () => {
        const res = await agentUser2.get(`/api/users/search`).query({ username: '' });
        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });
});


//Test Suit for Follow/Unfollow User
describe('POST /api/users/:id/followUnfollow', () => {
    it('should follow an existing user', async () => {
        const res = await agentUser1.post(`/api/users/${user2Object._id}/followUnfollow`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message', 'You are now following this user.');
        expect(res.body).toHaveProperty('data._id', user2Object._id.toString());
        expect(res.body.data.followers).toContain(user1Object._id.toString());
    });

    it('should unfollow an existing user', async () => {
        await agentUser1.post(`/api/users/${user2Object._id}/followUnfollow`); // Follow the user first
        const res = await agentUser1.post(`/api/users/${user2Object._id}/followUnfollow`); // Unfollow the user
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message', 'You are no longer following this user.');
        expect(res.body).toHaveProperty('data._id', user2Object._id.toString());
        expect(res.body.data.followers).not.toContain(user1Object._id.toString());
    });

    it('should return 400 when trying to follow self', async () => {
        const res = await agentUser1.post(`/api/users/${user1Object._id}/followUnfollow`);
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('message', 'You cannot follow yourself.');
    });

    it('should return 404 when trying to follow a non-existing user', async () => {
        const randomId = new mongoose.Types.ObjectId();
        const res = await agentUser1.post(`/api/users/${randomId}/followUnfollow`);
        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('message', 'User not found');
    });
});

//Test Suit for Get Suggested Users
describe('GET /api/users/suggested', () => {
    it('should return an array of suggested users, excluding the logged-in user and users followed by the logged-in user', async () => {
        const res = await agentUser1.get(`/api/users/suggested`);
        expect(res.status).toBe(200);
        expect(res.body).toBeInstanceOf(Array);
        expect(res.body.length).toBe(3);
        const usernames = res.body.map(user => user.username);
        expect(usernames).not.toContain(user1Object.username);
        expect(usernames).toContain(user2Object.username);
        expect(usernames).toContain(user3Object.username);
        expect(usernames).toContain(user4Object.username);
        res.body.forEach(user => {
            expect(user).toHaveProperty('_id');
            expect(user).toHaveProperty('username');
            expect(user).toHaveProperty('fullName');
        });

        await agentUser1.post(`/api/users/${user2Object._id}/followUnfollow`); // Follow user2

        const res2 = await agentUser1.get(`/api/users/suggested`);
        expect(res2.status).toBe(200);
        expect(res2.body).toBeInstanceOf(Array);
        expect(res2.body.length).toBe(2);
        const usernames2 = res2.body.map(user => user.username);
        expect(usernames2).not.toContain(user1Object.username);
        expect(usernames2).not.toContain(user2Object.username);
        expect(usernames2).toContain(user3Object.username);
        expect(usernames2).toContain(user4Object.username);
        res2.body.forEach(user => {
            expect(user).toHaveProperty('_id');
            expect(user).toHaveProperty('username');
            expect(user).toHaveProperty('fullName');
        });

    });
});