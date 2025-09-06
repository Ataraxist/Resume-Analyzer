import userModel from '../models/userModel.js';
import resumeModel from '../models/resumeModel.js';
import creditService from '../services/creditService.js';
import database from '../db/database.js';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import crypto from 'crypto';

// JWT secret from environment or generate a random one for development
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

class AuthController {
    // Generate JWT token
    generateAccessToken(userId) {
        return jwt.sign(
            { userId, type: 'access' },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );
    }
    
    // Generate refresh token
    generateRefreshToken(userId) {
        return jwt.sign(
            { userId, type: 'refresh' },
            JWT_SECRET,
            { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
        );
    }
    
    // User signup
    async signup(req, res) {
        try {
            // Check validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ 
                    success: false,
                    errors: errors.array() 
                });
            }
            
            const { email, username, password, fullName } = req.body;
            const sessionId = req.sessionID; // Get current session ID for guest data claiming
            
            // Create the user
            const user = await userModel.createUser({
                email,
                username,
                password,
                fullName
            });
            
            // Claim any guest data (resumes and analyses) if they exist
            if (sessionId) {
                try {
                    // Claim guest resumes
                    const claimedResumes = await resumeModel.claimGuestResumes(sessionId, user.id);
                    
                    // Claim guest analyses
                    await database.run(
                        'UPDATE analyses SET user_id = ?, session_id = NULL WHERE session_id = ? AND user_id IS NULL',
                        [user.id, sessionId]
                    );
                    
                    // Mark session as claimed
                    await database.run(
                        'UPDATE guest_sessions SET claimed_by_user_id = ? WHERE session_id = ?',
                        [user.id, sessionId]
                    );
                    
                    console.log(`Claimed ${claimedResumes} resumes for new user ${user.id}`);
                } catch (claimError) {
                    console.error('Error claiming guest data:', claimError);
                    // Don't fail signup if claiming fails
                }
            }
            
            // Initialize user credits with signup bonus
            await creditService.initializeUserCredits(user.id, true);
            
            // Generate tokens
            const accessToken = this.generateAccessToken(user.id);
            const refreshToken = this.generateRefreshToken(user.id);
            
            // Save refresh token to database
            await userModel.saveRefreshToken(user.id, refreshToken);
            
            // Set cookies
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });
            
            // Get user's credit balance
            const credits = await creditService.getUserCredits(user.id);
            
            res.status(201).json({
                success: true,
                message: 'User created successfully. You have received 5 bonus credits!',
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        username: user.username,
                        fullName: user.fullName
                    },
                    accessToken,
                    verificationToken: user.verificationToken, // For email verification
                    creditsBalance: credits.credits_balance
                }
            });
        } catch (error) {
            console.error('Signup error:', error);
            
            if (error.message.includes('already exists')) {
                return res.status(409).json({
                    success: false,
                    message: error.message
                });
            }
            
            res.status(500).json({
                success: false,
                message: 'Error creating user',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    
    // User login
    async login(req, res) {
        try {
            // Check validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ 
                    success: false,
                    errors: errors.array() 
                });
            }
            
            const { emailOrUsername, password } = req.body;
            const sessionId = req.sessionID; // Get current session ID for guest data claiming
            
            // Find user by email or username
            let user = await userModel.findByEmail(emailOrUsername);
            if (!user) {
                user = await userModel.findByUsername(emailOrUsername);
            }
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }
            
            // Verify password
            const isValidPassword = await userModel.verifyPassword(password, user.password_hash);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }
            
            // Claim any guest data if they exist
            if (sessionId) {
                try {
                    // Check if session has unclaimed data
                    const guestSession = await database.get(
                        'SELECT * FROM guest_sessions WHERE session_id = ? AND claimed_by_user_id IS NULL',
                        [sessionId]
                    );
                    
                    if (guestSession) {
                        // Claim guest resumes
                        const claimedResumes = await resumeModel.claimGuestResumes(sessionId, user.id);
                        
                        // Claim guest analyses
                        await database.run(
                            'UPDATE analyses SET user_id = ?, session_id = NULL WHERE session_id = ? AND user_id IS NULL',
                            [user.id, sessionId]
                        );
                        
                        // Mark session as claimed
                        await database.run(
                            'UPDATE guest_sessions SET claimed_by_user_id = ? WHERE session_id = ?',
                            [user.id, sessionId]
                        );
                        
                        console.log(`Claimed ${claimedResumes} resumes for user ${user.id} on login`);
                    }
                } catch (claimError) {
                    console.error('Error claiming guest data:', claimError);
                    // Don't fail login if claiming fails
                }
            }
            
            // Update last login
            await userModel.updateLastLogin(user.id);
            
            // Generate tokens
            const accessToken = this.generateAccessToken(user.id);
            const refreshToken = this.generateRefreshToken(user.id);
            
            // Save refresh token to database
            await userModel.saveRefreshToken(user.id, refreshToken);
            
            // Set cookies
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });
            
            res.json({
                success: true,
                message: 'Login successful',
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        username: user.username,
                        fullName: user.full_name,
                        isVerified: user.is_verified
                    },
                    accessToken
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Error during login',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    
    // Logout
    async logout(req, res) {
        try {
            const refreshToken = req.cookies.refreshToken;
            
            if (refreshToken) {
                // Revoke the refresh token
                await userModel.revokeRefreshToken(refreshToken);
            }
            
            // Clear the cookie
            res.clearCookie('refreshToken');
            
            res.json({
                success: true,
                message: 'Logout successful'
            });
        } catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({
                success: false,
                message: 'Error during logout',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    
    // Refresh access token
    async refreshToken(req, res) {
        try {
            const refreshToken = req.cookies.refreshToken;
            
            if (!refreshToken) {
                return res.status(401).json({
                    success: false,
                    message: 'No refresh token provided'
                });
            }
            
            // Verify refresh token format
            let decoded;
            try {
                decoded = jwt.verify(refreshToken, JWT_SECRET);
            } catch (error) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid refresh token'
                });
            }
            
            // Verify refresh token in database
            const userId = await userModel.verifyRefreshToken(refreshToken);
            
            if (!userId || userId !== decoded.userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid refresh token'
                });
            }
            
            // Generate new access token
            const accessToken = this.generateAccessToken(userId);
            
            // Optionally generate new refresh token (rotation)
            const newRefreshToken = this.generateRefreshToken(userId);
            await userModel.revokeRefreshToken(refreshToken);
            await userModel.saveRefreshToken(userId, newRefreshToken);
            
            // Set new refresh token cookie
            res.cookie('refreshToken', newRefreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });
            
            res.json({
                success: true,
                data: {
                    accessToken
                }
            });
        } catch (error) {
            console.error('Refresh token error:', error);
            res.status(500).json({
                success: false,
                message: 'Error refreshing token',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    
    // Get current user
    async getMe(req, res) {
        try {
            const userId = req.user.userId;
            const user = await userModel.getUserProfile(userId);
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            
            res.json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        username: user.username,
                        fullName: user.full_name,
                        isVerified: user.is_verified,
                        createdAt: user.created_at,
                        lastLoginAt: user.last_login_at
                    }
                }
            });
        } catch (error) {
            console.error('Get me error:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching user profile',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    
    // Verify email
    async verifyEmail(req, res) {
        try {
            const { token } = req.params;
            
            const verified = await userModel.verifyEmail(token);
            
            if (!verified) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid or expired verification token'
                });
            }
            
            res.json({
                success: true,
                message: 'Email verified successfully'
            });
        } catch (error) {
            console.error('Email verification error:', error);
            res.status(500).json({
                success: false,
                message: 'Error verifying email',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    
    // Request password reset
    async requestPasswordReset(req, res) {
        try {
            const { email } = req.body;
            
            const user = await userModel.findByEmail(email);
            
            if (!user) {
                // Don't reveal if user exists
                return res.json({
                    success: true,
                    message: 'If the email exists, a password reset link has been sent'
                });
            }
            
            const resetToken = await userModel.createPasswordResetToken(user.id);
            
            // TODO: Send email with reset token
            // For development, return the token
            if (process.env.NODE_ENV === 'development') {
                return res.json({
                    success: true,
                    message: 'Password reset token created',
                    resetToken // Remove in production
                });
            }
            
            res.json({
                success: true,
                message: 'If the email exists, a password reset link has been sent'
            });
        } catch (error) {
            console.error('Password reset request error:', error);
            res.status(500).json({
                success: false,
                message: 'Error requesting password reset',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    
    // Reset password
    async resetPassword(req, res) {
        try {
            const { token, newPassword } = req.body;
            
            const result = await userModel.resetPassword(token, newPassword);
            
            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    message: result.message
                });
            }
            
            res.json({
                success: true,
                message: result.message
            });
        } catch (error) {
            console.error('Password reset error:', error);
            res.status(500).json({
                success: false,
                message: 'Error resetting password',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    
    // Update profile
    async updateProfile(req, res) {
        try {
            const userId = req.user.userId;
            const updates = req.body;
            
            // Remove fields that shouldn't be updated here
            delete updates.password;
            delete updates.id;
            delete updates.is_verified;
            delete updates.is_active;
            
            const updated = await userModel.updateProfile(userId, updates);
            
            if (!updated) {
                return res.status(400).json({
                    success: false,
                    message: 'No updates provided'
                });
            }
            
            const user = await userModel.getUserProfile(userId);
            
            res.json({
                success: true,
                message: 'Profile updated successfully',
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        username: user.username,
                        fullName: user.full_name,
                        isVerified: user.is_verified
                    }
                }
            });
        } catch (error) {
            console.error('Update profile error:', error);
            
            if (error.message.includes('already exists')) {
                return res.status(409).json({
                    success: false,
                    message: error.message
                });
            }
            
            res.status(500).json({
                success: false,
                message: 'Error updating profile',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
}

const authController = new AuthController();
export default authController;