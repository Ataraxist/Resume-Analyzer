import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight, Info, TrendingUp, Users, Briefcase } from 'lucide-react';
import OccupationSearch from '../components/occupation/OccupationSearch';
import OccupationDetails from '../components/occupation/OccupationDetails';
import firebaseOccupationService from '../services/firebaseOccupationService';

function JobSelectionPage() {
  const navigate = useNavigate();
  const [selectedOccupation, setSelectedOccupation] = useState(null);
  const [displayedText, setDisplayedText] = useState('');
  const [allOccupations, setAllOccupations] = useState([]);
  const [occupationDetailsLoaded, setOccupationDetailsLoaded] = useState(false);
  const animationRef = useRef({
    currentOccupationIndex: 0,
    phase: 'typing', // 'typing' | 'holding' | 'deleting' | 'empty'
    phaseStartTime: Date.now()
  });
  
  // Fetch all occupations on component mount
  useEffect(() => {
    const fetchOccupations = async () => {
      try {
        // Get ALL occupation titles for true randomness
        const occupations = await firebaseOccupationService.getAllOccupationTitles();
        if (occupations && occupations.length > 0) {
          setAllOccupations(occupations);
          // Set initial random occupation
          animationRef.current.currentOccupationIndex = Math.floor(Math.random() * occupations.length);
        }
      } catch (error) {
        console.error('Failed to fetch occupations:', error);
        // Service already provides fallback, but add safety check
        setAllOccupations([{ title: 'Software Developer' }]);
      }
    };
    
    fetchOccupations();
  }, []);
  
  // Typewriter animation effect
  useEffect(() => {
    // Stop animation if an occupation is selected
    if (selectedOccupation) {
      setDisplayedText(selectedOccupation.title);
      return;
    }
    
    if (allOccupations.length === 0) return;
    
    const interval = setInterval(() => {
      const anim = animationRef.current;
      const elapsed = Date.now() - anim.phaseStartTime;
      const currentOccupation = allOccupations[anim.currentOccupationIndex]?.title || 'Software Developer';
      
      switch(anim.phase) {
        case 'typing':
          if (elapsed < 3000) {
            // Type characters proportionally over 3 seconds
            const progress = elapsed / 3000;
            const charsToShow = Math.floor(currentOccupation.length * progress);
            setDisplayedText(currentOccupation.slice(0, charsToShow));
          } else {
            // Done typing, move to holding
            setDisplayedText(currentOccupation);
            anim.phase = 'holding';
            anim.phaseStartTime = Date.now();
          }
          break;
          
        case 'holding':
          if (elapsed >= 5000) {
            // Done holding, start deleting
            anim.phase = 'deleting';
            anim.phaseStartTime = Date.now();
          }
          break;
          
        case 'deleting':
          if (elapsed < 1000) {
            // Delete characters proportionally over 1 second (doubled speed)
            const progress = elapsed / 1000;
            const charsToDelete = Math.floor(currentOccupation.length * progress);
            const charsToShow = currentOccupation.length - charsToDelete;
            setDisplayedText(currentOccupation.slice(0, Math.max(0, charsToShow)));
          } else {
            // Done deleting, move to empty
            setDisplayedText('');
            anim.phase = 'empty';
            anim.phaseStartTime = Date.now();
          }
          break;
          
        case 'empty':
          if (elapsed >= 1000) {
            // Pick new random occupation and restart
            anim.currentOccupationIndex = Math.floor(Math.random() * allOccupations.length);
            anim.phase = 'typing';
            anim.phaseStartTime = Date.now();
          }
          break;
      }
    }, 50); // Update every 50ms for smooth animation
    
    return () => clearInterval(interval);
  }, [allOccupations, selectedOccupation]);

  const handleOccupationSelect = (occupation) => {
    setSelectedOccupation(occupation);
    setDisplayedText(occupation.title);
    setOccupationDetailsLoaded(false); // Reset loading state for new selection
    // Store in sessionStorage for persistence
    sessionStorage.setItem('selectedOccupation', JSON.stringify(occupation));
  };

  const handleContinue = () => {
    if (selectedOccupation) {
      navigate('/upload', { 
        state: { selectedOccupation } 
      });
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
          }
        `}
      </style>
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Join the ranks of top
          </h1>
          <div className="text-4xl font-bold text-gray-900 dark:text-white min-h-[60px] flex items-center justify-center">
            <span>
              {displayedText}
              <span 
                className="inline-block w-0.5 h-8 bg-gray-900 dark:bg-gray-100 ml-1 align-middle"
                style={{
                  animation: 'blink 1s infinite'
                }}
              />
            </span>
          </div>
        </div>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
          Choose from {allOccupations.length || '1,000+'} career paths to map your professional journey. 
          Identify skill gaps, discover growth opportunities, and create your personalized development roadmap.
        </p>
        
        {/* Info Cards - Compact version below header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
            <div className="flex items-start space-x-3">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                  High-Growth Careers
                </h3>
                <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">
                  Explore occupations with bright outlook and rapid growth.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-lg p-4 border border-green-200 dark:border-green-700">
            <div className="flex items-start space-x-3">
              <Users className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                  Detailed Requirements
                </h3>
                <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">
                  Skills, knowledge, abilities, and education requirements.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
            <div className="flex items-start space-x-3">
              <Briefcase className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                  Real Job Data
                </h3>
                <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">
                  Data from O*NET, the primary US occupational source.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="mb-8">
        <OccupationSearch 
          onSelect={handleOccupationSelect}
          selectedOccupation={selectedOccupation}
        />
      </div>

      {/* Selected Occupation Details */}
      {selectedOccupation && (
        <div className="space-y-6">
          <div className="bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Selected: {selectedOccupation.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  O*NET Code: {selectedOccupation.code}
                </p>
              </div>
              <button
                onClick={handleContinue}
                disabled={!occupationDetailsLoaded}
                className={`flex items-center px-6 py-3 font-medium rounded-lg transition-colors ${
                  occupationDetailsLoaded 
                    ? 'bg-primary-600 text-white hover:bg-primary-700 cursor-pointer' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {occupationDetailsLoaded ? (
                  <>
                    Continue with this career
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </>
                ) : (
                  <>
                    Loading career details...
                    <div className="ml-2 h-5 w-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  </>
                )}
              </button>
            </div>
          </div>

          <OccupationDetails 
            occupation={selectedOccupation}
            onLoadComplete={() => setOccupationDetailsLoaded(true)}
          />
        </div>
      )}

    </div>
    </>
  );
}

export default JobSelectionPage;