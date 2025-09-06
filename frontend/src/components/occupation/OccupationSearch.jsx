import { useState, useEffect } from 'react';
import { Search, TrendingUp, Loader2, Sparkles, Users, Calendar } from 'lucide-react';
import onetService from '../../services/onetService';
import OccupationCard from './OccupationCard';

function OccupationSearch({ onSelect, selectedOccupation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [occupations, setOccupations] = useState([]);
  const [popularOccupations, setPopularOccupations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  useEffect(() => {
    // Load popular occupations
    setPopularOccupations(onetService.getPopularOccupations());
  }, []);
  
  useEffect(() => {
    const searchOccupations = async () => {
      if (searchQuery.length < 2) {
        setOccupations([]);
        setShowResults(false);
        return;
      }
      
      setIsLoading(true);
      try {
        const results = await onetService.searchWithDebounce(searchQuery);
        setOccupations(results.data || []);
        setShowResults(true);
      } catch (error) {
        console.error('Search failed:', error);
        setOccupations([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    searchOccupations();
  }, [searchQuery]);
  
  const handleSelect = (occupation) => {
    onSelect(occupation);
    setSearchQuery(''); // Clear the search after selection
    setShowResults(false);
  };
  
  return (
    <div>
      <div className={`card ${selectedOccupation ? 'border-green-200 bg-green-50/30' : ''}`}>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2 flex items-center">
          <Search className="h-6 w-6 mr-2 text-primary-600" />
          {selectedOccupation ? 'Change Selection' : 'Find Your Target Occupation'}
        </h2>
        <p className="text-gray-600 mb-4">
          {selectedOccupation 
            ? 'Search to change your occupation selection'
            : 'Search by job title, O*NET code, or keywords'}
        </p>
        
        {/* Search Input */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={selectedOccupation 
              ? "Search to change your selection..." 
              : "Search by job title, O*NET code, or keywords (e.g., Software Developer, 17-2061, Engineer)"}
            className="input pl-10"
          />
          {isLoading && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
            </div>
          )}
        </div>
        
        {/* Search Results */}
        {showResults && occupations.length > 0 && (
          <div className="border border-gray-200 rounded-lg max-h-[32rem] overflow-y-auto">
            {occupations.slice(0, 20).map((occupation) => (
              <button
                key={occupation.code}
                onClick={() => handleSelect(occupation)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-start justify-between mb-1">
                  <p className="font-medium text-gray-900">{occupation.title}</p>
                  <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600 ml-2">
                    {occupation.code}
                  </span>
                </div>
                
                {/* Badges */}
                <div className="flex items-center gap-2 mb-1">
                  {!!occupation.bright_outlook && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Bright Outlook
                    </span>
                  )}
                  {!!occupation.rapid_growth && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Rapid Growth
                    </span>
                  )}
                  {!!occupation.numerous_openings && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <Users className="h-3 w-3 mr-1" />
                      Many Openings
                    </span>
                  )}
                  {occupation.updated_year && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs text-gray-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      {occupation.updated_year}
                    </span>
                  )}
                </div>
                
                {occupation.description && (
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                    {occupation.description}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
        
        {showResults && occupations.length === 0 && !isLoading && (
          <div className="text-center py-4 text-gray-500">
            No occupations found matching "{searchQuery}"
          </div>
        )}
      </div>
      
      {/* Popular Occupations */}
      {!showResults && !selectedOccupation && (
        <div className="mt-6">
          <div className="flex items-center mb-4">
            <TrendingUp className="h-5 w-5 text-primary-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Popular Occupations</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {popularOccupations.map((occupation) => (
              <OccupationCard
                key={occupation.code}
                occupation={occupation}
                onSelect={handleSelect}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default OccupationSearch;