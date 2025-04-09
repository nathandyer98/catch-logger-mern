
// This file replaces the real ../lib/cloudinary.js during tests

console.log("[Mock] Using mock for lib/cloudinary.js"); // Debug log

const uploader = {
    upload: jest.fn().mockResolvedValue({ secure_url: 'mock-cloudinary-url.jpg' }),
    destroy: jest.fn().mockResolvedValue({ result: 'ok' })
};

const mockCloudinary = {
    uploader: uploader,
    // We need to provide a mock 'config' function because the *real*
    // lib/cloudinary.js calls it. It doesn't need to do anything here.
    config: jest.fn(),
};

// Export this mock object as the default export, just like the real file does
export default mockCloudinary;