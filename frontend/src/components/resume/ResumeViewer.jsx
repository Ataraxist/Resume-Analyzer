import { useState, useEffect, useCallback } from 'react';
import { User, Briefcase, GraduationCap, Code, Mail, Phone, MapPin, ScrollText, Save, Check, Info } from 'lucide-react';
import EditableText from '../common/EditableText';
import EditableList from '../common/EditableList';
import resumeService from '../../services/resumeService';

function ResumeViewer({ data: initialData, resumeId, editable = true }) {
  const [data, setData] = useState(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // null, 'saving', 'saved', 'error'
  const [saveTimeout, setSaveTimeout] = useState(null);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  // Debounced save function
  const saveData = useCallback(async (newData) => {
    if (!resumeId || !editable) return;
    
    setIsSaving(true);
    setSaveStatus('saving');
    
    try {
      await resumeService.updateStructuredData(resumeId, newData);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 2000); // Hide success message after 2s
    } catch (error) {
      console.error('Failed to save:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  }, [resumeId, editable]);

  // Update data with debouncing
  const updateData = useCallback((path, value) => {
    const newData = { ...data };
    const keys = path.split('.');
    let current = newData;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setData(newData);
    
    // Clear existing timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    
    // Set new timeout for auto-save (1.5 seconds after last change)
    const timeout = setTimeout(() => {
      saveData(newData);
    }, 1500);
    
    setSaveTimeout(timeout);
  }, [data, saveTimeout, saveData]);

  if (!data) return null;
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 relative">
      {/* AI Warning Ribbon - Super thin and compact */}
      <div className="bg-gradient-to-r from-pink-50 via-rose-50 to-pink-50 border-b border-pink-200 px-4 py-1">
        <div className="flex items-center space-x-2">
          <Info className="h-3 w-3 text-pink-500 flex-shrink-0" />
          <p className="text-[10px] sm:text-xs text-pink-800">
            <span className="ml-1">Our AI generated the results below so fill in any gaps we may have missed.</span>
            <span className="hidden sm:inline ml-1 text-pink-600"> Keep in mind, if our system struggled with your resume then HR systems might too.</span>
          </p>
        </div>
      </div>
      
      <div className="p-8">
        {/* Save Status Indicator */}
        {saveStatus && (
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {saveStatus === 'saving' && (
            <>
              <Save className="h-4 w-4 text-gray-500 animate-pulse" />
              <span className="text-sm text-gray-500">Saving...</span>
            </>
          )}
          {saveStatus === 'saved' && (
            <>
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-500">Saved</span>
            </>
          )}
          {saveStatus === 'error' && (
            <span className="text-sm text-red-500">Failed to save</span>
          )}
        </div>
      )}
      
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Resume Preview</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div>
          {/* Personal Information */}
          {data.personal_information && (
            <div className="mb-6">
              <div className="flex items-center mb-3">
                <User className="h-5 w-5 text-gray-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
              </div>
              
              <div className="ml-7 space-y-2">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Name:</span>{' '}
                  <EditableText
                    value={data.personal_information.name}
                    onChange={(value) => updateData('personal_information.name', value)}
                    placeholder="Enter name"
                    disabled={!editable}
                  />
                </p>
                
                <p className="text-sm text-gray-700 flex items-center">
                  <Mail className="h-3 w-3 mr-1" />
                  <EditableText
                    value={data.personal_information.email}
                    onChange={(value) => updateData('personal_information.email', value)}
                    placeholder="Enter email"
                    disabled={!editable}
                  />
                </p>
                
                <p className="text-sm text-gray-700 flex items-center">
                  <Phone className="h-3 w-3 mr-1" />
                  <EditableText
                    value={data.personal_information.phone}
                    onChange={(value) => updateData('personal_information.phone', value)}
                    placeholder="Enter phone"
                    disabled={!editable}
                  />
                </p>
                
                <p className="text-sm text-gray-700 flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  <EditableText
                    value={data.personal_information.location}
                    onChange={(value) => updateData('personal_information.location', value)}
                    placeholder="Enter location"
                    disabled={!editable}
                  />
                </p>
              </div>
            </div>
          )}
          
          {/* Summary */}
          {data.summary !== undefined && (
            <div className="mb-6">
              <div className="flex items-center mb-3">
                <ScrollText className="h-5 w-5 text-gray-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Professional Summary</h3>
              </div>
              <div className="ml-7">
                <EditableText
                  value={data.summary}
                  onChange={(value) => updateData('summary', value)}
                  placeholder="Enter professional summary"
                  className="text-sm text-gray-700 leading-relaxed block"
                  multiline={true}
                  disabled={!editable}
                />
              </div>
            </div>
          )}
          
          {/* Skills */}
          {data.skills && (
            <div className="mb-6">
              <div className="flex items-center mb-3">
                <Code className="h-5 w-5 text-gray-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Skills</h3>
              </div>
              
              <div className="ml-7 space-y-3">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Core Competencies</p>
                  <EditableList
                    items={data.skills.core_competencies || []}
                    onChange={(items) => updateData('skills.core_competencies', items)}
                    placeholder="competency"
                    badgeClass="badge badge-info"
                    disabled={!editable}
                  />
                </div>
                
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Technical Skills</p>
                  <EditableList
                    items={data.skills.technical_skills || []}
                    onChange={(items) => updateData('skills.technical_skills', items)}
                    placeholder="skill"
                    badgeClass="badge badge-info"
                    disabled={!editable}
                  />
                </div>
                
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Soft Skills</p>
                  <EditableList
                    items={data.skills.soft_skills || []}
                    onChange={(items) => updateData('skills.soft_skills', items)}
                    placeholder="skill"
                    badgeClass="badge badge-success"
                    disabled={!editable}
                  />
                </div>
                
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Tools & Equipment</p>
                  <EditableList
                    items={data.skills.tools_equipment || []}
                    onChange={(items) => updateData('skills.tools_equipment', items)}
                    placeholder="tool"
                    badgeClass="badge badge-warning"
                    disabled={!editable}
                  />
                </div>
                
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Certifications</p>
                  <EditableList
                    items={data.skills.certifications || []}
                    onChange={(items) => updateData('skills.certifications', items)}
                    placeholder="certification"
                    badgeClass="badge badge-danger"
                    disabled={!editable}
                  />
                </div>
                
                {data.skills.languages && (
                  <>
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Languages</p>
                      <EditableList
                        items={data.skills.languages.spoken || []}
                        onChange={(items) => updateData('skills.languages.spoken', items)}
                        placeholder="language"
                        badgeClass="badge badge-info"
                        disabled={!editable}
                      />
                    </div>
                    
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Programming Languages</p>
                      <EditableList
                        items={data.skills.languages.programming || []}
                        onChange={(items) => updateData('skills.languages.programming', items)}
                        placeholder="language"
                        badgeClass="badge badge-warning"
                        disabled={!editable}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Right Column */}
        <div>
          {/* Experience */}
          {data.experience && data.experience.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center mb-3">
                <Briefcase className="h-5 w-5 text-gray-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Experience ({data.experience.length})
                </h3>
              </div>
              
              <div className="ml-7 space-y-4">
                {data.experience.map((exp, idx) => (
                  <div key={idx} className="border-l-2 border-gray-200 pl-4">
                    <h4 className="font-medium text-gray-900">
                      <EditableText
                        value={exp.title || exp.position}
                        onChange={(value) => {
                          const newExp = [...data.experience];
                          newExp[idx] = { ...newExp[idx], title: value, position: value };
                          updateData('experience', newExp);
                        }}
                        placeholder="Job title"
                        disabled={!editable}
                      />
                    </h4>
                    <p className="text-sm text-gray-600">
                      <EditableText
                        value={exp.company}
                        onChange={(value) => {
                          const newExp = [...data.experience];
                          newExp[idx] = { ...newExp[idx], company: value };
                          updateData('experience', newExp);
                        }}
                        placeholder="Company"
                        disabled={!editable}
                      />
                    </p>
                    <p className="text-xs text-gray-500 mb-2">
                      <EditableText
                        value={exp.dates}
                        onChange={(value) => {
                          const newExp = [...data.experience];
                          newExp[idx] = { ...newExp[idx], dates: value };
                          updateData('experience', newExp);
                        }}
                        placeholder="Dates"
                        disabled={!editable}
                      />
                    </p>
                    {exp.responsibilities && (
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">Responsibilities:</p>
                        <EditableList
                          items={exp.responsibilities}
                          onChange={(items) => {
                            const newExp = [...data.experience];
                            newExp[idx] = { ...newExp[idx], responsibilities: items };
                            updateData('experience', newExp);
                          }}
                          placeholder="responsibility"
                          badgeClass="text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded"
                          disabled={!editable}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Education */}
          {data.education && data.education.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center mb-3">
                <GraduationCap className="h-5 w-5 text-gray-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Education</h3>
              </div>
              
              <div className="ml-7 space-y-3">
                {data.education.map((edu, idx) => (
                  <div key={idx}>
                    <h4 className="font-medium text-gray-900 text-sm">
                      <EditableText
                        value={edu.degree}
                        onChange={(value) => {
                          const newEdu = [...data.education];
                          newEdu[idx] = { ...newEdu[idx], degree: value };
                          updateData('education', newEdu);
                        }}
                        placeholder="Degree"
                        disabled={!editable}
                      />
                    </h4>
                    <p className="text-sm text-gray-600">
                      <EditableText
                        value={edu.institution}
                        onChange={(value) => {
                          const newEdu = [...data.education];
                          newEdu[idx] = { ...newEdu[idx], institution: value };
                          updateData('education', newEdu);
                        }}
                        placeholder="Institution"
                        disabled={!editable}
                      />
                    </p>
                    <p className="text-xs text-gray-500">
                      <EditableText
                        value={edu.dates}
                        onChange={(value) => {
                          const newEdu = [...data.education];
                          newEdu[idx] = { ...newEdu[idx], dates: value };
                          updateData('education', newEdu);
                        }}
                        placeholder="Dates"
                        disabled={!editable}
                      />
                    </p>
                    {edu.gpa && (
                      <p className="text-xs text-gray-600 mt-1">
                        GPA:{' '}
                        <EditableText
                          value={edu.gpa}
                          onChange={(value) => {
                            const newEdu = [...data.education];
                            newEdu[idx] = { ...newEdu[idx], gpa: value };
                            updateData('education', newEdu);
                          }}
                          placeholder="GPA"
                          disabled={!editable}
                        />
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}

export default ResumeViewer;