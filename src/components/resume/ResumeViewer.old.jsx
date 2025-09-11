import { useState, useEffect, useCallback } from 'react';
import { 
  User, Briefcase, GraduationCap, Code, Mail, Phone, MapPin, ScrollText, 
  Save, Check, Info, FileText, Globe, Github, Linkedin, BookOpen, Award,
  Layers, Shield, GitBranch, Lightbulb, HandHeart, Heart, Presentation,
  FileKey, Users, DollarSign, UserCheck, Palette, Link, Plus
} from 'lucide-react';
import EditableText from '../common/EditableText';
import EditableList from '../common/EditableList';
import firebaseResumeService from '../../services/firebaseResumeService';
import { useAuth } from '../../contexts/FirebaseAuthContext';

function ResumeViewer({ data: initialData, resumeId, editable = true }) {
  const [data, setData] = useState(initialData);
  const [saveStatus, setSaveStatus] = useState(null); // null, 'saving', 'saved', 'error'
  const [saveTimeout, setSaveTimeout] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  // Debounced save function
  const saveData = useCallback(async (newData) => {
    if (!resumeId || !editable || !user) return;
    
    setSaveStatus('saving');
    
    try {
      await firebaseResumeService.updateResume(resumeId, user.uid, newData);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (error) {
      console.error('Error saving resume:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  }, [resumeId, editable, user]);

  // Update data with debouncing
  const updateData = useCallback((path, value) => {
    const newData = { ...data };
    const keys = path.split('.');
    let current = newData;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setData(newData);
    
    if (saveTimeout) clearTimeout(saveTimeout);
    
    const timeout = setTimeout(() => {
      saveData(newData);
    }, 1500);
    
    setSaveTimeout(timeout);
  }, [data, saveTimeout, saveData]);

  // Skeleton loader component
  const SectionSkeleton = () => (
    <div className="animate-pulse space-y-2">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
    </div>
  );

  // Section wrapper component
  const Section = ({ icon: Icon, title, children, className = "", noBorder = false, showSkeleton = false, isEmpty = false }) => (
    <div className={`${noBorder ? '' : 'border-b border-gray-200 dark:border-gray-700'} pb-6 ${className}`}>
      <div className="flex items-center mb-4">
        <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400 mr-2" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
      </div>
      <div className="ml-7">
        {showSkeleton ? (
          <SectionSkeleton />
        ) : isEmpty ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 italic">No data available yet</p>
        ) : (
          children
        )}
      </div>
    </div>
  );

  const AddButton = ({ onClick }) => (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
    >
      <Plus className="h-3 w-3" />
      Add
    </button>
  );

  if (!data) return null;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 relative">
      {/* AI Warning Ribbon */}
      <div className="bg-gradient-to-r from-pink-50 via-rose-50 to-pink-50 dark:from-pink-900/20 dark:via-rose-900/20 dark:to-pink-900/20 border-b border-pink-200 dark:border-pink-800 px-4 py-1">
        <div className="flex items-center space-x-2">
          <Info className="h-3 w-3 text-pink-500 dark:text-pink-400 flex-shrink-0" />
          <p className="text-[10px] sm:text-xs text-pink-800 dark:text-pink-300">
            <span className="ml-1">Our AI generated the results below so fill in any gaps we may have missed.</span>
            <span className="hidden sm:inline ml-1 text-pink-600 dark:text-pink-400"> Keep in mind, if our system struggled with your resume then HR systems might too.</span>
          </p>
        </div>
      </div>
      
      <div className="p-8 max-w-5xl mx-auto">
        {/* Save Status Indicator */}
        {saveStatus && (
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {saveStatus === 'saving' && (
              <>
                <Save className="h-4 w-4 text-gray-500 dark:text-gray-400 animate-pulse" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Saving...</span>
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
      
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Resume Preview</h2>
        
      
        <div className="space-y-6">
            {/* Personal Information */}
            <Section icon={User} title="Personal Information">
              <div className="space-y-2">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Name:</span>{' '}
                  <EditableText
                    value={data.personal_information?.name}
                    onChange={(value) => updateData('personal_information.name', value)}
                    placeholder="Enter name"
                    disabled={!editable}
                  />
                </p>
                
                <p className="text-sm text-gray-700 dark:text-gray-300 flex items-center">
                  <Mail className="h-3 w-3 mr-1" />
                  <EditableText
                    value={data.personal_information?.email}
                    onChange={(value) => updateData('personal_information.email', value)}
                    placeholder="Enter email"
                    disabled={!editable}
                  />
                </p>
                
                <p className="text-sm text-gray-700 dark:text-gray-300 flex items-center">
                  <Phone className="h-3 w-3 mr-1" />
                  <EditableText
                    value={data.personal_information?.phone}
                    onChange={(value) => updateData('personal_information.phone', value)}
                    placeholder="Enter phone"
                    disabled={!editable}
                  />
                </p>
                
                
                {/* Professional Links - Always show */}
                <div className="mt-3 space-y-1">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Professional Links</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 flex items-center">
                    <Linkedin className="h-3 w-3 mr-1" />
                    <EditableText
                      value={data.personal_information?.profiles?.linkedin || ''}
                      onChange={(value) => updateData('personal_information.profiles.linkedin', value)}
                      placeholder="LinkedIn URL"
                      disabled={!editable}
                    />
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 flex items-center">
                    <Github className="h-3 w-3 mr-1" />
                    <EditableText
                      value={data.personal_information?.profiles?.github || ''}
                      onChange={(value) => updateData('personal_information.profiles.github', value)}
                      placeholder="GitHub URL"
                      disabled={!editable}
                    />
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 flex items-center">
                    <Globe className="h-3 w-3 mr-1" />
                    <EditableText
                      value={data.personal_information?.profiles?.website || 
                            data.personal_information?.profiles?.portfolio || ''}
                      onChange={(value) => updateData('personal_information.profiles.website', value)}
                      placeholder="Website/Portfolio"
                      disabled={!editable}
                    />
                  </p>
                </div>
              </div>
            </Section>
            
            {/* Summary */}
            <Section icon={ScrollText} title="Professional Summary">
              <EditableText
                value={data.summary}
                onChange={(value) => updateData('summary', value)}
                placeholder="Enter professional summary"
                className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed block"
                multiline={true}
                disabled={!editable}
              />
            </Section>
            
            
            {/* Skills - Always show */}
            <Section icon={Code} title="Skills">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Technical Skills</p>
                    <EditableList
                      items={data.skills?.technical || []}
                      onChange={(items) => updateData('skills.technical', items)}
                      placeholder="skill"
                      badgeClass="badge badge-purple"
                      disabled={!editable}
                    />
                  </div>
                  
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Soft Skills</p>
                    <EditableList
                      items={data.skills?.soft_skills || []}
                      onChange={(items) => updateData('skills.soft_skills', items)}
                      placeholder="skill"
                      badgeClass="badge badge-green"
                      disabled={!editable}
                    />
                  </div>
                  
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tools</p>
                    <EditableList
                      items={data.skills?.tools || []}
                      onChange={(items) => updateData('skills.tools', items)}
                      placeholder="tool"
                      badgeClass="badge badge-blue"
                      disabled={!editable}
                    />
                  </div>
                  
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Domain Expertise</p>
                    <EditableList
                      items={data.skills?.domains || []}
                      onChange={(items) => updateData('skills.domains', items)}
                      placeholder="domain"
                      badgeClass="badge badge-yellow"
                      disabled={!editable}
                    />
                  </div>
                  
                  {/* Programming Languages */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Programming Languages</p>
                    <div className="flex flex-wrap gap-1">
                      {data.skills?.programming_languages?.length > 0 ? (
                        data.skills.programming_languages.map((lang, idx) => (
                          <span key={idx} className="badge badge-red text-xs">
                            {lang.name}
                            {lang.proficiency && ` (${lang.proficiency})`}
                            {lang.years && ` - ${lang.years}y`}
                          </span>
                        ))
                      ) : null}
                    </div>
                  </div>
                  
                  {/* Spoken Languages */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Languages</p>
                    <div className="flex flex-wrap gap-1">
                      {data.skills?.spoken_languages?.length > 0 ? (
                        data.skills.spoken_languages.map((lang, idx) => (
                          <span key={idx} className="badge badge-emerald text-xs">
                            {lang.language}
                            {lang.proficiency && ` (${lang.proficiency})`}
                          </span>
                        ))
                      ) : null}
                    </div>
                  </div>
                </div>
              </Section>
            
            {/* Credentials - Always show */}
            <Section icon={Shield} title="Credentials">
              <div className="space-y-3">
                {/* Certifications */}
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Certifications</p>
                  {data.credentials?.certifications?.length > 0 ? (
                    <>
                      {data.credentials.certifications.map((cert, idx) => (
                        <div key={idx} className="border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            <EditableText
                              value={cert.name}
                              onChange={(value) => {
                                const newCerts = [...data.credentials.certifications];
                                newCerts[idx] = { ...newCerts[idx], name: value };
                                updateData('credentials.certifications', newCerts);
                              }}
                              placeholder="Certification name"
                              disabled={!editable}
                            />
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500">
                            <EditableText
                              value={cert.issuer}
                              onChange={(value) => {
                                const newCerts = [...data.credentials.certifications];
                                newCerts[idx] = { ...newCerts[idx], issuer: value };
                                updateData('credentials.certifications', newCerts);
                              }}
                              placeholder="Issuer"
                              disabled={!editable}
                            />
                            {' - '}
                            <EditableText
                              value={cert.issue_date}
                              onChange={(value) => {
                                const newCerts = [...data.credentials.certifications];
                                newCerts[idx] = { ...newCerts[idx], issue_date: value };
                                updateData('credentials.certifications', newCerts);
                              }}
                              placeholder="Date"
                              disabled={!editable}
                            />
                          </div>
                        </div>
                      ))}
                    </>
                  ) : null}
                  {editable && (
                    <AddButton 
                        onClick={() => {
                          const currentCerts = data.credentials?.certifications || [];
                          const newCert = { name: '', issuer: '', issue_date: '' };
                          updateData('credentials.certifications', [...currentCerts, newCert]);
                        }}
                      />
                  )}
                </div>
                
                {/* Licenses */}
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Licenses</p>
                  {data.credentials?.licenses?.length > 0 ? (
                    data.credentials.licenses.map((lic, idx) => (
                        <div key={idx} className="border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            <EditableText
                              value={lic.name}
                              onChange={(value) => {
                                const newLics = [...data.credentials.licenses];
                                newLics[idx] = { ...newLics[idx], name: value };
                                updateData('credentials.licenses', newLics);
                              }}
                              placeholder="License name"
                              disabled={!editable}
                            />
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500">
                            <EditableText
                              value={lic.authority}
                              onChange={(value) => {
                                const newLics = [...data.credentials.licenses];
                                newLics[idx] = { ...newLics[idx], authority: value };
                                updateData('credentials.licenses', newLics);
                              }}
                              placeholder="Authority"
                              disabled={!editable}
                            />
                            {' - '}
                            <EditableText
                              value={lic.region}
                              onChange={(value) => {
                                const newLics = [...data.credentials.licenses];
                                newLics[idx] = { ...newLics[idx], region: value };
                                updateData('credentials.licenses', newLics);
                              }}
                              placeholder="Region"
                              disabled={!editable}
                            />
                          </div>
                        </div>
                    ))
                  ) : null}
                  {editable && (
                    <AddButton 
                        onClick={() => {
                          const currentLics = data.credentials?.licenses || [];
                          const newLic = { name: '', authority: '', region: '', number: '', issued: '', expiry: '' };
                          updateData('credentials.licenses', [...currentLics, newLic]);
                        }}
                      />
                  )}
                </div>
                
                {/* Security Clearances */}
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Security Clearances</p>
                  <EditableList
                    items={data.credentials?.security_clearances || []}
                    onChange={(items) => updateData('credentials.security_clearances', items)}
                    placeholder="clearance"
                    badgeClass="badge badge-red"
                    disabled={!editable}
                  />
                </div>
              </div>
            </Section>
          
            {/* Experience */}
            <Section icon={Briefcase} title={`Experience${data.experience?.length ? ` (${data.experience.length})` : ''}`} >
                {data.experience?.length > 0 ? (
                <div className="space-y-3">
                  {data.experience.map((exp, idx) => (
                    <div key={idx} className="border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        <EditableText
                          value={exp.role}
                          onChange={(value) => {
                            const newExp = [...data.experience];
                            newExp[idx] = { ...newExp[idx], role: value };
                            updateData('experience', newExp);
                          }}
                          placeholder="Role"
                          disabled={!editable}
                        />
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <EditableText
                          value={exp.organization}
                          onChange={(value) => {
                            const newExp = [...data.experience];
                            newExp[idx] = { ...newExp[idx], organization: value };
                            updateData('experience', newExp);
                          }}
                          placeholder="Organization"
                          disabled={!editable}
                        />
                        {exp.department && ` - ${exp.department}`}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {exp.dates && (exp.dates.start || exp.dates.end) ? 
                          `${exp.dates.start || ''} - ${exp.dates.is_current ? 'Present' : exp.dates.end || ''}` :
                          'Dates not specified'}
                        {exp.location && ` | ${[exp.location.city, exp.location.region, exp.location.country].filter(Boolean).join(', ')}`}
                      </div>
                      {exp.responsibilities?.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 dark:text-gray-500">Responsibilities:</p>
                          <EditableList
                            items={exp.responsibilities}
                            onChange={(items) => {
                              const newExp = [...data.experience];
                              newExp[idx] = { ...newExp[idx], responsibilities: items };
                              updateData('experience', newExp);
                            }}
                            placeholder="responsibility"
                            badgeClass="text-xs text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded"
                            disabled={!editable}
                          />
                        </div>
                      )}
                      {exp.achievements?.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 dark:text-gray-500">Achievements:</p>
                          <EditableList
                            items={exp.achievements}
                            onChange={(items) => {
                              const newExp = [...data.experience];
                              newExp[idx] = { ...newExp[idx], achievements: items };
                              updateData('experience', newExp);
                            }}
                            placeholder="achievement"
                            badgeClass="text-xs text-gray-700 dark:text-gray-300 bg-green-100 dark:bg-green-900 px-2 py-1 rounded"
                            disabled={!editable}
                          />
                        </div>
                      )}
                      {exp.technologies?.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Technologies:</p>
                          <EditableList
                            items={exp.technologies}
                            onChange={(items) => {
                              const newExp = [...data.experience];
                              newExp[idx] = { ...newExp[idx], technologies: items };
                              updateData('experience', newExp);
                            }}
                            placeholder="technology"
                            badgeClass="badge badge-sm badge-gray text-xs"
                            disabled={!editable}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                ) : null}
                {editable && (
                  <AddButton 
                      onClick={() => {
                        const currentExp = data.experience || [];
                        const newExp = { 
                          role: '', 
                          organization: '', 
                          dates: { start: '', end: '', is_current: false },
                          responsibilities: [],
                          achievements: [],
                          technologies: []
                        };
                        updateData('experience', [...currentExp, newExp]);
                      }}
                    />
                )}
              </Section>
            
            {/* Education */}
            <Section icon={GraduationCap} title="Education">
                {data.education?.length > 0 ? (
                <div className="space-y-3">
                  {data.education.map((edu, idx) => (
                    <div key={idx} className="border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
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
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Field: <EditableText
                          value={edu.field_of_study}
                          onChange={(value) => {
                            const newEdu = [...data.education];
                            newEdu[idx] = { ...newEdu[idx], field_of_study: value };
                            updateData('education', newEdu);
                          }}
                          placeholder="Field of study"
                          disabled={!editable}
                        />
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
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
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {edu.dates && (edu.dates.start || edu.dates.end) ? 
                          `${edu.dates.start || ''} - ${edu.dates.is_current ? 'Present' : edu.dates.end || ''}` :
                          'Dates not specified'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        GPA: <EditableText
                          value={edu.gpa}
                          onChange={(value) => {
                            const newEdu = [...data.education];
                            newEdu[idx] = { ...newEdu[idx], gpa: value };
                            updateData('education', newEdu);
                          }}
                          placeholder="GPA"
                          disabled={!editable}
                        />
                      </div>
                      {edu.honors_awards?.length > 0 && (
                        <div className="mt-1">
                          <p className="text-xs text-gray-500 dark:text-gray-500">Honors:</p>
                          <EditableList
                            items={edu.honors_awards}
                            onChange={(items) => {
                              const newEdu = [...data.education];
                              newEdu[idx] = { ...newEdu[idx], honors_awards: items };
                              updateData('education', newEdu);
                            }}
                            placeholder="honor/award"
                            badgeClass="badge badge-sm badge-yellow text-xs"
                            disabled={!editable}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                ) : null}
                {editable && (
                  <AddButton 
                      onClick={() => {
                        const currentEdu = data.education || [];
                        const newEdu = { 
                          degree: '', 
                          field: '', 
                          institution: '',
                          dates: { start: '', end: '' },
                          gpa: '',
                          coursework: [],
                          honors: []
                        };
                        updateData('education', [...currentEdu, newEdu]);
                      }}
                    />
                )}
              </Section>
            
            {/* Projects */}
            <Section icon={Layers} title="Projects">
                {data.projects?.length > 0 ? (
                <div className="space-y-3">
                  {data.projects.map((proj, idx) => (
                    <div key={idx} className="border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        <EditableText
                          value={proj.name}
                          onChange={(value) => {
                            const newProj = [...data.projects];
                            newProj[idx] = { ...newProj[idx], name: value };
                            updateData('projects', newProj);
                          }}
                          placeholder="Project name"
                          disabled={!editable}
                        />
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        <EditableText
                          value={proj.role}
                          onChange={(value) => {
                            const newProj = [...data.projects];
                            newProj[idx] = { ...newProj[idx], role: value };
                            updateData('projects', newProj);
                          }}
                          placeholder="Role"
                          disabled={!editable}
                        />
                      </div>
                      <EditableText
                        value={proj.description}
                        onChange={(value) => {
                          const newProj = [...data.projects];
                          newProj[idx] = { ...newProj[idx], description: value };
                          updateData('projects', newProj);
                        }}
                        placeholder="Description"
                        className="text-sm text-gray-700 dark:text-gray-300 mt-1 block"
                        multiline={true}
                        disabled={!editable}
                      />
                      {proj.technologies?.length > 0 && (
                        <div className="mt-2">
                          <EditableList
                            items={proj.technologies}
                            onChange={(items) => {
                              const newProj = [...data.projects];
                              newProj[idx] = { ...newProj[idx], technologies: items };
                              updateData('projects', newProj);
                            }}
                            placeholder="technology"
                            badgeClass="badge badge-sm badge-blue text-xs"
                            disabled={!editable}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                ) : null}
                {editable && (
                  <AddButton 
                      onClick={() => {
                        const currentProjects = data.projects || [];
                        const newProject = { 
                          name: '', 
                          role: '', 
                          date: '',
                          description: '',
                          outcomes: [],
                          technologies: [],
                          url: ''
                        };
                        updateData('projects', [...currentProjects, newProject]);
                      }}
                    />
                )}
              </Section>
            
            {/* Publications */}
            <Section icon={BookOpen} title="Publications">
                {data.publications?.length > 0 ? (
                <div className="space-y-3">
                  {data.publications.map((pub, idx) => (
                    <div key={idx} className="border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        <EditableText
                          value={pub.title}
                        onChange={(value) => {
                          const newPubs = [...data.publications];
                          newPubs[idx] = { ...newPubs[idx], title: value };
                          updateData('publications', newPubs);
                        }}
                          placeholder="Publication title"
                          disabled={!editable}
                        />
                      </div>
                      <EditableText
                        value={pub.venue}
                        onChange={(value) => {
                          const newPubs = [...data.publications];
                          newPubs[idx] = { ...newPubs[idx], venue: value };
                          updateData('publications', newPubs);
                        }}
                        placeholder="Venue"
                        className="text-xs text-gray-500 dark:text-gray-500 block"
                        disabled={!editable}
                      />
                      <EditableText
                        value={pub.date}
                        onChange={(value) => {
                          const newPubs = [...data.publications];
                          newPubs[idx] = { ...newPubs[idx], date: value };
                          updateData('publications', newPubs);
                        }}
                        placeholder="Date"
                        className="text-xs text-gray-500 dark:text-gray-500 block"
                        disabled={!editable}
                      />
                    </div>
                  ))}
                </div>
                ) : null}
                {editable && (
                  <AddButton 
                      onClick={() => {
                        const currentPubs = data.publications || [];
                        const newPub = { 
                          title: '', 
                          authors: [], 
                          venue: '',
                          date: '',
                          doi: '',
                          url: ''
                        };
                        updateData('publications', [...currentPubs, newPub]);
                      }}
                    />
                )}
              </Section>
            
            {/* Awards & Honors */}
            <Section icon={Award} title="Awards & Honors">
                {data.awards_honors?.length > 0 ? (
                <div className="space-y-3">
                  {data.awards_honors.map((award, idx) => (
                    <div key={idx} className="border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                      <EditableText
                        value={award.name}
                        onChange={(value) => {
                          const newAwards = [...data.awards_honors];
                          newAwards[idx] = { ...newAwards[idx], name: value };
                          updateData('awards_honors', newAwards);
                        }}
                        placeholder="Award name"
                        disabled={!editable}
                      />
                      <EditableText
                        value={award.issuer}
                        onChange={(value) => {
                          const newAwards = [...data.awards_honors];
                          newAwards[idx] = { ...newAwards[idx], issuer: value };
                          updateData('awards_honors', newAwards);
                        }}
                        placeholder="Issuer"
                        className="text-xs text-gray-500 dark:text-gray-500 block"
                        disabled={!editable}
                      />
                      <EditableText
                        value={award.date}
                        onChange={(value) => {
                          const newAwards = [...data.awards_honors];
                          newAwards[idx] = { ...newAwards[idx], date: value };
                          updateData('awards_honors', newAwards);
                        }}
                        placeholder="Date"
                        className="text-xs text-gray-500 dark:text-gray-500 block"
                        disabled={!editable}
                      />
                    </div>
                  ))}
                </div>
                ) : null}
                {editable && (
                  <AddButton 
                      onClick={() => {
                        const currentAwards = data.awards_honors || [];
                        const newAward = { 
                          title: '', 
                          issuer: '', 
                          date: '',
                          description: ''
                        };
                        updateData('awards_honors', [...currentAwards, newAward]);
                      }}
                    />
                )}
              </Section>
            
            {/* Volunteer Work */}
            <Section icon={HandHeart} title="Service & Volunteering">
              {data.service_volunteering?.length > 0 ? (
                <div className="space-y-3">
                  {data.service_volunteering.map((vol, idx) => (
                    <div key={idx} className="border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                      <EditableText
                        value={vol.organization}
                        onChange={(value) => {
                          const newVol = [...data.service_volunteering];
                          newVol[idx] = { ...newVol[idx], organization: value };
                          updateData('service_volunteering', newVol);
                        }}
                        placeholder="Organization"
                        disabled={!editable}
                      />
                      <EditableText
                        value={vol.role}
                        onChange={(value) => {
                          const newVol = [...data.service_volunteering];
                          newVol[idx] = { ...newVol[idx], role: value };
                          updateData('service_volunteering', newVol);
                        }}
                        placeholder="Role"
                        className="text-xs text-gray-500 dark:text-gray-500 block"
                        disabled={!editable}
                      />
                      <EditableText
                        value={vol.description}
                        onChange={(value) => {
                          const newVol = [...data.service_volunteering];
                          newVol[idx] = { ...newVol[idx], description: value };
                          updateData('service_volunteering', newVol);
                        }}
                        placeholder="Description"
                        className="text-xs text-gray-500 dark:text-gray-500 block"
                        multiline={true}
                        disabled={!editable}
                      />
                    </div>
                  ))}
                </div>
              ) : null}
              {editable && (
                <AddButton 
                    onClick={() => {
                      const currentService = data.service_volunteering || [];
                      const newService = { 
                        role: '', 
                        organization: '', 
                        cause: '',
                        dates: { start: '', end: '', is_current: false },
                        impact: '',
                        responsibilities: []
                      };
                      updateData('service_volunteering', [...currentService, newService]);
                    }}
                  />
              )}
            </Section>
            
            {/* Open Source */}
            <Section icon={GitBranch} title="Open Source Contributions">
              {data.open_source?.length > 0 ? (
                <div className="space-y-3">
                  {data.open_source.map((os, idx) => (
                    <div key={idx} className="border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                      <EditableText
                        value={os.project}
                        onChange={(value) => {
                          const newOS = [...data.open_source];
                          newOS[idx] = { ...newOS[idx], project: value };
                          updateData('open_source', newOS);
                        }}
                        placeholder="Project name"
                        disabled={!editable}
                      />
                      <EditableText
                        value={os.role}
                        onChange={(value) => {
                          const newOS = [...data.open_source];
                          newOS[idx] = { ...newOS[idx], role: value };
                          updateData('open_source', newOS);
                        }}
                        placeholder="Role"
                        className="text-xs text-gray-500 dark:text-gray-500 block"
                        disabled={!editable}
                      />
                      {os.contributions?.length > 0 && (
                        <div className="mt-1">
                          <p className="text-xs text-gray-500 dark:text-gray-500">Contributions:</p>
                          <EditableList
                            items={os.contributions}
                            onChange={(items) => {
                              const newOS = [...data.open_source];
                              newOS[idx] = { ...newOS[idx], contributions: items };
                              updateData('open_source', newOS);
                            }}
                            placeholder="contribution"
                            badgeClass="text-xs text-gray-500 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded"
                            disabled={!editable}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : null}
              {editable && (
                <AddButton 
                    onClick={() => {
                      const currentOS = data.open_source || [];
                      const newOS = { 
                        project: '', 
                        role: '', 
                        contributions: [],
                        url: ''
                      };
                      updateData('open_source', [...currentOS, newOS]);
                    }}
                  />
              )}
            </Section>
            
            {/* Presentations */}
            <Section icon={Presentation} title="Presentations">
              {data.presentations?.length > 0 ? (
                <div className="space-y-3">
                  {data.presentations.map((pres, idx) => (
                    <div key={idx} className="border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                      <EditableText
                        value={pres.title}
                        onChange={(value) => {
                          const newPres = [...data.presentations];
                          newPres[idx] = { ...newPres[idx], title: value };
                          updateData('presentations', newPres);
                        }}
                        placeholder="Presentation title"
                        disabled={!editable}
                      />
                      <EditableText
                        value={pres.event}
                        onChange={(value) => {
                          const newPres = [...data.presentations];
                          newPres[idx] = { ...newPres[idx], event: value };
                          updateData('presentations', newPres);
                        }}
                        placeholder="Event"
                        className="text-xs text-gray-500 dark:text-gray-500 block"
                        disabled={!editable}
                      />
                      {pres.type && (
                        <span className="text-xs text-gray-500 dark:text-gray-500">
                          Type: {pres.type}
                        </span>
                      )}
                      <EditableText
                        value={pres.date}
                        onChange={(value) => {
                          const newPres = [...data.presentations];
                          newPres[idx] = { ...newPres[idx], date: value };
                          updateData('presentations', newPres);
                        }}
                        placeholder="Date"
                        className="text-xs text-gray-500 dark:text-gray-500 block"
                        disabled={!editable}
                      />
                    </div>
                  ))}
                </div>
              ) : null}
              {editable && (
                <AddButton 
                    onClick={() => {
                      const currentPres = data.presentations || [];
                      const newPres = { 
                        title: '', 
                        event: '', 
                        type: '',
                        date: ''
                      };
                      updateData('presentations', [...currentPres, newPres]);
                    }}
                  />
              )}
            </Section>
            
            {/* Patents */}
            <Section icon={FileKey} title="Patents">
              {data.patents?.length > 0 ? (
                <div className="space-y-3">
                  {data.patents.map((patent, idx) => (
                    <div key={idx} className="border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                      <EditableText
                        value={patent.title}
                        onChange={(value) => {
                          const newPatents = [...data.patents];
                          newPatents[idx] = { ...newPatents[idx], title: value };
                          updateData('patents', newPatents);
                        }}
                        placeholder="Patent title"
                        disabled={!editable}
                      />
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        <EditableText
                          value={patent.number}
                          onChange={(value) => {
                            const newPatents = [...data.patents];
                            newPatents[idx] = { ...newPatents[idx], number: value };
                            updateData('patents', newPatents);
                          }}
                          placeholder="Patent number"
                          disabled={!editable}
                        />
                        {patent.status && ` - ${patent.status}`}
                      </div>
                      <EditableText
                        value={patent.assignee}
                        onChange={(value) => {
                          const newPatents = [...data.patents];
                          newPatents[idx] = { ...newPatents[idx], assignee: value };
                          updateData('patents', newPatents);
                        }}
                        placeholder="Assignee"
                        className="text-xs text-gray-500 dark:text-gray-500 block"
                        disabled={!editable}
                      />
                      {patent.inventors?.length > 0 && (
                        <div className="mt-1">
                          <p className="text-xs text-gray-500 dark:text-gray-500">Inventors:</p>
                          <EditableList
                            items={patent.inventors}
                            onChange={(items) => {
                              const newPatents = [...data.patents];
                              newPatents[idx] = { ...newPatents[idx], inventors: items };
                              updateData('patents', newPatents);
                            }}
                            placeholder="inventor"
                            badgeClass="text-xs text-gray-500 dark:text-gray-500"
                            disabled={!editable}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : null}
              {editable && (
                <AddButton 
                    onClick={() => {
                      const currentPatents = data.patents || [];
                      const newPatent = { 
                        title: '', 
                        number: '', 
                        status: '',
                        assignee: '',
                        date: '',
                        inventors: []
                      };
                      updateData('patents', [...currentPatents, newPatent]);
                    }}
                  />
              )}
            </Section>
            
            {/* Teaching */}
            <Section icon={GraduationCap} title="Teaching Experience">
              {data.teaching?.length > 0 ? (
                <div className="space-y-3">
                  {data.teaching.map((teach, idx) => (
                    <div key={idx} className="border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                      <EditableText
                        value={teach.role}
                        onChange={(value) => {
                          const newTeaching = [...data.teaching];
                          newTeaching[idx] = { ...newTeaching[idx], role: value };
                          updateData('teaching', newTeaching);
                        }}
                        placeholder="Role"
                        disabled={!editable}
                      />
                      <EditableText
                        value={teach.course}
                        onChange={(value) => {
                          const newTeaching = [...data.teaching];
                          newTeaching[idx] = { ...newTeaching[idx], course: value };
                          updateData('teaching', newTeaching);
                        }}
                        placeholder="Course"
                        className="text-xs text-gray-500 dark:text-gray-500 block"
                        disabled={!editable}
                      />
                      <EditableText
                        value={teach.institution}
                        onChange={(value) => {
                          const newTeaching = [...data.teaching];
                          newTeaching[idx] = { ...newTeaching[idx], institution: value };
                          updateData('teaching', newTeaching);
                        }}
                        placeholder="Institution"
                        className="text-xs text-gray-500 dark:text-gray-500 block"
                        disabled={!editable}
                      />
                      <EditableText
                        value={teach.term}
                        onChange={(value) => {
                          const newTeaching = [...data.teaching];
                          newTeaching[idx] = { ...newTeaching[idx], term: value };
                          updateData('teaching', newTeaching);
                        }}
                        placeholder="Term"
                        className="text-xs text-gray-500 dark:text-gray-500 block"
                        disabled={!editable}
                      />
                      {teach.responsibilities?.length > 0 && (
                        <div className="mt-1">
                          <p className="text-xs text-gray-500 dark:text-gray-500">Responsibilities:</p>
                          <EditableList
                            items={teach.responsibilities}
                            onChange={(items) => {
                              const newTeaching = [...data.teaching];
                              newTeaching[idx] = { ...newTeaching[idx], responsibilities: items };
                              updateData('teaching', newTeaching);
                            }}
                            placeholder="responsibility"
                            badgeClass="text-xs text-gray-500 dark:text-gray-500"
                            disabled={!editable}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : null}
              {editable && (
                <AddButton 
                    onClick={() => {
                      const currentTeaching = data.teaching || [];
                      const newTeaching = { 
                        role: '', 
                        course: '', 
                        institution: '',
                        term: '',
                        responsibilities: []
                      };
                      updateData('teaching', [...currentTeaching, newTeaching]);
                    }}
                  />
              )}
            </Section>
            
            {/* Creative Portfolio */}
            <Section icon={Palette} title="Creative Portfolio">
              {data.creative_portfolio?.length > 0 ? (
                <div className="space-y-3">
                  {data.creative_portfolio.map((item, idx) => (
                    <div key={idx} className="border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                      <EditableText
                        value={item.title}
                        onChange={(value) => {
                          const newPortfolio = [...data.creative_portfolio];
                          newPortfolio[idx] = { ...newPortfolio[idx], title: value };
                          updateData('creative_portfolio', newPortfolio);
                        }}
                        placeholder="Title"
                        disabled={!editable}
                      />
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        <EditableText
                          value={item.medium}
                          onChange={(value) => {
                            const newPortfolio = [...data.creative_portfolio];
                            newPortfolio[idx] = { ...newPortfolio[idx], medium: value };
                            updateData('creative_portfolio', newPortfolio);
                          }}
                          placeholder="Medium"
                          disabled={!editable}
                        />
                        {item.role && ` - ${item.role}`}
                      </div>
                      <EditableText
                        value={item.venue}
                        onChange={(value) => {
                          const newPortfolio = [...data.creative_portfolio];
                          newPortfolio[idx] = { ...newPortfolio[idx], venue: value };
                          updateData('creative_portfolio', newPortfolio);
                        }}
                        placeholder="Venue"
                        className="text-xs text-gray-500 dark:text-gray-500 block"
                        disabled={!editable}
                      />
                      <EditableText
                        value={item.date}
                        onChange={(value) => {
                          const newPortfolio = [...data.creative_portfolio];
                          newPortfolio[idx] = { ...newPortfolio[idx], date: value };
                          updateData('creative_portfolio', newPortfolio);
                        }}
                        placeholder="Date"
                        className="text-xs text-gray-500 dark:text-gray-500 block"
                        disabled={!editable}
                      />
                    </div>
                  ))}
                </div>
              ) : null}
              {editable && (
                <AddButton 
                    onClick={() => {
                      const currentPortfolio = data.creative_portfolio || [];
                      const newItem = { 
                        title: '', 
                        medium: '', 
                        date: '',
                        description: '',
                        url: '',
                        venue: ''
                      };
                      updateData('creative_portfolio', [...currentPortfolio, newItem]);
                    }}
                  />
              )}
            </Section>
            
            {/* Affiliations & Memberships */}
            <Section icon={Users} title="Affiliations & Memberships">
              {data.affiliations_memberships?.length > 0 ? (
                <div className="space-y-3">
                  {data.affiliations_memberships.map((affiliation, idx) => (
                    <div key={idx} className="border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                      <EditableText
                        value={affiliation.organization}
                        onChange={(value) => {
                          const newAffiliations = [...data.affiliations_memberships];
                          newAffiliations[idx] = { ...newAffiliations[idx], organization: value };
                          updateData('affiliations_memberships', newAffiliations);
                        }}
                        placeholder="Organization"
                        disabled={!editable}
                      />
                      <EditableText
                        value={affiliation.role}
                        onChange={(value) => {
                          const newAffiliations = [...data.affiliations_memberships];
                          newAffiliations[idx] = { ...newAffiliations[idx], role: value };
                          updateData('affiliations_memberships', newAffiliations);
                        }}
                        placeholder="Role"
                        className="text-xs text-gray-500 dark:text-gray-500 block"
                        disabled={!editable}
                      />
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {affiliation.dates && (affiliation.dates.start || affiliation.dates.end) ? 
                          `${affiliation.dates.start || ''} - ${affiliation.dates.is_current ? 'Present' : affiliation.dates.end || ''}` :
                          'Dates not specified'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
              {editable && (
                <AddButton 
                    onClick={() => {
                      const currentAffiliations = data.affiliations_memberships || [];
                      const newAffiliation = { 
                        organization: '', 
                        role: '', 
                        dates: { start: '', end: '', is_current: false }
                      };
                      updateData('affiliations_memberships', [...currentAffiliations, newAffiliation]);
                    }}
                  />
              )}
            </Section>
            
            {/* Grants & Funding */}
            <Section icon={DollarSign} title="Grants & Funding">
              {data.grants_funding?.length > 0 ? (
                <div className="space-y-3">
                  {data.grants_funding.map((grant, idx) => (
                    <div key={idx} className="border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                      <EditableText
                        value={grant.name}
                        onChange={(value) => {
                          const newGrants = [...data.grants_funding];
                          newGrants[idx] = { ...newGrants[idx], name: value };
                          updateData('grants_funding', newGrants);
                        }}
                        placeholder="Grant name"
                        disabled={!editable}
                      />
                      <EditableText
                        value={grant.sponsor}
                        onChange={(value) => {
                          const newGrants = [...data.grants_funding];
                          newGrants[idx] = { ...newGrants[idx], sponsor: value };
                          updateData('grants_funding', newGrants);
                        }}
                        placeholder="Sponsor"
                        className="text-xs text-gray-500 dark:text-gray-500 block"
                        disabled={!editable}
                      />
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        <EditableText
                          value={grant.amount}
                          onChange={(value) => {
                            const newGrants = [...data.grants_funding];
                            newGrants[idx] = { ...newGrants[idx], amount: value };
                            updateData('grants_funding', newGrants);
                          }}
                          placeholder="Amount"
                          disabled={!editable}
                        />
                        {grant.role && ` - ${grant.role}`}
                      </div>
                      <EditableText
                        value={grant.date}
                        onChange={(value) => {
                          const newGrants = [...data.grants_funding];
                          newGrants[idx] = { ...newGrants[idx], date: value };
                          updateData('grants_funding', newGrants);
                        }}
                        placeholder="Date"
                        className="text-xs text-gray-500 dark:text-gray-500 block"
                        disabled={!editable}
                      />
                    </div>
                  ))}
                </div>
              ) : null}
              {editable && (
                <AddButton 
                    onClick={() => {
                      const currentGrants = data.grants_funding || [];
                      const newGrant = { 
                        title: '', 
                        funder: '', 
                        amount: '',
                        dates: { start: '', end: '' },
                        role: '',
                        description: ''
                      };
                      updateData('grants_funding', [...currentGrants, newGrant]);
                    }}
                  />
              )}
            </Section>
            
            {/* References */}
            <Section icon={UserCheck} title="References">
              {data.references?.length > 0 ? (
                <div className="space-y-3">
                  {data.references.map((ref, idx) => (
                    <div key={idx} className="border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                      <EditableText
                        value={ref.name}
                        onChange={(value) => {
                          const newRefs = [...data.references];
                          newRefs[idx] = { ...newRefs[idx], name: value };
                          updateData('references', newRefs);
                        }}
                        placeholder="Name"
                        disabled={!editable}
                      />
                      <EditableText
                        value={ref.relationship}
                        onChange={(value) => {
                          const newRefs = [...data.references];
                          newRefs[idx] = { ...newRefs[idx], relationship: value };
                          updateData('references', newRefs);
                        }}
                        placeholder="Relationship"
                        className="text-xs text-gray-500 dark:text-gray-500 block"
                        disabled={!editable}
                      />
                      <EditableText
                        value={ref.contact}
                        onChange={(value) => {
                          const newRefs = [...data.references];
                          newRefs[idx] = { ...newRefs[idx], contact: value };
                          updateData('references', newRefs);
                        }}
                        placeholder="Contact information"
                        className="text-xs text-gray-500 dark:text-gray-500 block"
                        disabled={!editable}
                      />
                    </div>
                  ))}
                </div>
              ) : null}
              {editable && (
                <AddButton 
                    onClick={() => {
                      const currentRefs = data.references || [];
                      const newRef = { 
                        name: '', 
                        title: '', 
                        organization: '',
                        email: '',
                        phone: '',
                        relationship: ''
                      };
                      updateData('references', [...currentRefs, newRef]);
                    }}
                  />
              )}
            </Section>
            
            {/* Interests */}
            <Section icon={Heart} title="Interests">
                {data.interests?.length > 0 ? (
                <EditableList
                  items={data.interests}
                  onChange={(items) => updateData('interests', items)}
                  placeholder="interest"
                  badgeClass="badge badge-pink"
                  disabled={!editable}
                />
                ) : null}
              </Section>
            
            {/* Other Information */}
            <Section icon={FileText} title="Additional Information" noBorder={true}>
              <EditableText
                value={data.other || ''}
                onChange={(value) => updateData('other', value)}
                placeholder="Any additional information not captured in other sections"
                className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap block"
                multiline={true}
                disabled={!editable}
              />
            </Section>
        </div>
      </div>
    </div>
  );
}

export default ResumeViewer;