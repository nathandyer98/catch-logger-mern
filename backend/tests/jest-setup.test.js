// tests/jest-setup.test.js
// NO database imports, NO beforeAll/afterAll/beforeEach with DB logic

describe('Jest Basic Sanity Check', () => {
    it('should execute a simple synchronous test', () => {
        console.log('--- Running Jest Sanity Check ---');
        const sum = 2 + 2;
        expect(sum).toBe(4);
        console.log('--- Jest Sanity Check Passed ---');
    });

    it('should verify true is true', () => {
        expect(true).toBe(true);
    });
});