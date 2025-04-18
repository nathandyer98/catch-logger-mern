import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt from 'bcryptjs';
import Conversation from '../src/models/conversation.model.js';
import Message from '../src/models/message.model.js';
import User from '../src/models/user.model.js';
import { user1Fixture, user2Fixture, user3Fixture } from './fixtures/users.fixture.js';
import { createLoggedInAgent, createUnloggedInAgent } from './utils/apiTestAgent.js';
jest.mock('../src/lib/cloudinary.js');
import cloudinary from '../src/lib/cloudinary.js';

let mongoServer;
let agentUser1, agentUser2, agentUser3, unauthenticatedAgent;
let user1Object, user2Object, user3Object

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

    cloudinary.uploader.upload.mockClear();
    cloudinary.uploader.destroy.mockClear();

    user1Object = await createUser(user1Fixture)
    user2Object = await createUser(user2Fixture)
    user3Object = await createUser(user3Fixture)

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

//Test suit for getting messages for a conversation
describe('GET /conversations/:id/messages', () => {
    it('should get messages for a conversation', async () => {
        //Creating the direct conversation and messages
        const response = await agentUser1.post('/api/conversations').send({ participants: [user2Object._id] })
        const conversationId = response.body._id

        await agentUser1.post(`/api/conversations/${conversationId}/messages`).send({ text: 'Hello' })
        await agentUser1.post(`/api/conversations/${conversationId}/messages`).send({ text: 'Hi' })

        const response2 = await agentUser1.get(`/api/conversations/${conversationId}/messages`)
        expect(response2.status).toBe(200)
        expect(response2.body).toHaveLength(2)
        expect(response2.body[0]).toHaveProperty('_id', expect.any(String));
        expect(response2.body[0]).toHaveProperty('conversationId', conversationId);
        expect(response2.body[0]).toHaveProperty('from', user1Object._id.toString());
        expect(response2.body[0]).toHaveProperty('text', 'Hello');
        expect(response2.body[0]).toHaveProperty('readBy', [user1Object._id.toString()]);
        expect(response2.body[0]).toHaveProperty('createdAt', expect.any(String));
        expect(response2.body[0]).toHaveProperty('updatedAt', expect.any(String));

        expect(response2.body[1]).toHaveProperty('_id', expect.any(String));
        expect(response2.body[1]).toHaveProperty('conversationId', conversationId);
        expect(response2.body[1]).toHaveProperty('from', user1Object._id.toString());
        expect(response2.body[1]).toHaveProperty('text', 'Hi');
        expect(response2.body[1]).toHaveProperty('readBy', [user1Object._id.toString()]);
        expect(response2.body[1]).toHaveProperty('createdAt', expect.any(String));
        expect(response2.body[1]).toHaveProperty('updatedAt', expect.any(String));

        //User 2 getting the messages, updates readBy
        const response3 = await agentUser2.get(`/api/conversations/${conversationId}/messages`)
        expect(response3.status).toBe(200)
        expect(response3.body).toHaveLength(2)
        expect(response3.body[0]).toHaveProperty('_id', expect.any(String));
        expect(response3.body[0]).toHaveProperty('conversationId', conversationId);
        expect(response3.body[0]).toHaveProperty('from', user1Object._id.toString());
        expect(response3.body[0]).toHaveProperty('text', 'Hello');
        expect(response3.body[0]).toHaveProperty('readBy', [user1Object._id.toString(), user2Object._id.toString()]);
        expect(response3.body[0]).toHaveProperty('createdAt', expect.any(String));
        expect(response3.body[0]).toHaveProperty('updatedAt', expect.any(String));

        expect(response3.body[1]).toHaveProperty('_id', expect.any(String));
        expect(response3.body[1]).toHaveProperty('conversationId', conversationId);
        expect(response3.body[1]).toHaveProperty('from', user1Object._id.toString());
        expect(response3.body[1]).toHaveProperty('text', 'Hi');
        expect(response3.body[1]).toHaveProperty('readBy', [user1Object._id.toString(), user2Object._id.toString()]);
        expect(response3.body[1]).toHaveProperty('createdAt', expect.any(String));
        expect(response3.body[1]).toHaveProperty('updatedAt', expect.any(String));
    })

    it('should return [] if conversation has no messages', async () => {
        //Creating the conversation
        const response = await agentUser1.post('/api/conversations').send({ participants: [user2Object._id] })
        const conversationId = response.body._id
        const response2 = await agentUser1.get(`/api/conversations/${conversationId}/messages`)
        expect(response2.status).toBe(200)
        expect(response2.body).toHaveLength(0)
    })

    it('should return 404 if conversation does not exist', async () => {
        const response = await agentUser1.get(`/api/conversations/${new mongoose.Types.ObjectId().toString()}/messages`)
        expect(response.status).toBe(404)
        expect(response.body).toHaveProperty('message', 'Conversation not found.')
    })

    it('should return 401 if user is not apart of the conversation', async () => {
        //Creating the conversation
        const response = await agentUser1.post('/api/conversations').send({ participants: [user2Object._id] })
        const conversationId = response.body._id

        //User is apart of conversation but not accessBy, so should not be able to get messages
        const response2 = await agentUser2.get(`/api/conversations/${conversationId}/messages`)
        expect(response2.status).toBe(401)
        expect(response2.body).toHaveProperty('message', 'Unauthorized - User is not authorized to access this conversation.')
    })

    it('should return 401 if user is not logged in', async () => {
        //Creating the conversation
        const response = await agentUser1.post('/api/conversations').send({ participants: [user2Object._id] })
        const conversationId = response.body._id

        const response1 = await unauthenticatedAgent.get(`/api/conversations/${conversationId}/messages`)
        expect(response1.status).toBe(401)
        expect(response1.body).toHaveProperty('message', 'Unauthorized - No token')
    })
})

//Test suit for sending messages to a conversation
describe('POST /api/conversations/:id/messages', () => {
    it('should text send a message to a conversation', async () => {
        //Creating the conversation
        const response = await agentUser1.post('/api/conversations').send({ participants: [user2Object._id] })
        const conversationId = response.body._id

        const response1 = await agentUser1.post(`/api/conversations/${conversationId}/messages`).send({ text: 'Hello' })
        expect(response1.status).toBe(200)
        expect(response1.body).toHaveProperty('_id', expect.any(String));
        expect(response1.body).toHaveProperty('conversationId', conversationId);
        expect(response1.body).toHaveProperty('from', user1Object._id.toString());
        expect(response1.body).toHaveProperty('text', 'Hello');
        expect(response1.body).not.toHaveProperty('image');
        expect(response1.body).toHaveProperty('readBy', [user1Object._id.toString()]);
        expect(response1.body).toHaveProperty('createdAt', expect.any(String));
        expect(response1.body).toHaveProperty('updatedAt', expect.any(String));

        const dbMessage = await Message.findById(response1.body._id)
        expect(dbMessage).not.toBeNull()
        expect(dbMessage.conversationId.toString()).toBe(conversationId.toString())
        expect(dbMessage.from).toStrictEqual(user1Object._id)
        expect(dbMessage.text).toBe('Hello')
        expect(dbMessage.readBy).toStrictEqual([user1Object._id])
        expect(dbMessage.createdAt).not.toBeNull()
        expect(dbMessage.updatedAt).not.toBeNull()

        //Should update conversation's last message, lastMessage at and add user2 into accessedBy
        const dbConversation = await Conversation.findById(conversationId)
        expect(dbConversation).not.toBeNull()
        expect(dbConversation.lastMessage.toString()).toStrictEqual(response1.body._id)
        expect(dbConversation.lastMessageAt.toISOString()).toStrictEqual(response1.body.createdAt)
        expect(dbConversation.accessedBy).toStrictEqual([user1Object._id, user2Object._id])
    })

    it('should send an image to a conversation', async () => {
        cloudinary.uploader.upload.mockClear();
        cloudinary.uploader.destroy.mockClear();

        //Creating the conversation
        const response = await agentUser1.post('/api/conversations').send({ participants: [user2Object._id] })
        const conversationId = response.body._id

        const mockMessageImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA..."
        const response1 = await agentUser1.post(`/api/conversations/${conversationId}/messages`).send({ image: mockMessageImage })
        expect(response1.status).toBe(200)
        expect(response1.body).toHaveProperty('_id', expect.any(String));
        expect(response1.body).toHaveProperty('conversationId', conversationId);
        expect(response1.body).toHaveProperty('from', user1Object._id.toString());
        expect(response1.body).not.toHaveProperty('text');
        expect(response1.body).toHaveProperty('image', "mock-cloudinary-url.jpg");
        expect(response1.body).toHaveProperty('readBy', [user1Object._id.toString()]);
        expect(response1.body).toHaveProperty('createdAt', expect.any(String));
        expect(response1.body).toHaveProperty('updatedAt', expect.any(String));

        const dbMessage = await Message.findById(response1.body._id)
        expect(dbMessage).not.toBeNull()
        expect(dbMessage.conversationId.toString()).toBe(conversationId.toString())
        expect(dbMessage.from).toStrictEqual(user1Object._id)
        expect(dbMessage.image).toBe("mock-cloudinary-url.jpg")
        expect(dbMessage.readBy).toStrictEqual([user1Object._id])
        expect(dbMessage.createdAt).not.toBeNull()
        expect(dbMessage.updatedAt).not.toBeNull()

        expect(cloudinary.uploader.upload).toHaveBeenCalledTimes(1);
        expect(cloudinary.uploader.upload).toHaveBeenCalledWith(mockMessageImage, { folder: "messages" });
        expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();

        //Should update conversation's last message, lastMessage at and add user2 into accessedBy
        const dbConversation = await Conversation.findById(conversationId)
        expect(dbConversation).not.toBeNull()
        expect(dbConversation.lastMessage.toString()).toStrictEqual(response1.body._id)
        expect(dbConversation.lastMessageAt.toISOString()).toStrictEqual(response1.body.createdAt)
        expect(dbConversation.accessedBy).toStrictEqual([user1Object._id, user2Object._id])
    });

    it('should send an image and text to a conversation', async () => {
        cloudinary.uploader.upload.mockClear();
        cloudinary.uploader.destroy.mockClear();

        //Creating the conversation
        const response = await agentUser1.post('/api/conversations').send({ participants: [user2Object._id] })
        const conversationId = response.body._id

        const mockMessageImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA..."
        const response1 = await agentUser1.post(`/api/conversations/${conversationId}/messages`).send({ image: mockMessageImage, text: 'Hello' })
        expect(response1.status).toBe(200)
        expect(response1.body).toHaveProperty('_id', expect.any(String));
        expect(response1.body).toHaveProperty('conversationId', conversationId);
        expect(response1.body).toHaveProperty('from', user1Object._id.toString());
        expect(response1.body).toHaveProperty('text', 'Hello');
        expect(response1.body).toHaveProperty('image', "mock-cloudinary-url.jpg");
        expect(response1.body).toHaveProperty('readBy', [user1Object._id.toString()]);
        expect(response1.body).toHaveProperty('createdAt', expect.any(String));
        expect(response1.body).toHaveProperty('updatedAt', expect.any(String));


        const dbMessage = await Message.findById(response1.body._id)
        expect(dbMessage).not.toBeNull()
        expect(dbMessage.conversationId.toString()).toBe(conversationId.toString())
        expect(dbMessage.from).toStrictEqual(user1Object._id)
        expect(dbMessage.text).toBe('Hello')
        expect(dbMessage.image).toBe("mock-cloudinary-url.jpg")
        expect(dbMessage.readBy).toStrictEqual([user1Object._id])
        expect(dbMessage.createdAt).not.toBeNull()
        expect(dbMessage.updatedAt).not.toBeNull()

        expect(cloudinary.uploader.upload).toHaveBeenCalledTimes(1);
        expect(cloudinary.uploader.upload).toHaveBeenCalledWith(mockMessageImage, { folder: "messages" });
        expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
    });

    it('should return 400 if no text or image is provided ', async () => {
        //Creating the conversation
        const response = await agentUser1.post('/api/conversations').send({ participants: [user2Object._id] })
        const conversationId = response.body._id

        const response1 = await agentUser1.post(`/api/conversations/${conversationId}/messages`).send({})
        expect(response1.status).toBe(400)
        expect(response1.body).toHaveProperty('message', 'Please enter text or image.')
    })

    it('should return 404 if conversation does not exist', async () => {
        const response = await agentUser1.post(`/api/conversations/${new mongoose.Types.ObjectId().toString()}/messages`).send({ text: 'Hello' })
        expect(response.status).toBe(404)
        expect(response.body).toHaveProperty('message', 'Conversation not found.')
    })

    it('should return 401 if user is not apart of the conversation', async () => {
        //Creating the conversation
        const response = await agentUser1.post('/api/conversations').send({ participants: [user2Object._id] })
        const conversationId = response.body._id

        //User is apart of conversation but not accessBy, so should not be send messages
        const response1 = await agentUser2.post(`/api/conversations/${conversationId}/messages`).send({ text: 'Hello' })
        expect(response1.status).toBe(401)
        expect(response1.body).toHaveProperty('message', 'Unauthorized - User is not authorized to access this conversation.')
    })

    it('should return 401 if user is not logged in', async () => {
        //Creating the conversation
        const response = await agentUser1.post('/api/conversations').send({ participants: [user2Object._id] })
        const conversationId = response.body._id

        const response1 = await unauthenticatedAgent.post(`/api/conversations/${conversationId}/messages`).send({ text: 'Hello' })
        expect(response1.status).toBe(401)
        expect(response1.body).toHaveProperty('message', 'Unauthorized - No token')
    })

});

//Test suit for updating a message by id
describe('PUT /api/conversations/:id/messages/:messageId', () => {
    it('should update a message by id', async () => {
        //Creating the conversation
        const response = await agentUser1.post('/api/conversations').send({ participants: [user2Object._id] })
        expect(response.status).toBe(200)
        const conversationId = response.body._id
        //User 1 sends a message
        const response1 = await agentUser1.post(`/api/conversations/${conversationId}/messages`).send({ text: 'Hello' })
        expect(response1.status).toBe(200)
        const messageId = response1.body._id
        //Checking db message text content
        const dbMessage = await Message.findById(messageId)
        expect(dbMessage).not.toBeNull()
        expect(dbMessage.text).toBe('Hello')
        //User 1 updates the message
        const response2 = await agentUser1.put(`/api/conversations/${conversationId}/messages/${messageId}`).send({ text: 'Hello World' })
        expect(response2.status).toBe(200)
        expect(response2.body).toHaveProperty('_id', messageId);
        expect(response2.body).toHaveProperty('conversationId', conversationId);
        expect(response2.body).toHaveProperty('from', user1Object._id.toString());
        expect(response2.body).toHaveProperty('text', 'Hello World')
        // Checking db message text content for new update
        const dbMessage2 = await Message.findById(messageId)
        expect(dbMessage2).not.toBeNull()
        expect(dbMessage2.text).toBe('Hello World')
        expect(dbMessage2.updatedAt.toISOString()).toBe(response2.body.updatedAt)

        //Cloudinary sanity check
        expect(cloudinary.uploader.upload).not.toHaveBeenCalled();
        expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
    });

    it('should return 404 if message does not exist', async () => {
        //Creating the conversation
        const response = await agentUser1.post('/api/conversations').send({ participants: [user2Object._id] })
        expect(response.status).toBe(200)
        const conversationId = response.body._id

        //User 1 sends a message
        const response1 = await agentUser1.put(`/api/conversations/${conversationId}/messages/${new mongoose.Types.ObjectId().toString()}`).send({ text: 'Hello' })
        expect(response1.status).toBe(404)
        expect(response1.body).toHaveProperty('message', 'Message not found.')
    });

    it('should return 401 if user is not the owner of the message', async () => {
        //Creating the conversation
        const response = await agentUser1.post('/api/conversations').send({ participants: [user2Object._id] })
        expect(response.status).toBe(200)
        const conversationId = response.body._id
        //User 1 sends a message
        const response1 = await agentUser1.post(`/api/conversations/${conversationId}/messages`).send({ text: 'Hello' })
        expect(response1.status).toBe(200)
        const messageId = response1.body._id
        //User 2 tries to update the message
        const response2 = await agentUser2.put(`/api/conversations/${conversationId}/messages/${messageId}`).send({ text: 'Hello' })
        expect(response2.status).toBe(401)
        expect(response2.body).toHaveProperty('message', 'Unauthorized - User is not authorized to update this message.')
    });

    it('should return 401 if user is not logged in', async () => {
        //Creating the conversation
        const response = await agentUser1.post('/api/conversations').send({ participants: [user2Object._id] })
        expect(response.status).toBe(200)
        const conversationId = response.body._id
        //User 1 sends a message
        const response1 = await agentUser1.post(`/api/conversations/${conversationId}/messages`).send({ text: 'Hello' })
        expect(response1.status).toBe(200)
        const messageId = response1.body._id
        //Unauth user tries to update the message
        const response2 = await unauthenticatedAgent.put(`/api/conversations/${conversationId}/messages/${messageId}`).send({ text: 'Hello' })
        expect(response2.status).toBe(401)
        expect(response2.body).toHaveProperty('message', 'Unauthorized - No token')
    })
});


//Test suit for deleting a message
describe('DELETE /api/conversations/:Id/messages/:messageId', () => {
    it('should delete a text message by id', async () => {
        //Creating the conversation
        const response = await agentUser1.post('/api/conversations').send({ participants: [user2Object._id] })
        expect(response.status).toBe(200)
        const conversationId = response.body._id
        //User 1 sends a message
        const response1 = await agentUser1.post(`/api/conversations/${conversationId}/messages`).send({ text: 'Hello' })
        expect(response1.status).toBe(200)
        const messageId = response1.body._id
        //Checking db message text content
        const dbMessage = await Message.findById(messageId)
        expect(dbMessage).not.toBeNull()
        expect(dbMessage.text).toBe('Hello')
        //User 1 deletes the message
        const response2 = await agentUser1.delete(`/api/conversations/${conversationId}/messages/${messageId}`)
        expect(response2.status).toBe(200)
        expect(response2.body).toHaveProperty('message', 'Message deleted.');

        //Checking messages db 
        const dbMessage2 = await Message.findById(messageId)
        expect(dbMessage2).toBeNull()
    });


    it('should delete an image message by id', async () => {
        const imageUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA..."
        const imagePublicId = `messages/mock-cloudinary-url`;

        //Creating the conversation
        const response = await agentUser1.post('/api/conversations').send({ participants: [user2Object._id] })
        expect(response.status).toBe(200)
        const conversationId = response.body._id
        //User 1 sends a message
        const response1 = await agentUser1.post(`/api/conversations/${conversationId}/messages`).send({ image: imageUrl })
        expect(response1.status).toBe(200)
        const messageId = response1.body._id
        //Checking db message text content
        const dbMessage = await Message.findById(messageId)
        expect(dbMessage).not.toBeNull()
        expect(dbMessage.image).toBe("mock-cloudinary-url.jpg")
        //User 1 deletes the message
        const response2 = await agentUser1.delete(`/api/conversations/${conversationId}/messages/${messageId}`)
        expect(response2.status).toBe(200)
        expect(response2.body).toHaveProperty('message', 'Message deleted.');

        //Cloudinary checks
        expect(cloudinary.uploader.destroy).toHaveBeenCalledTimes(1);
        expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(imagePublicId);

        //Checking messages db 
        const dbMessage2 = await Message.findById(messageId)
        expect(dbMessage2).toBeNull()
    });

    it('should return 401 if user is not logged in', async () => {
        //Creating the conversation
        const response = await agentUser1.post('/api/conversations').send({ participants: [user2Object._id] })
        expect(response.status).toBe(200)
        const conversationId = response.body._id
        //User 1 sends a message
        const response1 = await agentUser1.post(`/api/conversations/${conversationId}/messages`).send({ text: 'Hello' })
        expect(response1.status).toBe(200)
        const messageId = response1.body._id
        //Unauth user tries to delete the message
        const response2 = await unauthenticatedAgent.delete(`/api/conversations/${conversationId}/messages/${messageId}`)
        expect(response2.status).toBe(401)
        expect(response2.body).toHaveProperty('message', 'Unauthorized - No token')
    });

    it('should return 404 if message is not found', async () => {
        //Creating the conversation
        const response = await agentUser1.post('/api/conversations').send({ participants: [user2Object._id] })
        expect(response.status).toBe(200)
        const conversationId = response.body._id
        //Unauth user tries to delete the message
        const response2 = await agentUser1.delete(`/api/conversations/${conversationId}/messages/${new mongoose.Types.ObjectId().toString()}`)
        expect(response2.status).toBe(404)
        expect(response2.body).toHaveProperty('message', 'Message not found.')
    });

    it('should return 401 if user is not the owner of the message', async () => {
        //Creating the conversation
        const response = await agentUser1.post('/api/conversations').send({ participants: [user2Object._id] })
        expect(response.status).toBe(200)
        const conversationId = response.body._id
        //User 1 sends a message
        const response1 = await agentUser1.post(`/api/conversations/${conversationId}/messages`).send({ text: 'Hello' })
        expect(response1.status).toBe(200)
        const messageId = response1.body._id
        //User 2 tries to delete the message
        const response2 = await agentUser2.delete(`/api/conversations/${conversationId}/messages/${messageId}`).send({ text: 'Hello' })
        expect(response2.status).toBe(401)
        expect(response2.body).toHaveProperty('message', 'Unauthorized - User is not authorized to update this message.')
    });
});

