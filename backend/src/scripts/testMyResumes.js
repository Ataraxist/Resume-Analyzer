import express from 'express';
import session from 'express-session';
import { trackGuestSession, requireIdentity } from '../middleware/sessionMiddleware.js';
import { optionalAuthMiddleware } from '../middleware/authMiddleware.js';
import resumeController from '../controllers/resumeController.js';

const app = express();

// Session configuration (same as server.js)
app.use(session({
    secret: 'test-secret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        maxAge: 48 * 60 * 60 * 1000,
        sameSite: 'lax'
    },
    name: 'resume.sid'
}));

// Mock request with session
const mockReq = {
    sessionID: '0goA23DvA7DtU3NpqM5pT9YzUyTu_Nh7',
    session: { cookie: {} },
    user: null,
    query: { limit: 10 }
};

const mockRes = {
    json: (data) => {
        console.log('Response:', JSON.stringify(data, null, 2));
        process.exit(0);
    },
    status: (code) => {
        console.log('Status:', code);
        return mockRes;
    }
};

// Test the middleware chain
console.log('Testing with session ID:', mockReq.sessionID);

// Apply middleware
optionalAuthMiddleware(mockReq, mockRes, () => {
    trackGuestSession(mockReq, mockRes, () => {
        requireIdentity(mockReq, mockRes, () => {
            console.log('Identity:', mockReq.identity);
            // Call the controller
            resumeController.getMyResumes(mockReq, mockRes);
        });
    });
});