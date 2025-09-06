import { useState, useEffect } from 'react';
import { X, Check, TrendingUp, Zap, Crown } from 'lucide-react';
import { useCredits } from '../../contexts/CreditContext';
import creditService from '../../services/creditService';

function CreditPurchaseModal({ isOpen, onClose }) {
    const { purchaseCredits, fetchBalance } = useCredits();
    const [packages, setPackages] = useState([]);
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    
    useEffect(() => {
        if (isOpen) {
            fetchPackages();
        }
    }, [isOpen]);
    
    const fetchPackages = async () => {
        try {
            const response = await creditService.getPackages();
            setPackages(response.packages);
            // Select the popular package by default
            const popular = response.packages.find(p => p.popular);
            if (popular) {
                setSelectedPackage(popular.id);
            }
        } catch (err) {
            setError('Failed to load credit packages');
        }
    };
    
    const handlePurchase = async () => {
        if (!selectedPackage) return;
        
        try {
            setLoading(true);
            setError(null);
            
            // Simulate purchase (in production, this would integrate with Stripe/PayPal)
            const result = await purchaseCredits(selectedPackage);
            
            setSuccess(true);
            setTimeout(() => {
                onClose();
                setSuccess(false);
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.error || 'Purchase failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    
    const getPackageIcon = (packageId) => {
        switch (packageId) {
            case 'single':
                return <Zap className="h-5 w-5" />;
            case 'small':
                return <TrendingUp className="h-5 w-5" />;
            case 'large':
                return <Crown className="h-5 w-5" />;
            default:
                return null;
        }
    };
    
    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto">
                {/* Header */}
                <div className="border-b px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Purchase Credits</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                
                {/* Content */}
                <div className="p-6">
                    {success ? (
                        <div className="text-center py-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-success-100 rounded-full mb-4">
                                <Check className="h-8 w-8 text-success-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Purchase Successful!
                            </h3>
                            <p className="text-gray-600">
                                Your credits have been added to your account.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Package Selection */}
                            <div className="grid md:grid-cols-3 gap-4 mb-6">
                                {packages.map((pkg) => (
                                    <div
                                        key={pkg.id}
                                        onClick={() => setSelectedPackage(pkg.id)}
                                        className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                                            selectedPackage === pkg.id
                                                ? 'border-primary-500 bg-primary-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        {pkg.popular && (
                                            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                                <span className="bg-primary-500 text-white text-xs px-2 py-1 rounded-full">
                                                    Most Popular
                                                </span>
                                            </div>
                                        )}
                                        
                                        <div className="text-center">
                                            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 ${
                                                selectedPackage === pkg.id
                                                    ? 'bg-primary-100 text-primary-600'
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}>
                                                {getPackageIcon(pkg.id)}
                                            </div>
                                            
                                            <h3 className="font-semibold text-gray-900 mb-1">
                                                {pkg.name}
                                            </h3>
                                            
                                            {pkg.description && (
                                                <p className="text-sm text-gray-600 mb-2">
                                                    {pkg.description}
                                                </p>
                                            )}
                                            
                                            <div className="text-2xl font-bold text-gray-900 mb-1">
                                                ${pkg.price}
                                            </div>
                                            
                                            <div className="text-sm text-gray-500">
                                                ${(pkg.price / pkg.credits).toFixed(2)} per credit
                                            </div>
                                            
                                            {pkg.savings && (
                                                <div className="mt-2">
                                                    <span className="inline-block bg-success-100 text-success-700 text-xs px-2 py-1 rounded">
                                                        {pkg.savings}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {selectedPackage === pkg.id && (
                                            <div className="absolute top-2 right-2">
                                                <div className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                                                    <Check className="h-3 w-3 text-white" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            
                            {/* Error Message */}
                            {error && (
                                <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-lg">
                                    <p className="text-sm text-danger-800">{error}</p>
                                </div>
                            )}
                            
                            {/* Info Box */}
                            <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                <h4 className="font-medium text-gray-900 mb-2">How credits work:</h4>
                                <ul className="space-y-1 text-sm text-gray-600">
                                    <li>• Each resume analysis uses 1 credit</li>
                                    <li>• Credits never expire</li>
                                    <li>• Buy in bulk for better value</li>
                                    <li>• Secure payment via Stripe</li>
                                </ul>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={onClose}
                                    className="btn btn-secondary"
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handlePurchase}
                                    className="btn btn-primary"
                                    disabled={!selectedPackage || loading}
                                >
                                    {loading ? 'Processing...' : 'Purchase Credits'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default CreditPurchaseModal;