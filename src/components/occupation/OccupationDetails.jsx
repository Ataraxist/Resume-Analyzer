import { useState, useEffect } from 'react';
import { Briefcase, GraduationCap, Code, Target, BookOpen, Wrench, Loader2, Sparkles, ChevronDown, ChevronUp, Flame } from 'lucide-react';
import firebaseOccupationService from '../../services/firebaseOccupationService';

function OccupationDetails({ occupation, onLoadComplete }) {
  const [details, setDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState(false);
  const [expandedTechSkills, setExpandedTechSkills] = useState(false);
  const [expandedKnowledge, setExpandedKnowledge] = useState(false);
  const [expandedSkills, setExpandedSkills] = useState(false);
  const [expandedTools, setExpandedTools] = useState(false);
  
  useEffect(() => {
    const fetchDetails = async () => {
      if (!occupation?.code) return;
      
      setIsLoading(true);
      try {
        const data = await firebaseOccupationService.getOccupationDetails(occupation.code);
        setDetails(data);
        // Notify parent that loading is complete
        if (onLoadComplete) {
          onLoadComplete();
        }
      } catch (error) {
        // Still call onLoadComplete even on error so button becomes enabled
        if (onLoadComplete) {
          onLoadComplete();
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDetails();
  }, [occupation, onLoadComplete]);
  
  if (!occupation) return null;
  
  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="card">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
          </div>
        </div>
      ) : (
        <>
          {/* Overview Section */}
          <div className="card">
            <div className="flex items-center mb-4">
              <Briefcase className="h-5 w-5 text-primary-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Overview</h3>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                {details?.occupation?.description || occupation.description}
              </p>
              
              {details?.bright_outlook && (
                <div className="p-3 bg-success-50 border border-success-200 rounded-lg">
                  <div className="flex items-center">
                    <Sparkles className="h-4 w-4 text-success-600 mr-2" />
                    <p className="text-sm font-medium text-success-800">
                      Bright Outlook Occupation
                    </p>
                  </div>
                  <p className="text-xs text-success-600 mt-1">
                    This occupation is expected to grow rapidly in the coming years
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Tasks Section */}
          {details?.tasks && details.tasks.length > 0 && (
            <div className="card">
              <div className="flex items-center mb-4">
                <Target className="h-5 w-5 text-primary-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Key Tasks</h3>
                <span className="ml-auto text-sm text-gray-500">
                  {details.tasks.length} total
                </span>
              </div>
              <div className="space-y-3">
                {details.tasks.slice(0, expandedTasks ? details.tasks.length : 10).map((task, idx) => (
                  <div key={idx} className="flex items-start">
                    <span className="text-primary-500 mr-3">•</span>
                    <p className="text-sm text-gray-700 flex-1">{task.task_text}</p>
                  </div>
                ))}
                {details.tasks.length > 10 && (
                  <button
                    onClick={() => setExpandedTasks(!expandedTasks)}
                    className="flex items-center mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                  >
                    {expandedTasks ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-1" />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-1" />
                        Show {details.tasks.length - 10} more tasks
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Skills Section */}
          <div className="card">
            <div className="flex items-center mb-4">
              <Code className="h-5 w-5 text-primary-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Required Skills</h3>
              {details?.skills && details.skills.length > 0 && (
                <span className="ml-auto text-sm text-gray-500">
                  {details.skills.length} skills
                </span>
              )}
            </div>
            {details?.skills && details.skills.length > 0 ? (
              <>
                <div className="flex flex-wrap gap-2">
                  {details.skills
                    .slice(0, expandedSkills ? details.skills.length : 30)
                    .map((skill, idx) => (
                      <div
                        key={idx}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-200"
                        title={skill.skill_description}
                      >
                        {skill.skill_name}
                        {skill.importance_score && (
                          <span className="ml-1 text-xs opacity-70">
                            ({Math.round(skill.importance_score)})
                          </span>
                        )}
                      </div>
                    ))}
                </div>
                {details.skills.length > 30 && (
                  <button
                    onClick={() => setExpandedSkills(!expandedSkills)}
                    className="flex items-center mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                  >
                    {expandedSkills ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-1" />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-1" />
                        Show {details.skills.length - 30} more skills
                      </>
                    )}
                  </button>
                )}
              </>
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 text-center">
                  No skills data available for this occupation
                </p>
              </div>
            )}
          </div>

          {/* Knowledge Section */}
          <div className="card">
            <div className="flex items-center mb-4">
              <BookOpen className="h-5 w-5 text-primary-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Knowledge Areas</h3>
              {details?.knowledge && details.knowledge.length > 0 && (
                <span className="ml-auto text-sm text-gray-500">
                  {details.knowledge.length} areas
                </span>
              )}
            </div>
            {details?.knowledge && details.knowledge.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {details.knowledge
                    .slice(0, expandedKnowledge ? details.knowledge.length : 10)
                    .map((item, idx) => (
                      <div 
                        key={idx} 
                        className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                        title={item.knowledge_description}
                      >
                        <p className="text-sm font-medium text-gray-900">
                          {item.knowledge_name}
                        </p>
                        {item.importance_score && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                              <span>Importance</span>
                              <span>{Math.round(item.importance_score)}/100</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div 
                                className="bg-primary-500 h-1.5 rounded-full" 
                                style={{ width: `${item.importance_score}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
                {details.knowledge.length > 10 && (
                  <button
                    onClick={() => setExpandedKnowledge(!expandedKnowledge)}
                    className="flex items-center mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                  >
                    {expandedKnowledge ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-1" />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-1" />
                        Show {details.knowledge.length - 10} more areas
                      </>
                    )}
                  </button>
                )}
              </>
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 text-center">
                  No knowledge data available for this occupation
                </p>
              </div>
            )}
          </div>

          {/* Tools & Technology Section */}
          <div className="card">
            <div className="flex items-center mb-4">
              <Wrench className="h-5 w-5 text-primary-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Tools & Technology</h3>
              {details?.tools && details.tools.length > 0 && (
                <span className="ml-auto text-sm text-gray-500">
                  {details.tools.length} tools
                </span>
              )}
            </div>
            {details?.tools && details.tools.length > 0 ? (
              <>
                <div className="flex flex-wrap gap-2">
                  {details.tools
                    .slice(0, expandedTools ? details.tools.length : 30)
                    .map((tool, idx) => (
                      <div
                        key={idx}
                        className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-sm font-medium border border-amber-200"
                        title={tool.tool_description}
                      >
                        {tool.tool_name}
                      </div>
                    ))}
                </div>
                {details.tools.length > 30 && (
                  <button
                    onClick={() => setExpandedTools(!expandedTools)}
                    className="flex items-center mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                  >
                    {expandedTools ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-1" />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-1" />
                        Show {details.tools.length - 30} more tools
                      </>
                    )}
                  </button>
                )}
              </>
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 text-center">
                  No tools data available for this occupation
                </p>
              </div>
            )}
          </div>

          {/* Technology Skills Section (separate from tools) */}
          {details?.technologySkills && details.technologySkills.length > 0 && (
            <div className="card">
              <div className="flex items-center mb-4">
                <Code className="h-5 w-5 text-primary-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Technology Skills</h3>
                <span className="ml-auto text-sm text-gray-500">
                  {details.technologySkills.length} skills
                  {details.technologySkills.filter(t => t.hot_technology).length > 0 && (
                    <span className="ml-2">
                      (<Flame className="inline h-3 w-3 text-orange-600" /> {details.technologySkills.filter(t => t.hot_technology).length} hot)
                    </span>
                  )}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {details.technologySkills.slice(0, expandedTechSkills ? details.technologySkills.length : 30).map((tech, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-700 border-purple-200 rounded-full text-sm font-medium border"
                    title={tech.hot_technology ? "Hot Technology - High demand in the market" : tech.skill_name}
                  >
                    {tech.hot_technology && (
                      <Flame className="h-3.5 w-3.5 text-orange-600" />
                    )}
                    <span>{tech.skill_name}</span>
                  </div>
                ))}
              </div>
              {details.technologySkills.length > 30 && (
                <button
                  onClick={() => setExpandedTechSkills(!expandedTechSkills)}
                  className="flex items-center mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                >
                  {expandedTechSkills ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Show {details.technologySkills.length - 30} more skills
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Education Section */}
          {details && (
            <div className="card">
            <div className="flex items-center mb-4">
              <GraduationCap className="h-5 w-5 text-primary-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Education Requirements</h3>
            </div>
            {details?.education && details.education.length > 0 ? (
              // Check if any education item has percentage data
              details.education.some(edu => edu.percentage != null) ? (
                // A. Full view with percentages
                <div className="space-y-3">
                  {details.education.map((edu, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-medium text-gray-900">
                          {edu.category}
                        </p>
                        <span className="text-sm font-semibold text-primary-600">
                          {edu.percentage}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary-600 h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${edu.percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {edu.percentage}% of workers have this level of education
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                // B. Simple view without percentages
                <div className="space-y-2">
                  {details.education.map((edu, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm font-medium text-gray-900">
                        {edu.category}
                      </p>
                    </div>
                  ))}
                  <p className="text-xs text-gray-500 mt-2 italic">
                    Typical education requirements for this occupation
                  </p>
                </div>
              )
            ) : (
              // C. No data available
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 text-center">
                  No education data available for this occupation
                </p>
              </div>
            )}
          </div>
          )}

          {/* Job Zone Information */}
          {details?.jobZone ? (
            <div className="relative bg-primary-50 rounded-lg border border-primary-200 overflow-hidden">
              {/* Large background number */}
              <div className="absolute right-0 top-0 bottom-10 flex items-center pointer-events-none">
                <span 
                  className="text-white font-bold select-none"
                  style={{
                    fontSize: '16rem',
                    lineHeight: 1,
                    WebkitTextStroke: '3px #3b82f6',
                    textStroke: '1px #3b82f6',
                    opacity: 0.5
                  }}
                >
                  {details.jobZone.code}
                </span>
              </div>
              
              {/* Content */}
              <div className="relative z-10 p-4">
                <div className="flex items-center mb-3">
                  <Briefcase className="h-5 w-5 text-primary-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">{details.jobZone.title}</h3>
                </div>
                {details.jobZone.education && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Education:</span> {details.jobZone.education}
                    </p>
                  </div>
                )}
                {details.jobZone.related_experience && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Experience:</span> {details.jobZone.related_experience}
                    </p>
                  </div>
                )}
                {details.jobZone.on_the_job_training && (
                  <div>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Training:</span> {details.jobZone.on_the_job_training}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 text-center">
                  No job zone data available for this occupation
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default OccupationDetails;