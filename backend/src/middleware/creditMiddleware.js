import creditService from '../services/creditService.js';
import creditsConfig from '../config/credits.config.js';

// Middleware to check if user has credits before allowing analysis
export const requireCredits = async (req, res, next) => {
    try {
        const ipAddress = creditService.getClientIp(req);
        const sessionId = req.sessionID;
        const userId = req.user?.userId;
        
        // Check if user is authenticated
        if (userId) {
            // Check user credits
            const hasCredits = await creditService.hasCredits(userId);
            
            if (!hasCredits) {
                const userCredits = await creditService.getUserCredits(userId);
                return res.status(402).json({
                    success: false,
                    error: 'INSUFFICIENT_CREDITS',
                    message: creditsConfig.messages.noCredits,
                    creditsRemaining: userCredits.credits_balance,
                    requiresPurchase: true
                });
            }
            
            // User has credits, proceed
            req.creditCheck = {
                hasCredits: true,
                isAnonymous: false,
                userId,
                ipAddress,
                sessionId
            };
            
            return next();
        }
        
        // Anonymous user - check IP usage
        const anonymousLimit = await creditService.checkAnonymousLimit(ipAddress);
        
        if (anonymousLimit.hasReachedLimit) {
            return res.status(402).json({
                success: false,
                error: 'ANONYMOUS_LIMIT_REACHED',
                message: creditsConfig.messages.anonymousLimit.replace('{limit}', anonymousLimit.limit),
                usageCount: anonymousLimit.usageCount,
                limit: anonymousLimit.limit,
                requiresSignup: true
            });
        }
        
        // Anonymous user still has free uses
        req.creditCheck = {
            hasCredits: true,
            isAnonymous: true,
            remaining: anonymousLimit.remaining,
            userId: null,
            ipAddress,
            sessionId
        };
        
        next();
    } catch (error) {
        console.error('Credit check middleware error:', error);
        res.status(500).json({
            success: false,
            error: 'Credit check failed',
            message: 'Unable to verify credit availability'
        });
    }
};

// Middleware to consume credits after successful analysis
export const consumeCredits = async (req, res, next) => {
    // This will be called after the analysis is complete
    // We'll hook this into the response to consume credits only on success
    
    const originalJson = res.json;
    
    res.json = async function(data) {
        // Only consume credits if the response is successful AND analysis completed properly
        const isSuccessful = res.statusCode === 200 && 
                           data && 
                           (data.analysisId || data.success) &&
                           !data.error &&
                           (!data.overallFitScore || data.overallFitScore > 0); // Don't consume if score is 0 (failed analysis)
        
        if (isSuccessful) {
            try {
                const { userId, ipAddress, sessionId, isAnonymous } = req.creditCheck || {};
                const { resumeId, occupationCode } = req.body;
                const analysisId = data.analysisId || null;
                
                if (isAnonymous) {
                    // Track anonymous usage
                    await creditService.trackAnonymousUsage(ipAddress, sessionId);
                    
                    // Add remaining count to response
                    const limit = await creditService.checkAnonymousLimit(ipAddress);
                    data.creditsRemaining = limit.remaining;
                } else if (userId) {
                    // Consume user credit
                    const result = await creditService.consumeCredit(
                        userId,
                        sessionId,
                        ipAddress,
                        resumeId,
                        occupationCode,
                        analysisId
                    );
                    
                    if (result.success) {
                        data.creditsRemaining = result.creditsRemaining;
                    }
                }
            } catch (error) {
                console.error('Error consuming credits:', error);
                // Don't fail the response, just log the error
            }
        }
        
        // Call the original json method
        return originalJson.call(this, data);
    };
    
    next();
};

// Middleware to get credit balance (doesn't block)
export const attachCreditInfo = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const ipAddress = creditService.getClientIp(req);
        
        if (userId) {
            const credits = await creditService.getUserCredits(userId);
            req.creditInfo = {
                isAuthenticated: true,
                creditsBalance: credits.credits_balance,
                totalUsed: credits.total_used
            };
        } else {
            const anonymousLimit = await creditService.checkAnonymousLimit(ipAddress);
            req.creditInfo = {
                isAuthenticated: false,
                remaining: anonymousLimit.remaining,
                limit: anonymousLimit.limit
            };
        }
    } catch (error) {
        console.error('Error attaching credit info:', error);
        req.creditInfo = null;
    }
    
    next();
};

export default {
    requireCredits,
    consumeCredits,
    attachCreditInfo
};