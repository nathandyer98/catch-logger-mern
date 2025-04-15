import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt from 'bcryptjs';
import Conversation from '../models/conversation.model.js';
import Message from '../models/message.model.js';
import User from '../models/user.model.js';
import { user1Fixture, user2Fixture, user3Fixture, user4Fixture } from './fixtures/users.fixture.js';
import { createLoggedInAgent, createUnloggedInAgent } from './utils/apiTestAgent.js';
jest.mock('../lib/cloudinary.js');
import cloudinary from '../lib/cloudinary.js';

let mongoServer;
let agentUser1, agentUser2, agentUser3, unauthenticatedAgent;
let user1Participant, user2Participant, user3Participant, user4Participant;

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

const createParticipantData = (userData) => {
    return {
        _id: userData._id.toString(),
        fullName: userData.fullName,
        username: userData.username,
        profilePic: userData.profilePic,
    };
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
    await Conversation.deleteMany({});
    await Message.deleteMany({});

    user1Participant = createParticipantData(await createUser(user1Fixture))
    user2Participant = createParticipantData(await createUser(user2Fixture))
    user3Participant = createParticipantData(await createUser(user3Fixture))
    user4Participant = createParticipantData(await createUser(user4Fixture))

    try {
        agentUser1 = await createLoggedInAgent(user1Fixture);
        agentUser2 = await createLoggedInAgent(user2Fixture);
        agentUser3 = await createLoggedInAgent(user3Fixture);

        unauthenticatedAgent = createUnloggedInAgent();
    } catch (error) {
        console.error('Error setting up agent users in beforeEach:', error);
        throw error;
    }
});

//Test suit for retrieving all conversations for a user
describe('GET /api/conversations', () => {
    it('should retrieve an empty array of conversations for a user', async () => {
        const response = await agentUser1.get('/api/conversations/');
        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(0);
        expect(Array.isArray(response.body)).toBe(true);
    });

    it('should only retrieve the new direct conversation by the person who created it', async () => {
        const response = await agentUser1.get('/api/conversations/');
        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(0);


        //Creating a direct conversation with user2
        await agentUser1.post('/api/conversations/').send({ participants: [user2Participant._id] });
        const response2 = await agentUser1.get('/api/conversations/');
        expect(response2.status).toBe(200);
        expect(response2.body).toHaveLength(1);
        expect(response2.body[0]).toHaveProperty('_id', expect.any(String));
        expect(response2.body[0]).toHaveProperty('type', 'Direct');
        expect(response2.body[0]).toHaveProperty('participants', expect.arrayContaining([user1Participant, user2Participant]));
        expect(response2.body[0]).toHaveProperty('lastMessage', null);
        expect(response2.body[0]).toHaveProperty('lastMessageAt', null);
        expect(response2.body[0]).toHaveProperty('createdAt', expect.any(String));
        expect(response2.body[0]).toHaveProperty('updatedAt', expect.any(String));

        //Conversation should not be accessible visible to user2
        const response3 = await agentUser2.get('/api/conversations/');
        expect(response3.status).toBe(200);
        expect(response3.body).toHaveLength(0);
    })

    it('should retrieve the all group conversations for all participants', async () => {
        //Initial check
        const response = await agentUser1.get('/api/conversations/');
        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(0);

        const respone2 = await agentUser2.get('/api/conversations/');
        expect(respone2.status).toBe(200);
        expect(respone2.body).toHaveLength(0);

        const response3 = await agentUser3.get('/api/conversations/');
        expect(response3.status).toBe(200);
        expect(response3.body).toHaveLength(0);


        //Creating a group conversation with user2 and user3
        await agentUser1.post('/api/conversations/').send({ participants: [user2Participant._id, user3Participant._id] });

        //Should now fetch the new group conversation
        const response4 = await agentUser1.get('/api/conversations/');
        expect(response4.status).toBe(200);
        expect(response4.body).toHaveLength(1);
        expect(response4.body[0]).toHaveProperty('_id', expect.any(String));
        expect(response4.body[0]).toHaveProperty('type', 'Group');
        expect(response4.body[0]).toHaveProperty('participants', expect.arrayContaining([user1Participant, user2Participant, user3Participant]));
        expect(response4.body[0]).toHaveProperty('lastMessage', null);
        expect(response4.body[0]).toHaveProperty('lastMessageAt', null);
        expect(response4.body[0]).toHaveProperty('createdAt', expect.any(String));
        expect(response4.body[0]).toHaveProperty('updatedAt', expect.any(String));

        const response5 = await agentUser2.get('/api/conversations/');
        expect(response5.status).toBe(200);
        expect(response5.body).toHaveLength(1);

        const response6 = await agentUser3.get('/api/conversations/');
        expect(response6.status).toBe(200);
        expect(response6.body).toHaveLength(1);

    })

    it('should return 401 if user is not logged in', async () => {
        const response = await unauthenticatedAgent.get('/api/conversations/');
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message', 'Unauthorized - No token');
    });

});

//Test suit for creating conversations
describe('POST /api/conversations/', () => {
    it('should create a direct conversation', async () => {
        const response = await agentUser1.post('/api/conversations/').send({ participants: [user2Participant._id] });
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('_id', expect.any(String));
        expect(response.body).toHaveProperty('type', 'Direct');
        expect(response.body).toHaveProperty('participants', expect.arrayContaining([user1Participant, user2Participant]));
        expect(response.body).toHaveProperty('accessedBy', expect.arrayContaining([user1Participant._id]));
        expect(response.body).toHaveProperty('lastMessage', null);
        expect(response.body).toHaveProperty('lastMessageAt', null);

        const dbConversation = await Conversation.findById(response.body._id);
        expect(dbConversation).not.toBeNull();
        expect(dbConversation).toHaveProperty('type', 'Direct');
        expect(dbConversation.participants.map(id => id.toString())).toEqual(expect.arrayContaining([user2Participant._id, user1Participant._id]));
        expect(dbConversation.accessedBy.map(id => id.toString())).toEqual(expect.arrayContaining([user1Participant._id]));
        expect(dbConversation).toHaveProperty('lastMessage', null);
        expect(dbConversation).toHaveProperty('lastMessageAt', null);
        expect(dbConversation).toHaveProperty('createdAt', expect.any(Date));
        expect(dbConversation).toHaveProperty('updatedAt', expect.any(Date));
    });

    it('should add user to already existing direct conversation', async () => {
        //User1 creating the direct conversation with user2
        const response = await agentUser1.post('/api/conversations/').send({ participants: [user2Participant._id] });
        const initalConversationId = response.body._id;
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('_id', expect.any(String));
        expect(response.body).toHaveProperty('type', 'Direct');
        expect(response.body).toHaveProperty('participants', expect.arrayContaining([user1Participant, user2Participant]));
        expect(response.body).toHaveProperty('accessedBy', expect.arrayContaining([user1Participant._id]));
        expect(response.body).toHaveProperty('lastMessage', null);
        expect(response.body).toHaveProperty('lastMessageAt', null);

        //Checking database for conversation
        const dbConversation = await Conversation.findById(initalConversationId);
        expect(dbConversation).not.toBeNull();
        expect(dbConversation).toHaveProperty('type', 'Direct');
        expect(dbConversation.participants.map(id => id.toString())).toEqual(expect.arrayContaining([user2Participant._id, user1Participant._id]));
        expect(dbConversation.accessedBy.map(id => id.toString())).toEqual(expect.arrayContaining([user1Participant._id]));
        expect(dbConversation).toHaveProperty('lastMessage', null);
        expect(dbConversation).toHaveProperty('lastMessageAt', null);
        expect(dbConversation).toHaveProperty('createdAt', expect.any(Date));
        expect(dbConversation).toHaveProperty('updatedAt', expect.any(Date));

        //User2 creating a conversation with user1, should add user2 to existing conversation
        const response2 = await agentUser2.post('/api/conversations/').send({ participants: [user1Participant._id] });
        expect(response2.status).toBe(201);
        expect(response2.body).toHaveProperty('_id', initalConversationId);
        expect(response2.body).toHaveProperty('type', 'Direct');
        expect(response2.body).toHaveProperty('participants', expect.arrayContaining([user1Participant, user2Participant]));
        expect(response2.body).toHaveProperty('accessedBy', expect.arrayContaining([user1Participant._id, user2Participant._id]));
        expect(response2.body).toHaveProperty('lastMessage', null);
        expect(response2.body).toHaveProperty('lastMessageAt', null);

        //Checking database for conversation update
        const dbConversation2 = await Conversation.findById(initalConversationId);
        expect(dbConversation2).not.toBeNull();
        expect(dbConversation2).toHaveProperty('type', 'Direct');
        expect(dbConversation2.participants.map(id => id.toString())).toEqual(expect.arrayContaining([user2Participant._id, user1Participant._id]));
        expect(dbConversation2.accessedBy.map(id => id.toString())).toEqual(expect.arrayContaining([user1Participant._id, user2Participant._id]));
        expect(dbConversation2).toHaveProperty('lastMessage', null);
        expect(dbConversation2).toHaveProperty('lastMessageAt', null);
        expect(dbConversation2).toHaveProperty('createdAt', expect.any(Date));
        expect(dbConversation2).toHaveProperty('updatedAt', expect.any(Date));
    });

    it('should create a group conversation', async () => {
        //User1 creating a conversation with user2 and user3
        const response = await agentUser1.post('/api/conversations/').send({ participants: [user2Participant._id, user3Participant._id] });
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('_id', expect.any(String));
        expect(response.body).toHaveProperty('type', 'Group');
        expect(response.body).toHaveProperty('participants', expect.arrayContaining([user1Participant, user2Participant, user3Participant]));
        expect(response.body).toHaveProperty('accessedBy', expect.arrayContaining([user1Participant._id, user2Participant._id, user3Participant._id]));
        expect(response.body).toHaveProperty('lastMessage', null);
        expect(response.body).toHaveProperty('lastMessageAt', null);

        //Checking database for conversation
        const dbConversation = await Conversation.findById(response.body._id);
        expect(dbConversation).not.toBeNull();
        expect(dbConversation).toHaveProperty('type', 'Group');
        expect(dbConversation.participants.map(id => id.toString())).toEqual(expect.arrayContaining([user1Participant._id, user2Participant._id, user3Participant._id]));
        expect(dbConversation.accessedBy.map(id => id.toString())).toEqual(expect.arrayContaining([user1Participant._id, user2Participant._id, user3Participant._id]));
        expect(dbConversation).toHaveProperty('lastMessage', null);
        expect(dbConversation).toHaveProperty('lastMessageAt', null);
    });

    it('should return 400 if participants are not provided', async () => {
        const response = await agentUser1.post('/api/conversations/').send({ participants: [] });
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message', 'No participants provided.');
    });

    it('should return 400 if user tries to create a conversation with only themselves', async () => {
        const response = await agentUser1.post('/api/conversations/').send({ participants: [user1Participant._id] });
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message', 'You cannot create a conversation with yourself.');
    });

    it('should return 401 if user is not logged in', async () => {
        const response = await unauthenticatedAgent.post('/api/conversations/')
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message', 'Unauthorized - No token');
    });
})

//Test suit for deleting a conversation
describe('DELETE /api/conversations/:conversationId', () => {
    it('should remove the user from the accessed by for direct conversations', async () => {
        //creating the conversation
        const response = await agentUser1.post('/api/conversations/').send({ participants: [user2Participant._id] });
        const conversationId = response.body._id;

        //deleting the conversation
        const response2 = await agentUser1.delete(`/api/conversations/${conversationId}`);
        expect(response2.status).toBe(200);

        //checking database, direct conversations persist
        const dbConversation = await Conversation.findById(conversationId);
        expect(dbConversation).not.toBeNull();
        expect(dbConversation).toHaveProperty('type', 'Direct');
        expect(dbConversation.participants.map(id => id.toString())).toEqual(expect.arrayContaining([user1Participant._id, user2Participant._id]));
        expect(dbConversation.accessedBy).toEqual(expect.not.arrayContaining([user1Participant._id]));
        expect(dbConversation).toHaveProperty('lastMessage', null);
        expect(dbConversation).toHaveProperty('lastMessageAt', null);
    });

    it('should remove the user from the accessed by for group conversations when they are not the last user', async () => {
        //creating the conversation
        const response = await agentUser1.post('/api/conversations/').send({ participants: [user2Participant._id, user3Participant._id] });
        const conversationId = response.body._id;

        //deleting the conversation
        const response2 = await agentUser1.delete(`/api/conversations/${conversationId}`);
        expect(response2.status).toBe(200);

        //checking database, group conversations persists until the last user leaves
        const dbConversation = await Conversation.findById(conversationId);
        expect(dbConversation).not.toBeNull();
        expect(dbConversation).toHaveProperty('type', 'Group');
        expect(dbConversation.participants.map(id => id.toString())).toEqual(expect.arrayContaining([user1Participant._id, user2Participant._id, user3Participant._id]));
        expect(dbConversation.accessedBy).toEqual(expect.not.arrayContaining([user1Participant._id]));
        expect(dbConversation.accessedBy.map(id => id.toString())).toEqual(expect.arrayContaining([user2Participant._id, user3Participant._id]));
        expect(dbConversation).toHaveProperty('lastMessage', null);
        expect(dbConversation).toHaveProperty('lastMessageAt', null);
    });

    it('should delete the conversation for group conversations when they are the last user', async () => {
        //creating the conversation
        const response = await agentUser1.post('/api/conversations/').send({ participants: [user2Participant._id, user3Participant._id] });
        expect(response.status).toBe(201);
        const conversationId = response.body._id;

        //user 1 leaving the conversation
        const response2 = await agentUser1.delete(`/api/conversations/${conversationId}`);
        expect(response2.status).toBe(200);
        expect(response2.body).toHaveProperty('message', 'You have left the group conversation successfully.');

        //checking database after user 1 leaves
        const dbConversation1 = await Conversation.findById(conversationId);
        expect(dbConversation1).not.toBeNull();
        expect(dbConversation1).toHaveProperty('type', 'Group');
        expect(dbConversation1.participants.map(id => id.toString())).toEqual(expect.arrayContaining([user1Participant._id, user2Participant._id, user3Participant._id]));
        expect(dbConversation1.accessedBy).toEqual(expect.not.arrayContaining([user1Participant._id]));
        expect(dbConversation1.accessedBy.map(id => id.toString())).toEqual(expect.arrayContaining([user2Participant._id, user3Participant._id]));
        expect(dbConversation1).toHaveProperty('lastMessage', null);
        expect(dbConversation1).toHaveProperty('lastMessageAt', null);

        //user 2 leaving the conversation
        const response3 = await agentUser2.delete(`/api/conversations/${conversationId}`);
        expect(response3.status).toBe(200);
        expect(response3.body).toHaveProperty('message', 'You have left the group conversation successfully.');

        //checking database after user 2 leaves
        const dbConversation2 = await Conversation.findById(conversationId);
        expect(dbConversation2).not.toBeNull();
        expect(dbConversation2).toHaveProperty('type', 'Group');
        expect(dbConversation2.participants.map(id => id.toString())).toEqual(expect.arrayContaining([user1Participant._id, user2Participant._id, user3Participant._id]));
        expect(dbConversation2.accessedBy).toEqual(expect.not.arrayContaining([user1Participant._id, user2Participant._id]));
        expect(dbConversation2.accessedBy.map(id => id.toString())).toEqual(expect.arrayContaining([user3Participant._id]));
        expect(dbConversation2).toHaveProperty('lastMessage', null);
        expect(dbConversation2).toHaveProperty('lastMessageAt', null);

        //user 3 leaving the conversation, should delete the conversation
        const response4 = await agentUser3.delete(`/api/conversations/${conversationId}`);
        expect(response4.status).toBe(200);
        expect(response4.body).toHaveProperty('message', 'Group conversation deleted successfully.');

        //checking database, group conversations persists until the last user leaves
        const dbConversation = await Conversation.findById(conversationId);
        expect(dbConversation).toBeNull();
    });

    it('should return 401 if user is not logged in', async () => {
        const response = await unauthenticatedAgent.delete(`/api/conversations/${new mongoose.Types.ObjectId().toString()}`);
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message', 'Unauthorized - No token');
    });

    it('should return 404 if conversation is not found', async () => {
        const response = await agentUser1.delete(`/api/conversations/${new mongoose.Types.ObjectId().toString()}`);
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('message', 'Conversation not found.');
    });

    it('should return 401 if user is not the apart of the conversations accesed by', async () => {
        const response = await agentUser1.post('/api/conversations/').send({ participants: [user3Participant._id] });
        const conversationId = response.body._id;

        const response2 = await agentUser2.delete(`/api/conversations/${conversationId}`);
        expect(response2.status).toBe(401);
        expect(response2.body).toHaveProperty('message', 'Unauthorized - User is not authorized to delete this conversation.');
    });
});
