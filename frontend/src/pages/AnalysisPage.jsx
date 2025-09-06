import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import OccupationSearch from '../components/occupation/OccupationSearch';
import OccupationDetails from '../components/occupation/OccupationDetails';
import analysisService from '../services/analysisService';
import { Loader2 } from 'lucide-react';

function AnalysisPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedOccupation, setSelectedOccupation] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  
  const resumeId = location.state?.resumeId;
  const structuredData = location.state?.structuredData;
  
  useEffect(() => {
    if (!resumeId) {
      navigate('/upload');
    }
  }, [resumeId, navigate]);
  
  const handleOccupationSelect = (occupation) => {
    setSelectedOccupation(occupation);
    setError(null);
  };
  
  const handleAnalyze = async () => {
    if (!selectedOccupation || !resumeId) return;
    
    try {
      setIsAnalyzing(true);
      setError(null);
      
      const result = await analysisService.analyzeResume(
        resumeId,
        selectedOccupation.code
      );
      
      // Navigate to results page
      navigate(`/results/${result.analysisId}`, {
        state: { analysisData: result }
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Analysis failed. Please try again.');
      setIsAnalyzing(false);
    }
  };
  
  if (!resumeId) {
    return null;
  }
  
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Select Target Occupation</h1>
        <p className="text-gray-600">
          Choose the occupation you want to compare your resume against. We'll analyze how well your 
          qualifications match the O*NET requirements.
        </p>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-lg">
          <p className="text-sm text-danger-800">{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <OccupationSearch onSelect={handleOccupationSelect} />
          
          {selectedOccupation && (
            <div className="mt-6 p-4 bg-primary-50 border border-primary-200 rounded-lg">
              <p className="text-sm font-medium text-primary-800 mb-2">Selected Occupation:</p>
              <p className="text-lg font-semibold text-primary-900">
                {selectedOccupation.title}
              </p>
              <p className="text-sm text-primary-700 mt-1">
                Code: {selectedOccupation.code}
              </p>
            </div>
          )}
          
          <button
            onClick={handleAnalyze}
            disabled={!selectedOccupation || isAnalyzing}
            className="mt-6 w-full btn btn-primary flex items-center justify-center"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Analyzing Resume...
              </>
            ) : (
              'Start Analysis'
            )}
          </button>
        </div>
        
        <div>
          {selectedOccupation && (
            <OccupationDetails occupation={selectedOccupation} />
          )}
          
          {structuredData && (
            <div className="mt-6 card">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Resume Summary</h3>
              <div className="space-y-2 text-sm">
                {structuredData.experience && (
                  <p className="text-gray-600">
                    <span className="font-medium">Experience:</span> {structuredData.experience.length} positions
                  </p>
                )}
                {structuredData.skills && (
                  <>
                    {structuredData.skills.core_competencies && structuredData.skills.core_competencies.length > 0 && (
                      <p className="text-gray-600">
                        <span className="font-medium">Core Competencies:</span> {structuredData.skills.core_competencies.length} skills
                      </p>
                    )}
                    {structuredData.skills.technical_skills && structuredData.skills.technical_skills.length > 0 && (
                      <p className="text-gray-600">
                        <span className="font-medium">Technical Skills:</span> {structuredData.skills.technical_skills.length} skills
                      </p>
                    )}
                    {structuredData.skills.tools_equipment && structuredData.skills.tools_equipment.length > 0 && (
                      <p className="text-gray-600">
                        <span className="font-medium">Tools & Equipment:</span> {structuredData.skills.tools_equipment.length} items
                      </p>
                    )}
                    {structuredData.skills.certifications && structuredData.skills.certifications.length > 0 && (
                      <p className="text-gray-600">
                        <span className="font-medium">Certifications:</span> {structuredData.skills.certifications.length} certs
                      </p>
                    )}
                  </>
                )}
                {structuredData.education && (
                  <p className="text-gray-600">
                    <span className="font-medium">Education:</span> {structuredData.education.length} degrees
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AnalysisPage;