import { useState } from 'react';
import { ChevronDown, ChevronRight, User, Briefcase, GraduationCap, Code, Award, Mail, Phone, MapPin } from 'lucide-react';

function ResumeViewer({ data }) {
  const [expandedSections, setExpandedSections] = useState({
    personal: true,
    summary: true,
    skills: true,
    experience: true,
    education: true
  });
  
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  if (!data) return null;
  
  return (
    <div className="card">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Resume Preview</h2>
      
      {/* Personal Information */}
      {data.personal_information && (
        <div className="mb-6">
          <button
            onClick={() => toggleSection('personal')}
            className="flex items-center justify-between w-full text-left mb-3"
          >
            <div className="flex items-center">
              <User className="h-5 w-5 text-gray-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
            </div>
            {expandedSections.personal ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          
          {expandedSections.personal && (
            <div className="ml-7 space-y-2">
              {data.personal_information.name && (
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Name:</span> {data.personal_information.name}
                </p>
              )}
              {data.personal_information.email && (
                <p className="text-sm text-gray-700 flex items-center">
                  <Mail className="h-3 w-3 mr-1" />
                  {data.personal_information.email}
                </p>
              )}
              {data.personal_information.phone && (
                <p className="text-sm text-gray-700 flex items-center">
                  <Phone className="h-3 w-3 mr-1" />
                  {data.personal_information.phone}
                </p>
              )}
              {data.personal_information.location && (
                <p className="text-sm text-gray-700 flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  {data.personal_information.location}
                </p>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Summary */}
      {data.summary && (
        <div className="mb-6">
          <button
            onClick={() => toggleSection('summary')}
            className="flex items-center justify-between w-full text-left mb-3"
          >
            <h3 className="text-lg font-semibold text-gray-900">Professional Summary</h3>
            {expandedSections.summary ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          
          {expandedSections.summary && (
            <p className="text-sm text-gray-700 leading-relaxed">{data.summary}</p>
          )}
        </div>
      )}
      
      {/* Skills */}
      {data.skills && (
        <div className="mb-6">
          <button
            onClick={() => toggleSection('skills')}
            className="flex items-center justify-between w-full text-left mb-3"
          >
            <div className="flex items-center">
              <Code className="h-5 w-5 text-gray-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Skills</h3>
            </div>
            {expandedSections.skills ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          
          {expandedSections.skills && (
            <div className="ml-7 space-y-3">
              {data.skills.core_competencies && data.skills.core_competencies.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Core Competencies</p>
                  <div className="flex flex-wrap gap-1">
                    {data.skills.core_competencies.map((skill, idx) => (
                      <span key={idx} className="badge badge-info text-xs">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {data.skills.technical_skills && data.skills.technical_skills.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Technical Skills</p>
                  <div className="flex flex-wrap gap-1">
                    {data.skills.technical_skills.map((skill, idx) => (
                      <span key={idx} className="badge badge-info text-xs">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {data.skills.soft_skills && data.skills.soft_skills.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Soft Skills</p>
                  <div className="flex flex-wrap gap-1">
                    {data.skills.soft_skills.map((skill, idx) => (
                      <span key={idx} className="badge badge-success text-xs">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {data.skills.tools_equipment && data.skills.tools_equipment.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Tools & Equipment</p>
                  <div className="flex flex-wrap gap-1">
                    {data.skills.tools_equipment.map((tool, idx) => (
                      <span key={idx} className="badge badge-warning text-xs">
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {data.skills.certifications && data.skills.certifications.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Certifications</p>
                  <div className="flex flex-wrap gap-1">
                    {data.skills.certifications.map((cert, idx) => (
                      <span key={idx} className="badge badge-danger text-xs">
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {data.skills.languages && (
                <>
                  {data.skills.languages.spoken && data.skills.languages.spoken.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Languages</p>
                      <div className="flex flex-wrap gap-1">
                        {data.skills.languages.spoken.map((lang, idx) => (
                          <span key={idx} className="badge badge-info text-xs">
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {data.skills.languages.programming && data.skills.languages.programming.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Programming Languages</p>
                      <div className="flex flex-wrap gap-1">
                        {data.skills.languages.programming.map((lang, idx) => (
                          <span key={idx} className="badge badge-warning text-xs">
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Experience */}
      {data.experience && data.experience.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => toggleSection('experience')}
            className="flex items-center justify-between w-full text-left mb-3"
          >
            <div className="flex items-center">
              <Briefcase className="h-5 w-5 text-gray-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">
                Experience ({data.experience.length})
              </h3>
            </div>
            {expandedSections.experience ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          
          {expandedSections.experience && (
            <div className="ml-7 space-y-4">
              {data.experience.map((exp, idx) => (
                <div key={idx} className="border-l-2 border-gray-200 pl-4">
                  <h4 className="font-medium text-gray-900">{exp.title}</h4>
                  <p className="text-sm text-gray-600">{exp.company}</p>
                  <p className="text-xs text-gray-500 mb-2">{exp.dates}</p>
                  {exp.responsibilities && exp.responsibilities.length > 0 && (
                    <ul className="text-sm text-gray-700 space-y-1">
                      {exp.responsibilities.slice(0, 3).map((resp, ridx) => (
                        <li key={ridx} className="flex items-start">
                          <span className="text-gray-400 mr-2">•</span>
                          <span className="text-xs">{resp}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Education */}
      {data.education && data.education.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => toggleSection('education')}
            className="flex items-center justify-between w-full text-left mb-3"
          >
            <div className="flex items-center">
              <GraduationCap className="h-5 w-5 text-gray-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Education</h3>
            </div>
            {expandedSections.education ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          
          {expandedSections.education && (
            <div className="ml-7 space-y-3">
              {data.education.map((edu, idx) => (
                <div key={idx}>
                  <h4 className="font-medium text-gray-900 text-sm">{edu.degree}</h4>
                  <p className="text-sm text-gray-600">{edu.institution}</p>
                  <p className="text-xs text-gray-500">{edu.dates}</p>
                  {edu.gpa && (
                    <p className="text-xs text-gray-600 mt-1">GPA: {edu.gpa}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ResumeViewer;