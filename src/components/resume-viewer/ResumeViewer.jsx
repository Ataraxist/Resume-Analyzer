import { useState, useEffect, useCallback } from 'react';
import { Save, Check } from 'lucide-react';
import firebaseResumeService from '../../services/firebaseResumeService';
import { useAuth } from '../../contexts/FirebaseAuthContext';

// Import sections
import PersonalInfo from './sections/PersonalInfo';
import Summary from './sections/Summary';
import Skills from './sections/Skills';
import Experience from './sections/Experience';
import Education from './sections/Education';
import Projects from './sections/Projects';
import Credentials from './sections/Credentials';
import Publications from './sections/Publications';
import AwardsHonors from './sections/AwardsHonors';
import ServiceVolunteering from './sections/ServiceVolunteering';
import OpenSource from './sections/OpenSource';
import Presentations from './sections/Presentations';
import Patents from './sections/Patents';
import Teaching from './sections/Teaching';
import CreativePortfolio from './sections/CreativePortfolio';
import AffiliationsMemberships from './sections/AffiliationsMemberships';
import GrantsFunding from './sections/GrantsFunding';
import References from './sections/References';
import Interests from './sections/Interests';
import Other from './sections/Other';

function ResumeViewer({ data: initialData = {}, resumeId, editable = true, isLoading = false }) {
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
  const updateSection = useCallback((section, value) => {
    const newData = { ...data, [section]: value };
    setData(newData);

    // Clear existing timeout
    if (saveTimeout) clearTimeout(saveTimeout);

    // Set new timeout for saving
    const timeout = setTimeout(() => {
      saveData(newData);
    }, 1000);

    setSaveTimeout(timeout);
  }, [data, saveData, saveTimeout]);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Save Status Indicator */}
      {saveStatus && (
        <div className={`fixed top-4 right-4 flex items-center gap-2 px-3 py-2 rounded-full text-sm ${
          saveStatus === 'saving' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
          saveStatus === 'saved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
        }`}>
          {saveStatus === 'saving' ? (
            <>
              <Save className="h-4 w-4 animate-pulse" />
              Saving...
            </>
          ) : saveStatus === 'saved' ? (
            <>
              <Check className="h-4 w-4" />
              Saved
            </>
          ) : (
            <>
              <span className="h-4 w-4">⚠</span>
              Error saving
            </>
          )}
        </div>
      )}

      {/* Resume Sections */}
      <div className="space-y-6">
        {/* Personal Information */}
        <PersonalInfo
          data={data.personal_information}
          onChange={(value) => updateSection('personal_information', value)}
          editable={editable}
          isLoading={isLoading}
        />

        {/* Professional Summary */}
        <Summary
          data={data.summary}
          onChange={(value) => updateSection('summary', value)}
          editable={editable}
          isLoading={isLoading}
        />

        {/* Skills */}
        <Skills
          data={data.skills}
          onChange={(value) => updateSection('skills', value)}
          editable={editable}
          isLoading={isLoading}
        />

        {/* Experience */}
        <Experience
          data={data.experience}
          onChange={(value) => updateSection('experience', value)}
          editable={editable}
          isLoading={isLoading}
        />

        {/* Education */}
        <Education
          data={data.education}
          onChange={(value) => updateSection('education', value)}
          editable={editable}
          isLoading={isLoading}
        />

        {/* Projects */}
        <Projects
          data={data.projects}
          onChange={(value) => updateSection('projects', value)}
          editable={editable}
        />

        {/* Credentials */}
        <Credentials
          data={data.credentials}
          onChange={(value) => updateSection('credentials', value)}
          editable={editable}
          isLoading={isLoading}
        />

        {/* Publications */}
        <Publications
          data={data.publications}
          onChange={(value) => updateSection('publications', value)}
          editable={editable}
        />

        {/* Awards & Honors */}
        <AwardsHonors
          data={data.awards_honors}
          onChange={(value) => updateSection('awards_honors', value)}
          editable={editable}
        />

        {/* Service & Volunteering */}
        <ServiceVolunteering
          data={data.service_volunteering}
          onChange={(value) => updateSection('service_volunteering', value)}
          editable={editable}
        />

        {/* Open Source */}
        <OpenSource
          data={data.open_source}
          onChange={(value) => updateSection('open_source', value)}
          editable={editable}
        />

        {/* Presentations */}
        <Presentations
          data={data.presentations}
          onChange={(value) => updateSection('presentations', value)}
          editable={editable}
        />

        {/* Patents */}
        <Patents
          data={data.patents}
          onChange={(value) => updateSection('patents', value)}
          editable={editable}
        />

        {/* Teaching */}
        <Teaching
          data={data.teaching}
          onChange={(value) => updateSection('teaching', value)}
          editable={editable}
        />

        {/* Creative Portfolio */}
        <CreativePortfolio
          data={data.creative_portfolio}
          onChange={(value) => updateSection('creative_portfolio', value)}
          editable={editable}
        />

        {/* Affiliations & Memberships */}
        <AffiliationsMemberships
          data={data.affiliations_memberships}
          onChange={(value) => updateSection('affiliations_memberships', value)}
          editable={editable}
        />

        {/* Grants & Funding */}
        <GrantsFunding
          data={data.grants_funding}
          onChange={(value) => updateSection('grants_funding', value)}
          editable={editable}
        />

        {/* References */}
        <References
          data={data.references}
          onChange={(value) => updateSection('references', value)}
          editable={editable}
        />

        {/* Interests */}
        <Interests
          data={data.interests}
          onChange={(value) => updateSection('interests', value)}
          editable={editable}
        />

        {/* Other */}
        <Other
          data={data.other}
          onChange={(value) => updateSection('other', value)}
          editable={editable}
        />
      </div>
    </div>
  );
}

export default ResumeViewer;