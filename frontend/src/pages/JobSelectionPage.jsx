import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight, Info, TrendingUp, Users, Briefcase } from 'lucide-react';
import OccupationSearch from '../components/occupation/OccupationSearch';
import OccupationDetails from '../components/occupation/OccupationDetails';

function JobSelectionPage() {
  const navigate = useNavigate();
  const [selectedOccupation, setSelectedOccupation] = useState(null);

  const handleOccupationSelect = (occupation) => {
    setSelectedOccupation(occupation);
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
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Select Your Target Job
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
          Browse over 1,000 occupations from the O*NET database. Select the job you're 
          targeting to see how your resume matches its requirements.
        </p>
        
        {/* Info Cards - Compact version below header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="flex items-start space-x-3">
              <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 text-sm">
                  High-Growth Careers
                </h3>
                <p className="text-xs text-gray-700 mt-1">
                  Explore occupations with bright outlook and rapid growth.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <div className="flex items-start space-x-3">
              <Users className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 text-sm">
                  Detailed Requirements
                </h3>
                <p className="text-xs text-gray-700 mt-1">
                  Skills, knowledge, abilities, and education requirements.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
            <div className="flex items-start space-x-3">
              <Briefcase className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 text-sm">
                  Real Job Data
                </h3>
                <p className="text-xs text-gray-700 mt-1">
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
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Selected: {selectedOccupation.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  O*NET Code: {selectedOccupation.code}
                </p>
              </div>
              <button
                onClick={handleContinue}
                className="flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                Continue with this job
                <ArrowRight className="h-5 w-5 ml-2" />
              </button>
            </div>
          </div>

          <OccupationDetails 
            occupation={selectedOccupation}
          />
        </div>
      )}

    </div>
  );
}

export default JobSelectionPage;