import { useState } from 'react';
import { useCredits } from '../../contexts/CreditContext';
import { useAuth } from '../../contexts/AuthContext';
import { Coins, ShoppingCart, AlertCircle } from 'lucide-react';
import CreditPurchaseModal from './CreditPurchaseModal';

function CreditBadge() {
    const { credits, loading, hasCredits, getDisplayText } = useCredits();
    const { user } = useAuth();
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    
    if (loading) {
        return (
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 rounded-lg animate-pulse">
                <div className="h-4 w-20 bg-gray-300 rounded"></div>
            </div>
        );
    }
    
    if (!credits) return null;
    
    const isLowCredits = credits.isAuthenticated 
        ? credits.creditsBalance <= 2 
        : credits.remaining <= 1;
    
    const bgColor = !hasCredits() 
        ? 'bg-danger-50 border-danger-200' 
        : isLowCredits 
        ? 'bg-warning-50 border-warning-200' 
        : 'bg-primary-50 border-primary-200';
    
    const textColor = !hasCredits() 
        ? 'text-danger-700' 
        : isLowCredits 
        ? 'text-warning-700' 
        : 'text-primary-700';
    
    const iconColor = !hasCredits() 
        ? 'text-danger-500' 
        : isLowCredits 
        ? 'text-warning-500' 
        : 'text-primary-500';
    
    return (
        <>
            <div className={`flex items-center space-x-2 px-3 py-1.5 border rounded-lg ${bgColor}`}>
                {!hasCredits() ? (
                    <AlertCircle className={`h-4 w-4 ${iconColor}`} />
                ) : (
                    <Coins className={`h-4 w-4 ${iconColor}`} />
                )}
                <span className={`text-sm font-medium ${textColor}`}>
                    {getDisplayText()}
                </span>
                
                {/* Show purchase button for authenticated users */}
                {user && (
                    <button
                        onClick={() => setShowPurchaseModal(true)}
                        className={`ml-2 p-1 rounded hover:bg-white/50 transition-colors ${textColor}`}
                        title="Purchase credits"
                    >
                        <ShoppingCart className="h-3.5 w-3.5" />
                    </button>
                )}
                
                {/* Show warning for anonymous users at limit */}
                {!user && !hasCredits() && (
                    <span className="text-xs text-danger-600 ml-2">
                        Sign up for 5 free credits!
                    </span>
                )}
            </div>
            
            {/* Purchase Modal */}
            {showPurchaseModal && (
                <CreditPurchaseModal
                    isOpen={showPurchaseModal}
                    onClose={() => setShowPurchaseModal(false)}
                />
            )}
        </>
    );
}

export default CreditBadge;