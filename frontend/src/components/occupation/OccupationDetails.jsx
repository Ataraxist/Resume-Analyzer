import { useState, useEffect } from 'react';
import { Briefcase, GraduationCap, Code, Target, BookOpen, Wrench, Loader2 } from 'lucide-react';
import onetService from '../../services/onetService';

function OccupationDetails({ occupation }) {
  const [details, setDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  useEffect(() => {
    const fetchDetails = async () => {
      if (!occupation?.code) return;
      
      setIsLoading(true);
      try {
        const data = await onetService.getOccupationDetails(occupation.code);
        setDetails(data);
      } catch (error) {
        console.error('Failed to fetch occupation details:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDetails();
  }, [occupation]);
  
  if (!occupation) return null;
  
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Briefcase },
    { id: 'tasks', label: 'Tasks', icon: Target },
    { id: 'skills', label: 'Skills', icon: Code },
    { id: 'knowledge', label: 'Knowledge', icon: BookOpen },
    { id: 'tools', label: 'Tools', icon: Wrench },
    { id: 'education', label: 'Education', icon: GraduationCap }
  ];
  
  return (
    <div className="card">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Occupation Details</h2>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
        </div>
      ) : (
        <>
          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-gray-200">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-1" />
                  {tab.label}
                </button>
              );
            })}
          </div>
          
          {/* Tab Content */}
          <div className="min-h-[200px]">
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">{occupation.title}</h3>
                  <p className="text-sm text-gray-600">
                    {details?.occupation?.description || occupation.description}
                  </p>
                </div>
                
                {/* Show summary of tools and education if available */}
                {details?.tools && details.tools.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Tools & Technologies</p>
                    <p className="text-sm text-gray-700">{details.tools.length} tools used in this occupation</p>
                  </div>
                )}
                
                {details?.education && details.education.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Most Common Education</p>
                    <p className="text-sm text-gray-700">
                      {details.education[0].category} ({details.education[0].percentage}% of workers)
                    </p>
                  </div>
                )}
                
                {details?.bright_outlook && (
                  <div className="p-3 bg-success-50 border border-success-200 rounded-lg">
                    <p className="text-sm font-medium text-success-800">
                      ✨ Bright Outlook Occupation
                    </p>
                    <p className="text-xs text-success-600 mt-1">
                      This occupation is expected to grow rapidly in the coming years
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'tasks' && details?.tasks && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 mb-3">
                  Top {Math.min(5, details.tasks.length)} Tasks
                </p>
                {details.tasks.slice(0, 5).map((task, idx) => (
                  <div key={idx} className="flex items-start">
                    <span className="text-primary-600 mr-2 mt-0.5">•</span>
                    <p className="text-sm text-gray-700">{task.task_text}</p>
                  </div>
                ))}
              </div>
            )}
            
            {activeTab === 'skills' && details?.skills && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 mb-3">
                  Top {Math.min(10, details.skills.length)} Required Skills
                </p>
                <div className="flex flex-wrap gap-2">
                  {details.skills.slice(0, 10).map((skill, idx) => (
                    <span key={idx} className="badge badge-info">
                      {skill.skill_name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {activeTab === 'knowledge' && details?.knowledge && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 mb-3">
                  Key Knowledge Areas
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {details.knowledge.slice(0, 8).map((item, idx) => (
                    <div key={idx} className="text-sm text-gray-700">
                      • {item.knowledge_name}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {activeTab === 'tools' && details?.tools && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 mb-3">
                  Common Tools & Technologies
                </p>
                <div className="flex flex-wrap gap-2">
                  {details.tools.slice(0, 10).map((tool, idx) => (
                    <span key={idx} className="badge badge-warning" title={tool.tool_description}>
                      {tool.tool_name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {activeTab === 'education' && details?.education && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500 mb-3">
                  Education Requirements
                </p>
                {details.education.map((edu, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium text-gray-900">
                        {edu.category}
                      </p>
                      <span className="text-sm text-gray-600">
                        {edu.percentage}%
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary-600 h-2 rounded-full" 
                          style={{ width: `${edu.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default OccupationDetails;