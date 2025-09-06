import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import userModel from '../models/userModel.js';

// JWT secret from environment or generate a random one for development
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

// Authentication middleware
const authMiddleware = async (req, res, next) => {
    try {
        // Get token from header
        let token = req.headers.authorization;
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No authorization token provided'
            });
        }
        
        // Remove "Bearer " prefix if present
        if (token.startsWith('Bearer ')) {
            token = token.slice(7);
        }
        
        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token expired'
                });
            }
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        
        // Check token type
        if (decoded.type !== 'access') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token type'
            });
        }
        
        // Get user from database
        const user = await userModel.findById(decoded.userId);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }
        
        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Account is deactivated'
            });
        }
        
        // Attach user to request
        req.user = {
            userId: user.id,
            email: user.email,
            username: user.username,
            isVerified: user.is_verified
        };
        
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Authentication error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuthMiddleware = async (req, res, next) => {
    try {
        // Get token from header
        let token = req.headers.authorization;
        
        if (!token) {
            req.user = null;
            return next();
        }
        
        // Remove "Bearer " prefix if present
        if (token.startsWith('Bearer ')) {
            token = token.slice(7);
        }
        
        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (error) {
            req.user = null;
            return next();
        }
        
        // Check token type
        if (decoded.type !== 'access') {
            req.user = null;
            return next();
        }
        
        // Get user from database
        const user = await userModel.findById(decoded.userId);
        
        if (!user || !user.is_active) {
            req.user = null;
            return next();
        }
        
        // Attach user to request
        req.user = {
            userId: user.id,
            email: user.email,
            username: user.username,
            isVerified: user.is_verified
        };
        
        next();
    } catch (error) {
        console.error('Optional auth middleware error:', error);
        req.user = null;
        next();
    }
};

// Require verified email middleware
export const requireVerifiedEmail = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }
    
    if (!req.user.isVerified) {
        return res.status(403).json({
            success: false,
            message: 'Email verification required'
        });
    }
    
    next();
};

export default authMiddleware;