import creditService from '../services/creditService.js';
import creditsConfig from '../config/credits.config.js';

class CreditController {
    // Get current credit balance
    async getBalance(req, res) {
        try {
            const userId = req.user?.userId;
            const ipAddress = creditService.getClientIp(req);
            
            if (userId) {
                // Authenticated user
                const credits = await creditService.getUserCredits(userId);
                
                return res.json({
                    success: true,
                    isAuthenticated: true,
                    creditsBalance: credits.credits_balance,
                    totalPurchased: credits.total_purchased,
                    totalUsed: credits.total_used
                });
            } else {
                // Anonymous user
                const anonymousLimit = await creditService.checkAnonymousLimit(ipAddress);
                
                return res.json({
                    success: true,
                    isAuthenticated: false,
                    remaining: anonymousLimit.remaining,
                    limit: anonymousLimit.limit,
                    usageCount: anonymousLimit.usageCount
                });
            }
        } catch (error) {
            console.error('Error getting credit balance:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get credit balance'
            });
        }
    }
    
    // Get available credit packages
    async getPackages(req, res) {
        try {
            res.json({
                success: true,
                packages: creditsConfig.packages,
                currency: 'USD'
            });
        } catch (error) {
            console.error('Error getting packages:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get credit packages'
            });
        }
    }
    
    // Purchase credits (stub for payment integration)
    async purchaseCredits(req, res) {
        try {
            const userId = req.user?.userId;
            const { packageId, paymentToken } = req.body;
            
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentication required to purchase credits'
                });
            }
            
            if (!packageId) {
                return res.status(400).json({
                    success: false,
                    error: 'Package ID is required'
                });
            }
            
            // Find the package
            const pkg = creditsConfig.packages.find(p => p.id === packageId);
            if (!pkg) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid package ID'
                });
            }
            
            // TODO: Integrate with payment processor (Stripe/PayPal)
            // For now, we'll simulate a successful payment
            
            // Simulate payment processing
            const transactionId = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Add credits to user account
            const updatedCredits = await creditService.addCredits(
                userId,
                packageId,
                transactionId,
                'simulation' // payment method
            );
            
            res.json({
                success: true,
                message: `Successfully purchased ${pkg.credits} credits`,
                creditsBalance: updatedCredits.credits_balance,
                transactionId,
                package: {
                    name: pkg.name,
                    credits: pkg.credits,
                    price: pkg.price
                }
            });
        } catch (error) {
            console.error('Error purchasing credits:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to process credit purchase'
            });
        }
    }
    
    // Get credit history
    async getHistory(req, res) {
        try {
            const userId = req.user?.userId;
            
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentication required to view credit history'
                });
            }
            
            const { limit = 20 } = req.query;
            const history = await creditService.getCreditHistory(userId, parseInt(limit));
            
            res.json({
                success: true,
                ...history
            });
        } catch (error) {
            console.error('Error getting credit history:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get credit history'
            });
        }
    }
    
    // Check if user can perform analysis
    async checkAvailability(req, res) {
        try {
            const userId = req.user?.userId;
            const ipAddress = creditService.getClientIp(req);
            
            let canAnalyze = false;
            let message = '';
            let data = {};
            
            if (userId) {
                const hasCredits = await creditService.hasCredits(userId);
                const credits = await creditService.getUserCredits(userId);
                
                canAnalyze = hasCredits;
                message = hasCredits 
                    ? creditsConfig.messages.confirmUse.replace('{credits}', credits.credits_balance)
                    : creditsConfig.messages.noCredits;
                
                data = {
                    isAuthenticated: true,
                    creditsBalance: credits.credits_balance
                };
            } else {
                const anonymousLimit = await creditService.checkAnonymousLimit(ipAddress);
                
                canAnalyze = !anonymousLimit.hasReachedLimit;
                message = canAnalyze
                    ? `You have ${anonymousLimit.remaining} free analysis${anonymousLimit.remaining !== 1 ? 'es' : ''} remaining`
                    : creditsConfig.messages.anonymousLimit.replace('{limit}', anonymousLimit.limit);
                
                data = {
                    isAuthenticated: false,
                    remaining: anonymousLimit.remaining,
                    limit: anonymousLimit.limit
                };
            }
            
            res.json({
                success: true,
                canAnalyze,
                message,
                ...data
            });
        } catch (error) {
            console.error('Error checking availability:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to check credit availability'
            });
        }
    }
}

export default new CreditController();