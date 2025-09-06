import database from '../db/database.js';

// Middleware to track guest sessions
export const trackGuestSession = async (req, res, next) => {
    try {
        // Only track if there's a session and no authenticated user
        if (req.session && req.sessionID && !req.user) {
            // Check if session exists in database
            const existingSession = await database.get(
                'SELECT * FROM guest_sessions WHERE session_id = ?',
                [req.sessionID]
            );
            
            if (!existingSession) {
                // Create new guest session record
                await database.run(
                    'INSERT INTO guest_sessions (session_id) VALUES (?)',
                    [req.sessionID]
                );
            } else {
                // Update last activity
                await database.run(
                    'UPDATE guest_sessions SET last_activity = CURRENT_TIMESTAMP WHERE session_id = ?',
                    [req.sessionID]
                );
            }
            
            // Attach session info to request
            req.guestSession = {
                sessionId: req.sessionID,
                isGuest: true
            };
        }
        
        next();
    } catch (error) {
        console.error('Session tracking error:', error);
        // Don't fail the request if session tracking fails
        next();
    }
};

// Helper to get identity (user_id or session_id)
export const getRequestIdentity = (req) => {
    if (req.user && req.user.userId) {
        return {
            userId: req.user.userId,
            sessionId: null,
            isGuest: false
        };
    } else if (req.sessionID) {
        return {
            userId: null,
            sessionId: req.sessionID,
            isGuest: true
        };
    }
    
    throw new Error('No valid identity found');
};

// Middleware to ensure we have some form of identity
export const requireIdentity = (req, res, next) => {
    try {
        const identity = getRequestIdentity(req);
        req.identity = identity;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Session or authentication required'
        });
    }
};

export default {
    trackGuestSession,
    getRequestIdentity,
    requireIdentity
};