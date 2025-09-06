import database from '../db/database.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

class UserModel {
    // Create a new user
    async createUser(userData) {
        const { email, username, password, fullName } = userData;
        
        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        
        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        
        const sql = `
            INSERT INTO users (
                email, username, password_hash, full_name,
                verification_token, verification_expires_at
            ) VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        const params = [
            email.toLowerCase(),
            username.toLowerCase(),
            passwordHash,
            fullName || null,
            verificationToken,
            verificationExpiresAt.toISOString()
        ];
        
        try {
            const result = await database.run(sql, params);
            return {
                id: result.id,
                email: email.toLowerCase(),
                username: username.toLowerCase(),
                fullName,
                verificationToken
            };
        } catch (error) {
            if (error.message.includes('UNIQUE constraint failed')) {
                if (error.message.includes('email')) {
                    throw new Error('Email already exists');
                }
                if (error.message.includes('username')) {
                    throw new Error('Username already exists');
                }
            }
            throw error;
        }
    }
    
    // Find user by email
    async findByEmail(email) {
        const sql = 'SELECT * FROM users WHERE email = ?';
        
        try {
            const user = await database.get(sql, [email.toLowerCase()]);
            return user;
        } catch (error) {
            console.error('Error finding user by email:', error);
            throw error;
        }
    }
    
    // Find user by username
    async findByUsername(username) {
        const sql = 'SELECT * FROM users WHERE username = ?';
        
        try {
            const user = await database.get(sql, [username.toLowerCase()]);
            return user;
        } catch (error) {
            console.error('Error finding user by username:', error);
            throw error;
        }
    }
    
    // Find user by ID
    async findById(id) {
        const sql = 'SELECT * FROM users WHERE id = ?';
        
        try {
            const user = await database.get(sql, [id]);
            return user;
        } catch (error) {
            console.error('Error finding user by id:', error);
            throw error;
        }
    }
    
    // Verify password
    async verifyPassword(plainPassword, hashedPassword) {
        try {
            return await bcrypt.compare(plainPassword, hashedPassword);
        } catch (error) {
            console.error('Error verifying password:', error);
            return false;
        }
    }
    
    // Update last login
    async updateLastLogin(userId) {
        const sql = `
            UPDATE users 
            SET last_login_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        
        try {
            await database.run(sql, [userId]);
            return true;
        } catch (error) {
            console.error('Error updating last login:', error);
            throw error;
        }
    }
    
    // Verify user email
    async verifyEmail(token) {
        const sql = `
            UPDATE users 
            SET is_verified = 1,
                verification_token = NULL,
                verification_expires_at = NULL
            WHERE verification_token = ? 
            AND verification_expires_at > datetime('now')
        `;
        
        try {
            const result = await database.run(sql, [token]);
            return result.changes > 0;
        } catch (error) {
            console.error('Error verifying email:', error);
            throw error;
        }
    }
    
    // Create password reset token
    async createPasswordResetToken(userId) {
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        
        const sql = `
            INSERT INTO password_reset_tokens (
                user_id, token, expires_at
            ) VALUES (?, ?, ?)
        `;
        
        try {
            await database.run(sql, [userId, token, expiresAt.toISOString()]);
            return token;
        } catch (error) {
            console.error('Error creating password reset token:', error);
            throw error;
        }
    }
    
    // Reset password
    async resetPassword(token, newPassword) {
        // First, verify the token
        const tokenSql = `
            SELECT user_id 
            FROM password_reset_tokens 
            WHERE token = ? 
            AND expires_at > datetime('now')
            AND used = 0
        `;
        
        try {
            const tokenData = await database.get(tokenSql, [token]);
            
            if (!tokenData) {
                return { success: false, message: 'Invalid or expired token' };
            }
            
            // Hash the new password
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(newPassword, salt);
            
            // Update the user's password
            const updateSql = `
                UPDATE users 
                SET password_hash = ?
                WHERE id = ?
            `;
            
            await database.run(updateSql, [passwordHash, tokenData.user_id]);
            
            // Mark the token as used
            const markUsedSql = `
                UPDATE password_reset_tokens 
                SET used = 1
                WHERE token = ?
            `;
            
            await database.run(markUsedSql, [token]);
            
            return { success: true, message: 'Password reset successfully' };
        } catch (error) {
            console.error('Error resetting password:', error);
            throw error;
        }
    }
    
    // Save refresh token
    async saveRefreshToken(userId, token) {
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        
        const sql = `
            INSERT INTO refresh_tokens (
                user_id, token, expires_at
            ) VALUES (?, ?, ?)
        `;
        
        try {
            await database.run(sql, [userId, token, expiresAt.toISOString()]);
            return true;
        } catch (error) {
            console.error('Error saving refresh token:', error);
            throw error;
        }
    }
    
    // Verify refresh token
    async verifyRefreshToken(token) {
        const sql = `
            SELECT user_id 
            FROM refresh_tokens 
            WHERE token = ? 
            AND expires_at > datetime('now')
            AND revoked = 0
        `;
        
        try {
            const result = await database.get(sql, [token]);
            return result ? result.user_id : null;
        } catch (error) {
            console.error('Error verifying refresh token:', error);
            throw error;
        }
    }
    
    // Revoke refresh token
    async revokeRefreshToken(token) {
        const sql = `
            UPDATE refresh_tokens 
            SET revoked = 1
            WHERE token = ?
        `;
        
        try {
            await database.run(sql, [token]);
            return true;
        } catch (error) {
            console.error('Error revoking refresh token:', error);
            throw error;
        }
    }
    
    // Update user profile
    async updateProfile(userId, updates) {
        const allowedFields = ['full_name', 'email', 'username'];
        const updateFields = [];
        const params = [];
        
        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                updateFields.push(`${field} = ?`);
                params.push(updates[field]);
            }
        }
        
        if (updateFields.length === 0) {
            return false;
        }
        
        params.push(userId);
        
        const sql = `
            UPDATE users 
            SET ${updateFields.join(', ')}, 
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        
        try {
            const result = await database.run(sql, params);
            return result.changes > 0;
        } catch (error) {
            if (error.message.includes('UNIQUE constraint failed')) {
                if (error.message.includes('email')) {
                    throw new Error('Email already exists');
                }
                if (error.message.includes('username')) {
                    throw new Error('Username already exists');
                }
            }
            throw error;
        }
    }
    
    // Get user profile (without sensitive data)
    async getUserProfile(userId) {
        const sql = `
            SELECT id, email, username, full_name, is_verified, 
                   created_at, last_login_at
            FROM users 
            WHERE id = ?
        `;
        
        try {
            return await database.get(sql, [userId]);
        } catch (error) {
            console.error('Error getting user profile:', error);
            throw error;
        }
    }
    
    // Delete user account
    async deleteUser(userId) {
        const sql = 'DELETE FROM users WHERE id = ?';
        
        try {
            const result = await database.run(sql, [userId]);
            return result.changes > 0;
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }
}

// Create singleton instance
const userModel = new UserModel();
export default userModel;