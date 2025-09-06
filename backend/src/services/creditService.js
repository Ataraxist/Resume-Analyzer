import database from '../db/database.js';
import creditsConfig from '../config/credits.config.js';

class CreditService {
    // Initialize credits for a new user
    async initializeUserCredits(userId, isNewSignup = false) {
        try {
            const existingCredits = await database.get(
                'SELECT * FROM user_credits WHERE user_id = ?',
                [userId]
            );
            
            if (existingCredits) {
                return existingCredits;
            }
            
            const initialCredits = isNewSignup ? creditsConfig.signup.bonusCredits : 0;
            
            await database.run(
                `INSERT INTO user_credits (user_id, credits_balance, total_purchased, total_used)
                 VALUES (?, ?, 0, 0)`,
                [userId, initialCredits]
            );
            
            return {
                user_id: userId,
                credits_balance: initialCredits,
                total_purchased: 0,
                total_used: 0
            };
        } catch (error) {
            console.error('Error initializing user credits:', error);
            throw error;
        }
    }
    
    // Get user's credit balance
    async getUserCredits(userId) {
        try {
            const credits = await database.get(
                'SELECT * FROM user_credits WHERE user_id = ?',
                [userId]
            );
            
            if (!credits) {
                // Initialize if not exists
                return await this.initializeUserCredits(userId, false);
            }
            
            return credits;
        } catch (error) {
            console.error('Error getting user credits:', error);
            throw error;
        }
    }
    
    // Check if user has enough credits
    async hasCredits(userId, requiredCredits = 1) {
        const credits = await this.getUserCredits(userId);
        return credits.credits_balance >= requiredCredits;
    }
    
    // Consume credits for an analysis
    async consumeCredit(userId, sessionId, ipAddress, resumeId, occupationCode, analysisId = null) {
        try {
            // Start transaction
            await database.run('BEGIN TRANSACTION');
            
            // Check and update user credits if authenticated
            if (userId) {
                const userCredits = await this.getUserCredits(userId);
                
                if (userCredits.credits_balance < creditsConfig.consumption.perAnalysis) {
                    await database.run('ROLLBACK');
                    return {
                        success: false,
                        error: 'Insufficient credits',
                        creditsRemaining: userCredits.credits_balance
                    };
                }
                
                // Deduct credit
                await database.run(
                    `UPDATE user_credits 
                     SET credits_balance = credits_balance - ?,
                         total_used = total_used + ?,
                         updated_at = CURRENT_TIMESTAMP
                     WHERE user_id = ?`,
                    [creditsConfig.consumption.perAnalysis, creditsConfig.consumption.perAnalysis, userId]
                );
            }
            
            // Log the credit usage
            await database.run(
                `INSERT INTO credit_usage (user_id, session_id, ip_address, resume_id, occupation_code, analysis_id)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [userId, sessionId, ipAddress, resumeId, occupationCode, analysisId]
            );
            
            // Commit transaction
            await database.run('COMMIT');
            
            // Get updated balance
            const updatedCredits = userId ? await this.getUserCredits(userId) : null;
            
            return {
                success: true,
                creditsRemaining: updatedCredits ? updatedCredits.credits_balance : null
            };
        } catch (error) {
            await database.run('ROLLBACK');
            console.error('Error consuming credit:', error);
            throw error;
        }
    }
    
    // Track anonymous IP usage
    async trackAnonymousUsage(ipAddress, sessionId) {
        try {
            const existing = await database.get(
                'SELECT * FROM ip_usage_tracking WHERE ip_address = ?',
                [ipAddress]
            );
            
            if (existing) {
                // Update existing record
                const sessionIds = JSON.parse(existing.session_ids || '[]');
                if (!sessionIds.includes(sessionId)) {
                    sessionIds.push(sessionId);
                }
                
                await database.run(
                    `UPDATE ip_usage_tracking 
                     SET usage_count = usage_count + 1,
                         last_use = CURRENT_TIMESTAMP,
                         session_ids = ?
                     WHERE ip_address = ?`,
                    [JSON.stringify(sessionIds), ipAddress]
                );
                
                return existing.usage_count + 1;
            } else {
                // Create new record
                await database.run(
                    `INSERT INTO ip_usage_tracking (ip_address, usage_count, session_ids)
                     VALUES (?, 1, ?)`,
                    [ipAddress, JSON.stringify([sessionId])]
                );
                
                return 1;
            }
        } catch (error) {
            console.error('Error tracking anonymous usage:', error);
            throw error;
        }
    }
    
    // Check anonymous usage limit
    async checkAnonymousLimit(ipAddress) {
        try {
            const usage = await database.get(
                'SELECT usage_count FROM ip_usage_tracking WHERE ip_address = ?',
                [ipAddress]
            );
            
            const usageCount = usage ? usage.usage_count : 0;
            const hasReachedLimit = usageCount >= creditsConfig.anonymous.freeCredits;
            const remaining = Math.max(0, creditsConfig.anonymous.freeCredits - usageCount);
            
            return {
                usageCount,
                hasReachedLimit,
                remaining,
                limit: creditsConfig.anonymous.freeCredits
            };
        } catch (error) {
            console.error('Error checking anonymous limit:', error);
            throw error;
        }
    }
    
    // Add credits to user account (for purchases)
    async addCredits(userId, packageId, transactionId = null, paymentMethod = null) {
        try {
            const pkg = creditsConfig.packages.find(p => p.id === packageId);
            if (!pkg) {
                throw new Error('Invalid package ID');
            }
            
            await database.run('BEGIN TRANSACTION');
            
            // Add credits to user balance
            await database.run(
                `UPDATE user_credits 
                 SET credits_balance = credits_balance + ?,
                     total_purchased = total_purchased + ?,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = ?`,
                [pkg.credits, pkg.credits, userId]
            );
            
            // Record the purchase
            await database.run(
                `INSERT INTO credit_purchases 
                 (user_id, package_type, credits_received, base_credits, bonus_credits, amount_paid, payment_method, transaction_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [userId, packageId, pkg.credits, pkg.baseCredits, pkg.bonusCredits, 
                 pkg.price, paymentMethod, transactionId]
            );
            
            await database.run('COMMIT');
            
            return await this.getUserCredits(userId);
        } catch (error) {
            await database.run('ROLLBACK');
            console.error('Error adding credits:', error);
            throw error;
        }
    }
    
    // Get user's credit history
    async getCreditHistory(userId, limit = 20) {
        try {
            const usage = await database.all(
                `SELECT cu.*, r.filename, o.title as occupation_title
                 FROM credit_usage cu
                 LEFT JOIN resumes r ON cu.resume_id = r.id
                 LEFT JOIN occupations o ON cu.occupation_code = o.code
                 WHERE cu.user_id = ?
                 ORDER BY cu.consumed_at DESC
                 LIMIT ?`,
                [userId, limit]
            );
            
            const purchases = await database.all(
                `SELECT * FROM credit_purchases
                 WHERE user_id = ?
                 ORDER BY purchase_date DESC
                 LIMIT ?`,
                [userId, limit]
            );
            
            return {
                usage,
                purchases
            };
        } catch (error) {
            console.error('Error getting credit history:', error);
            throw error;
        }
    }
    
    // Get IP address from request
    getClientIp(req) {
        return req.headers['x-forwarded-for']?.split(',')[0].trim() || 
               req.headers['x-real-ip'] || 
               req.connection?.remoteAddress || 
               req.socket?.remoteAddress || 
               req.ip;
    }
}

export default new CreditService();