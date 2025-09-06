import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import creditService from '../services/creditService';

const CreditContext = createContext();

export const useCredits = () => {
    const context = useContext(CreditContext);
    if (!context) {
        throw new Error('useCredits must be used within a CreditProvider');
    }
    return context;
};

export const CreditProvider = ({ children }) => {
    const { user } = useAuth();
    const [credits, setCredits] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Fetch credit balance
    const fetchBalance = async () => {
        try {
            setLoading(true);
            const response = await creditService.getBalance();
            setCredits(response);
            setError(null);
        } catch (err) {
            console.error('Error fetching credits:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    // Check if user can analyze
    const canAnalyze = async () => {
        try {
            const response = await creditService.checkAvailability();
            return response;
        } catch (err) {
            console.error('Error checking availability:', err);
            return { canAnalyze: false, message: err.message };
        }
    };
    
    // Purchase credits
    const purchaseCredits = async (packageId, paymentToken = null) => {
        try {
            const response = await creditService.purchaseCredits(packageId, paymentToken);
            // Refresh balance after purchase
            await fetchBalance();
            return response;
        } catch (err) {
            console.error('Error purchasing credits:', err);
            throw err;
        }
    };
    
    // Update credits after analysis
    const consumeCredit = () => {
        if (credits) {
            if (credits.isAuthenticated) {
                setCredits(prev => ({
                    ...prev,
                    creditsBalance: Math.max(0, prev.creditsBalance - 1)
                }));
            } else {
                setCredits(prev => ({
                    ...prev,
                    remaining: Math.max(0, prev.remaining - 1),
                    usageCount: prev.usageCount + 1
                }));
            }
        }
    };
    
    // Fetch balance on mount and when user changes
    useEffect(() => {
        fetchBalance();
    }, [user]);
    
    // Format credit display
    const getDisplayText = () => {
        if (!credits) return '';
        
        if (credits.isAuthenticated) {
            const count = credits.creditsBalance;
            return `${count} credit${count !== 1 ? 's' : ''} left`;
        } else {
            const remaining = credits.remaining;
            return `${remaining} free credit${remaining !== 1 ? 's' : ''} left`;
        }
    };
    
    // Check if user has credits
    const hasCredits = () => {
        if (!credits) return false;
        
        if (credits.isAuthenticated) {
            return credits.creditsBalance > 0;
        } else {
            return credits.remaining > 0;
        }
    };
    
    const value = {
        credits,
        loading,
        error,
        fetchBalance,
        canAnalyze,
        purchaseCredits,
        consumeCredit,
        getDisplayText,
        hasCredits,
        isAuthenticated: credits?.isAuthenticated || false,
        balance: credits?.isAuthenticated ? credits.creditsBalance : credits?.remaining
    };
    
    return (
        <CreditContext.Provider value={value}>
            {children}
        </CreditContext.Provider>
    );
};