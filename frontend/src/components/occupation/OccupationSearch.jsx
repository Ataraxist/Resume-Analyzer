import { useState, useEffect } from 'react';
import { Search, TrendingUp, Loader2 } from 'lucide-react';
import onetService from '../../services/onetService';
import OccupationCard from './OccupationCard';

function OccupationSearch({ onSelect }) {
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
    setSearchQuery(occupation.title);
    setShowResults(false);
  };
  
  return (
    <div>
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Search Occupations</h2>
        
        {/* Search Input */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for an occupation (e.g., Software Developer, Manager)"
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
          <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
            {occupations.slice(0, 10).map((occupation) => (
              <button
                key={occupation.code}
                onClick={() => handleSelect(occupation)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
              >
                <p className="font-medium text-gray-900">{occupation.title}</p>
                <p className="text-xs text-gray-500">Code: {occupation.code}</p>
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
      {!showResults && (
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