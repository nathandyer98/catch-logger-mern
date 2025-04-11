import request from 'supertest';
import { app } from '../../src/index.js';

/**
 * Creates a Supertest agent that is logged in via the API.
 * @param {object} credentials - Object containing email and password.
 * @param {string} credentials.email - User's email.
 * @param {string} credentials.password - User's plain text password.
 * @returns {Promise<request.SuperTest<request.Test>>} - A Supertest agent instance with session cookie.
 * @throws {Error} If login fails.
 */
export const createLoggedInAgent = async ({ email, password }) => {
    // Basic validation
    if (!email || !password) {
        throw new Error('createLoggedInAgent helper requires email and password');
    }

    const agent = request.agent(app);
    const res = await agent
        .post('/api/auth/login')
        .send({ email, password });

    if (res.status !== 200) {
        console.error(`[Agent Helper] Failed to login user: ${email}`, res.body);

        throw new Error(`Agent login failed for ${email}. Status: ${res.status}. Body: ${JSON.stringify(res.body)}`);
    }
    console.log(`[Agent Helper] Successfully created logged-in agent for ${email}`);
    return agent;
};