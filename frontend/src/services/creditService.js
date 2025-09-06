import api from './api';

class CreditService {
    // Get current credit balance
    async getBalance() {
        try {
            const response = await api.get('/credits/balance');
            return response.data;
        } catch (error) {
            console.error('Error fetching credit balance:', error);
            throw error;
        }
    }
    
    // Get available credit packages
    async getPackages() {
        try {
            const response = await api.get('/credits/packages');
            return response.data;
        } catch (error) {
            console.error('Error fetching credit packages:', error);
            throw error;
        }
    }
    
    // Check if user can perform analysis
    async checkAvailability() {
        try {
            const response = await api.get('/credits/check-availability');
            return response.data;
        } catch (error) {
            console.error('Error checking credit availability:', error);
            throw error;
        }
    }
    
    // Purchase credits
    async purchaseCredits(packageId, paymentToken = null) {
        try {
            const response = await api.post('/credits/purchase', {
                packageId,
                paymentToken
            });
            return response.data;
        } catch (error) {
            console.error('Error purchasing credits:', error);
            throw error;
        }
    }
    
    // Get credit history
    async getHistory(limit = 20) {
        try {
            const response = await api.get('/credits/history', {
                params: { limit }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching credit history:', error);
            throw error;
        }
    }
}

export default new CreditService();