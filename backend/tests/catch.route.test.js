import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt from 'bcryptjs';
import User from '../src/models/user.model.js';
import { user1Fixture, user2Fixture } from './fixtures/users.fixture.js';
import Catch from '../src/models/catch.model.js';
import { CatchEnum } from '../src/models/catch.model.js';
import { catch1Fixture, catch2Fixture, catch3Fixture, catch4Fixture } from './fixtures/catches.fixture.js';
import { comment1Fixture } from './fixtures/catches.comments.fixture.js';
import { createLoggedInAgent, createUnloggedInAgent } from './utils/apiTestAgent.js';
jest.mock('../src/lib/cloudinary.js');
import cloudinary from '../src/lib/cloudinary.js';


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

const createComment = async (user, catchData, commentData) => {
    commentData = ({ user: user._id, ...commentData });
    const newComment = await Catch.findByIdAndUpdate(catchData._id, { $push: { comments: commentData } }, { new: true });
    const updatedCatch = await Catch.findById(catchData._id)
    return updatedCatch.comments[newComment.comments.length - 1];
};


const createCatch = async (user, catchData) => {
    catchData = ({ user: user._id, ...catchData });
    const newCatch = await Catch.create(catchData);
    return newCatch;
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
    await Catch.deleteMany({});

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

//Test suit for retrieving all catches
describe('GET /api/catches', () => {
    it('should retrieve all catches', async () => {
        await createCatch(user1Object, catch1Fixture);
        await createCatch(user1Object, catch2Fixture);
        await createCatch(user2Object, catch3Fixture);
        await createCatch(user2Object, catch4Fixture);

        const response = await agentUser1.get('/api/catches');
        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(4);
    });

    it('should return an empty array if no catches exist', async () => {
        const response = await agentUser1.get('/api/catches');
        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(0);
    });

    it('should return all catches for any user', async () => {
        await createCatch(user1Object, catch1Fixture);
        await createCatch(user2Object, catch2Fixture);

        const response1 = await agentUser2.get('/api/catches');
        expect(response1.status).toBe(200);
        expect(response1.body).toHaveLength(2);

        const response2 = await agentUser1.get('/api/catches');
        expect(response2.status).toBe(200);
        expect(response2.body).toHaveLength(2);
    });
});

//Test suit for retrieving user catches
describe('GET /api/catches/user/:username', () => {
    it('should retrieve user catches', async () => {
        await createCatch(user1Object, catch1Fixture);
        await createCatch(user1Object, catch2Fixture);
        const response = await agentUser1.get(`/api/catches/user/${user1Object.username}`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(2);
    });

    it('should return the correct fields for each catch', async () => {
        await createCatch(user1Object, catch1Fixture);
        const response = await agentUser1.get(`/api/catches/user/${user1Object.username}`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(1);

        const catchData = response.body[0];
        expect(catchData).toHaveProperty('_id');
        expect(catchData).toHaveProperty('user', expect.objectContaining({
            _id: user1Object._id.toString(),
            username: user1Object.username,
            fullName: user1Object.fullName,
        }));
        expect(catchData).toHaveProperty('species', catch1Fixture.species);
        expect(CatchEnum).toContain(catch1Fixture.species);
        expect(catchData).toHaveProperty('weight', catch1Fixture.weight);
        expect(catchData).toHaveProperty('text', catch1Fixture.text);
        expect(catchData).toHaveProperty('photo', catch1Fixture.photo);
        expect(catchData).toHaveProperty('comments', expect.any(Array));
        expect(catchData).toHaveProperty('likes', expect.any(Array));
        expect(catchData).toHaveProperty('createdAt', expect.any(String));
        expect(catchData).toHaveProperty('updatedAt', expect.any(String));
    });

    it('should return 404 if user not found', async () => {
        const response = await agentUser1.get('/api/catches/user/nonexistentuser');
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('message', 'User not found.');
    });

    it('should return 401 if user is not logged in', async () => {
        const response = await unauthenticatedAgent.get(`/api/catches/user/${user1Object.username}`)
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message', 'Unauthorized - No token');
    });
});

//Test suit for retrieveing catches feed (feed of catches from followed users and own catches)
describe('GET /api/catches/feed', () => {

    it('should retrieve catches feed of followed users and own catches, and return the correct fields for each catch', async () => {
        await createCatch(user1Object, catch1Fixture);
        await createCatch(user2Object, catch2Fixture);

        const firstResponse = await agentUser1.get('/api/catches/feed');
        expect(firstResponse.status).toBe(200);
        expect(firstResponse.body).toHaveLength(1);


        await agentUser1.post(`/api/users/${user2Object._id.toString()}/followUnfollow`)
        const secondResponse = await agentUser1.get('/api/catches/feed');
        expect(secondResponse.status).toBe(200);
        expect(secondResponse.body).toHaveLength(2);

        secondResponse.body.forEach(catchData => {
            expect(catchData).toHaveProperty('_id');
            expect(catchData).toHaveProperty('user', expect.objectContaining({
                _id: expect.any(String),
                username: expect.any(String),
                fullName: expect.any(String),
            }));
            expect(catchData).toHaveProperty('species', expect.any(String));
            expect(CatchEnum).toContain(catchData.species);
            expect(catchData).toHaveProperty('weight', expect.any(Number));
            expect(catchData).toHaveProperty('text', expect.any(String));
            expect(catchData).toHaveProperty('photo', expect.any(String));
            expect(catchData).toHaveProperty('comments', expect.any(Array));
            expect(catchData).toHaveProperty('likes', expect.any(Array));
            expect(catchData).toHaveProperty('createdAt', expect.any(String));
            expect(catchData).toHaveProperty('updatedAt', expect.any(String));
        });
    });

    it('should return 401 if user is not logged in', async () => {
        const response = await unauthenticatedAgent.get('/api/catches/feed')
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message', 'Unauthorized - No token');
    });
});

//Test suit for creating a catch
describe('POST /api/catches', () => {

    beforeEach(async () => {
        cloudinary.uploader.upload.mockClear();
        cloudinary.uploader.destroy.mockClear();
    });

    it('should create a catch and return the correct fields', async () => {
        const mockCatchPhoto = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA..."
        catch1Fixture.photo = mockCatchPhoto;
        const response = await agentUser1.post('/api/catches').send(catch1Fixture);
        console.log(catch1Fixture);
        console.log("Response body:", response.body);
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('_id');
        expect(response.body).toHaveProperty('user', expect.objectContaining({
            _id: user1Object._id.toString(),
            username: user1Object.username,
            fullName: user1Object.fullName,
        }));
        expect(response.body).toHaveProperty('species', catch1Fixture.species);
        expect(CatchEnum).toContain(catch1Fixture.species);
        expect(response.body).toHaveProperty('weight', catch1Fixture.weight);
        expect(response.body).toHaveProperty('text', catch1Fixture.text);
        expect(response.body).toHaveProperty('photo', "mock-cloudinary-url.jpg");
        expect(response.body).toHaveProperty('comments', expect.any(Array));
        expect(response.body).toHaveProperty('likes', expect.any(Array));
        expect(response.body).toHaveProperty('createdAt', expect.any(String));
        expect(response.body).toHaveProperty('updatedAt', expect.any(String));

        expect(cloudinary.uploader.upload).toHaveBeenCalledTimes(1);
        expect(cloudinary.uploader.upload).toHaveBeenCalledWith(mockCatchPhoto, { folder: "catch_photos" });
        expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();

        const dbCatch = await Catch.findById(response.body._id);
        expect(dbCatch).toBeDefined();
        expect(dbCatch.user.toString()).toBe(user1Object._id.toString());
        expect(dbCatch.species).toBe(catch1Fixture.species);
        expect(dbCatch.weight).toBe(catch1Fixture.weight);
        expect(dbCatch.text).toBe(catch1Fixture.text);
        expect(dbCatch.photo).toBe("mock-cloudinary-url.jpg");
    });

    it('should return 401 if user is not logged in', async () => {
        const response = await unauthenticatedAgent.post('/api/catches').send(catch1Fixture)
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message', 'Unauthorized - No token');
    });


    const requiredFields = ['species', 'weight', 'lake', 'dateCaught', 'text', 'photo'];
    const baseData = {
        species: 'Trout',
        weight: 5,
        lake: 'Lake Tahoe',
        dateCaught: new Date(),
        text: 'Great catch!',
        photo: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...',
    };


    test.each(requiredFields)(
        'should return 400 if %s is missing', async (missingField) => {
            const invalidData = { ...baseData };
            delete invalidData[missingField];
            const response = await agentUser1.post('/api/catches').send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('message', 'Some fields are missing');
            expect(response.body).not.toHaveProperty('catch');
            expect(cloudinary.uploader.upload).not.toHaveBeenCalled();
        }
    );

    test.each(requiredFields)(
        'should return 400 if %s is empty space', async (missingField) => {
            const invalidData = { ...baseData };
            invalidData[missingField] = '            ';
            const response = await agentUser1.post('/api/catches').send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('message', 'Invalid data');
            expect(response.body).not.toHaveProperty('catch');
            expect(cloudinary.uploader.upload).not.toHaveBeenCalled();
        }
    );


});

//Test suit for updating a catch
describe('PUT /api/catches/:catchId', () => {

    beforeEach(async () => {
        cloudinary.uploader.upload.mockClear();
        cloudinary.uploader.destroy.mockClear();
    });

    it('should update a catch and return the updated catch', async () => {
        const newCatch = await createCatch(user1Object, catch1Fixture);

        const initialPicUrl = catch1Fixture.photo;
        const initialPublicId = `catch_photos/${initialPicUrl.split('/').pop().split('.')[0]}`;

        const updatedData = { ...catch2Fixture, photo: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA..." };

        const response = await agentUser1.put(`/api/catches/${newCatch._id.toString()}`).send(updatedData);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('_id', newCatch._id.toString());
        expect(response.body).toHaveProperty('user', expect.objectContaining({
            _id: user1Object._id.toString(),
            username: user1Object.username,
            fullName: user1Object.fullName,
        }));
        expect(response.body).toHaveProperty('species', updatedData.species);
        expect(CatchEnum).toContain(updatedData.species);
        expect(response.body).toHaveProperty('weight', updatedData.weight);
        expect(response.body).toHaveProperty('text', updatedData.text);
        expect(response.body).toHaveProperty('photo', "mock-cloudinary-url.jpg");
        expect(response.body).toHaveProperty('comments', expect.any(Array));
        expect(response.body).toHaveProperty('likes', expect.any(Array));
        expect(response.body).toHaveProperty('createdAt', expect.any(String));
        expect(response.body).toHaveProperty('updatedAt', expect.any(String));

        expect(cloudinary.uploader.destroy).toHaveBeenCalledTimes(1);
        expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(initialPublicId);
        expect(cloudinary.uploader.upload).toHaveBeenCalledTimes(1);
        expect(cloudinary.uploader.upload).toHaveBeenCalledWith(updatedData.photo, { folder: "catch_photos" });

        const dbCatch = await Catch.findById(newCatch._id);
        expect(dbCatch).toBeDefined();
        expect(dbCatch.user.toString()).toBe(user1Object._id.toString());
        expect(dbCatch.species).toBe(updatedData.species);
        expect(dbCatch.weight).toBe(updatedData.weight);
        expect(dbCatch.text).toBe(updatedData.text);
        expect(dbCatch.photo).toBe("mock-cloudinary-url.jpg");
    });

    it('should return 401 if user is not logged in', async () => {
        const newCatch = await createCatch(user1Object, catch1Fixture);
        const response = await unauthenticatedAgent.put(`/api/catches/${newCatch._id.toString()}`).send(catch2Fixture)
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message', 'Unauthorized - No token');
    });

    it('should return 404 if catch is not found', async () => {
        const response = await agentUser1.put(`/api/catches/${new mongoose.Types.ObjectId().toString()}`).send(catch2Fixture);
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('message', 'Catch not found.');
    });

    it('should return 401 if user is not the owner of the catch', async () => {
        const newCatch = await createCatch(user1Object, catch1Fixture);
        const response = await agentUser2.put(`/api/catches/${newCatch._id.toString()}`).send(catch2Fixture);
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message', 'Unauthorized - User is not authorized to update this catch.');
    });

    const sensitiveFields = ['user', 'comments', 'likes', 'createdAt', 'updatedAt'];

    test.each(sensitiveFields)(
        'should return 400 if %s is provided', async (sensitiveField) => {
            const newCatch = await createCatch(user1Object, catch1Fixture);
            const updatedData = { ...catch2Fixture };
            updatedData[sensitiveField] = 'some value';
            const response = await agentUser1.put(`/api/catches/${newCatch._id.toString()}`).send(updatedData);
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('message', 'Not Authorized');
            expect(response.body).not.toHaveProperty('catch');
            expect(cloudinary.uploader.upload).not.toHaveBeenCalled();
        }
    );

});

//Test suit for deleting a catch
describe('DELETE /api/catches/:catchId', () => {
    it('should delete a catch', async () => {
        const newCatch = await createCatch(user1Object, catch1Fixture);
        const initialPublicId = `catch_photos/${newCatch.photo.split('/').pop().split('.')[0]}`;

        const response = await agentUser1.delete(`/api/catches/${newCatch._id.toString()}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Catch deleted successfully.');
        expect(cloudinary.uploader.destroy).toHaveBeenCalledTimes(1);
        expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(initialPublicId);

        const dbCatch = await Catch.findById(newCatch._id);
        expect(dbCatch).toBeNull();
    })

    it('should return 401 if user is not logged in', async () => {
        const newCatch = await createCatch(user1Object, catch1Fixture);
        const response = await unauthenticatedAgent.delete(`/api/catches/${newCatch._id.toString()}`)
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message', 'Unauthorized - No token');
    });

    it('should return 404 if catch is not found', async () => {
        const response = await agentUser1.delete(`/api/catches/${new mongoose.Types.ObjectId().toString()}`);
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('message', 'Catch not found.');
    });

    it('should return 401 if user is not the owner of the catch', async () => {
        const newCatch = await createCatch(user1Object, catch1Fixture);
        const response = await agentUser2.delete(`/api/catches/${newCatch._id.toString()}`);
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message', 'Unauthorized - User is not authorized to delete this catch.');
    });
});

//Test suit for liking a catch
describe('PUT /api/catches/:catchId/like', () => {
    it('should like a catch', async () => {
        const newCatch = await createCatch(user1Object, catch1Fixture);
        const response = await agentUser2.post(`/api/catches/${newCatch._id.toString()}/like`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('catchLikes', expect.arrayContaining([user2Object._id.toString()]));
        expect(response.body).toHaveProperty('message', 'Liked Catch.');

        const dbCatch = await Catch.findById(newCatch._id);
        expect(dbCatch.likes).toHaveLength(1);
        expect(dbCatch.likes[0].toString()).toBe(user2Object._id.toString());

        const agentProfile = await agentUser2.get('/api/auth/check');
        expect(agentProfile.body).toHaveProperty('likedCatches', expect.arrayContaining([newCatch._id.toString()]));
    });

    it('should unlike a catch', async () => {
        const newCatch = await createCatch(user1Object, catch1Fixture);
        const initailLike = await agentUser2.post(`/api/catches/${newCatch._id.toString()}/like`);
        expect(initailLike.status).toBe(200);
        expect(initailLike.body).toHaveProperty('catchLikes', expect.arrayContaining([user2Object._id.toString()]));
        expect(initailLike.body).toHaveProperty('message', 'Liked Catch.');

        const response = await agentUser2.post(`/api/catches/${newCatch._id.toString()}/like`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('catchLikes', expect.not.arrayContaining([user2Object._id.toString()]));
        expect(response.body).toHaveProperty('message', 'Unliked Catch.');

        const dbCatch = await Catch.findById(newCatch._id);
        expect(dbCatch.likes).toHaveLength(0);

        const agentProfile = await agentUser2.get('/api/auth/check');
        expect(agentProfile.body).toHaveProperty('likedCatches', expect.not.arrayContaining([newCatch._id.toString()]));
    });


    it('should return 401 if user is not logged in', async () => {
        const newCatch = await createCatch(user1Object, catch1Fixture);
        const response = await unauthenticatedAgent.post(`/api/catches/${newCatch._id.toString()}/like`)
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message', 'Unauthorized - No token');
    });

    it('should return 404 if catch is not found', async () => {
        const response = await agentUser1.post(`/api/catches/${new mongoose.Types.ObjectId().toString()}/like`);
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('message', 'Catch not found.');
    });
});

//Test suit for creating a comment
describe('POST /api/catches/:catchId/comments', () => {
    it('should create a comment', async () => {
        const newCatch = await createCatch(user1Object, catch1Fixture);
        const response = await agentUser2.post(`/api/catches/${newCatch._id.toString()}/comments`).send(comment1Fixture);
        expect(response.status).toBe(201);
        //should return an array of comments with the new comment added to it
        expect(response.body).toEqual(expect.arrayContaining([
            expect.objectContaining({
                text: comment1Fixture.text,
                user: expect.objectContaining({
                    _id: user2Object._id.toString(),
                    username: user2Object.username,
                    fullName: user2Object.fullName,
                    profilePic: user2Object.profilePic,
                }),
                _id: expect.any(String),
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
            })
        ]));

        const dbCatch = await Catch.findById(newCatch._id);
        expect(dbCatch).toBeDefined();
        expect(dbCatch.comments).toHaveLength(1);
        expect(dbCatch.comments[0].text).toBe(comment1Fixture.text);
    });

    it('should return 401 if user is not logged in', async () => {
        const newCatch = await createCatch(user1Object, catch1Fixture);
        const response = await unauthenticatedAgent.post(`/api/catches/${newCatch._id.toString()}/comments`).send(comment1Fixture);
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message', 'Unauthorized - No token');
    });

    it('should return 404 if catch is not found', async () => {
        const response = await agentUser1.post(`/api/catches/${new mongoose.Types.ObjectId().toString()}/comments`).send(comment1Fixture);
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('message', 'Catch not found.');
    });

    it('should return 400 if comment is empty', async () => {
        const newCatch = await createCatch(user1Object, catch1Fixture);
        const response = await agentUser2.post(`/api/catches/${newCatch._id.toString()}/comments`).send({ text: '' });
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message', 'Comment text is required.');
    });

    it('should return 400 if comment is too long', async () => {
        const newCatch = await createCatch(user1Object, catch1Fixture);
        const response = await agentUser2.post(`/api/catches/${newCatch._id.toString()}/comments`).send({ text: 'a'.repeat(501) });
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message', 'Comment cannot be longer than 200 characters.');
    });

    it('should return 400 if comment is not provided', async () => {
        const newCatch = await createCatch(user1Object, catch1Fixture);
        const response = await agentUser2.post(`/api/catches/${newCatch._id.toString()}/comments`).send({});
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message', 'Comment text is required.');
    });

});

//Test suit for updating a comment
describe('PUT /api/catches/:catchId/comments/:commentId', () => {
    it('should update a comment', async () => {
        const newCatch = await createCatch(user1Object, catch1Fixture);
        const newComment = await agentUser2.post(`/api/catches/${newCatch._id.toString()}/comments`).send(comment1Fixture);
        const commentId = newComment.body[0]._id;
        const updatedComment = { text: 'Updated comment' };
        const response = await agentUser2.put(`/api/catches/${newCatch._id.toString()}/comments/${commentId}`).send(updatedComment);
        expect(response.status).toBe(200);
        expect(response.body).toEqual(expect.arrayContaining([
            expect.objectContaining({
                text: updatedComment.text,
                user: expect.objectContaining({
                    _id: user2Object._id.toString(),
                    username: user2Object.username,
                    fullName: user2Object.fullName,
                    profilePic: user2Object.profilePic,
                }),
                _id: expect.any(String),
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
            })
        ]));

        const dbCatch = await Catch.findById(newCatch._id);
        expect(dbCatch).toBeDefined();
        expect(dbCatch.comments).toHaveLength(1);
        expect(dbCatch.comments[0].text).toBe(updatedComment.text);
    });

    it('should return 401 if user is not logged in', async () => {
        const newCatch = await createCatch(user1Object, catch1Fixture);
        const newComment = await agentUser2.post(`/api/catches/${newCatch._id.toString()}/comments`).send(comment1Fixture);
        const commentId = newComment.body[0]._id;
        const updatedComment = { text: 'Updated comment' };
        const response = await unauthenticatedAgent.put(`/api/catches/${newCatch._id.toString()}/comments/${commentId}`).send(updatedComment);
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message', 'Unauthorized - No token');
    });

    it('should return 404 if catch is not found', async () => {
        const newCatch = await createCatch(user1Object, catch1Fixture);
        const newComment = await agentUser2.post(`/api/catches/${newCatch._id.toString()}/comments`).send(comment1Fixture);
        const commentId = newComment.body[0]._id;
        const updatedComment = { text: 'Updated comment' };
        const response = await agentUser2.put(`/api/catches/${new mongoose.Types.ObjectId().toString()}/comments/${commentId}`).send(updatedComment);
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('message', 'Catch not found.');
    });

    it('should return 404 if comment is not found', async () => {
        const newCatch = await createCatch(user1Object, catch1Fixture);
        const updatedComment = { text: 'Updated comment' };
        const response = await agentUser2.put(`/api/catches/${newCatch._id.toString()}/comments/${new mongoose.Types.ObjectId().toString()}`).send(updatedComment);
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('message', 'Comment not found.');
    });

    it('should return 400 if comment is empty', async () => {
        const newCatch = await createCatch(user1Object, catch1Fixture);
        const newComment = await agentUser2.post(`/api/catches/${newCatch._id.toString()}/comments`).send(comment1Fixture);
        const commentId = newComment.body[0]._id;
        const response = await agentUser2.put(`/api/catches/${newCatch._id.toString()}/comments/${commentId}`).send({ text: '' });
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message', 'Comment text is required.');
    });

    it('should return 200 if comment is too long', async () => {
        const newCatch = await createCatch(user1Object, catch1Fixture);
        const newComment = await agentUser2.post(`/api/catches/${newCatch._id.toString()}/comments`).send(comment1Fixture);
        const commentId = newComment.body[0]._id;
        const response = await agentUser2.put(`/api/catches/${newCatch._id.toString()}/comments/${commentId}`).send({ text: 'a'.repeat(501) });
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message', 'Comment cannot be longer than 200 characters.');
    });

    it('should return 400 if comment is not provided', async () => {
        const newCatch = await createCatch(user1Object, catch1Fixture);
        const newComment = await agentUser2.post(`/api/catches/${newCatch._id.toString()}/comments`).send(comment1Fixture);
        const commentId = newComment.body[0]._id;
        const response = await agentUser2.put(`/api/catches/${newCatch._id.toString()}/comments/${commentId}`).send({});
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message', 'Comment text is required.');
    });

    it('should return 401 if user is not the owner of the comment', async () => {
        const newCatch = await createCatch(user1Object, catch1Fixture);
        const newComment = await agentUser2.post(`/api/catches/${newCatch._id.toString()}/comments`).send(comment1Fixture);
        const commentId = newComment.body[0]._id;
        const updatedComment = { text: 'Updated comment' };
        const response = await agentUser1.put(`/api/catches/${newCatch._id.toString()}/comments/${commentId}`).send(updatedComment);
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message', 'Unauthorized - User is not authorized to update this comment.');
    });
})

//Test suit for deleting a comment
describe('DELETE /api/catches/:catchId/comments/:commentId', () => {
    it('should delete a comment', async () => {
        const newCatch = await createCatch(user1Object, catch1Fixture);
        const newComment = await agentUser2.post(`/api/catches/${newCatch._id.toString()}/comments`).send(comment1Fixture);
        const commentId = newComment.body[0]._id;
        const response = await agentUser2.delete(`/api/catches/${newCatch._id.toString()}/comments/${commentId}`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Comment deleted successfully.');

        const dbCatch = await Catch.findById(newCatch._id);
        expect(dbCatch).toBeDefined();
        expect(dbCatch.comments).toHaveLength(0);
    });

    it('should return 404 if catch is not found', async () => {
        const response = await agentUser2.delete(`/api/catches/${new mongoose.Types.ObjectId().toString()}/comments/${new mongoose.Types.ObjectId().toString()}`);
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('message', 'Catch not found.');
    });

    it('should return 404 if comment is not found', async () => {
        const newCatch = await createCatch(user1Object, catch1Fixture);
        const response = await agentUser2.delete(`/api/catches/${newCatch._id.toString()}/comments/${new mongoose.Types.ObjectId().toString()}`);
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('message', 'Comment not found.');
    });

    it('should return 401 if user is not the owner of the comment', async () => {
        const newCatch = await createCatch(user1Object, catch1Fixture);
        const newComment = await agentUser2.post(`/api/catches/${newCatch._id.toString()}/comments`).send(comment1Fixture);
        const commentId = newComment.body[0]._id;
        const response = await agentUser1.delete(`/api/catches/${newCatch._id.toString()}/comments/${commentId}`);
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message', 'Unauthorized - User is not authorized to delete this comment.');
    });
});