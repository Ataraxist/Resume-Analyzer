// Credit system configuration
const creditsConfig = {
    // Anonymous user limits (increased for development)
    anonymous: {
        freeCredits: 100,  // Increased from 3 for development
        trackingMethod: 'ip' // Track by IP address
    },
    
    // New user signup bonus (increased for development)
    signup: {
        bonusCredits: 100  // Increased from 5 for development
    },
    
    // Credit packages available for purchase
    packages: [
        {
            id: 'single',
            name: '1 Credit',
            credits: 1,
            baseCredits: 1,
            bonusCredits: 0,
            price: 2.99, // USD
            popular: false
        },
        {
            id: 'small',
            name: '6 Credits',
            description: '5 + 1 bonus',
            credits: 6,
            baseCredits: 5,
            bonusCredits: 1,
            price: 12.99, // USD
            popular: true,
            savings: '13% off'
        },
        {
            id: 'large',
            name: '13 Credits',
            description: '10 + 3 bonus',
            credits: 13,
            baseCredits: 10,
            bonusCredits: 3,
            price: 24.99, // USD
            popular: false,
            savings: '23% off'
        }
    ],
    
    // Credit consumption
    consumption: {
        perAnalysis: 1 // Credits consumed per analysis
    },
    
    // Messages
    messages: {
        noCredits: 'You have no credits remaining. Please purchase credits to continue.',
        lowCredits: 'You have {credits} credit(s) remaining.',
        anonymousLimit: 'You have used all {limit} free analyses. Please create an account for 5 bonus credits.',
        confirmUse: 'This analysis will use 1 credit. You have {credits} credit(s) remaining.',
        signupBonus: 'Welcome! You have received 5 bonus credits for signing up.'
    }
};

export default creditsConfig;