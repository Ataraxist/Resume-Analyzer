import { User, Mail, Phone, Globe, Github, Linkedin, Link, BookOpen, FileText, Plus, X } from 'lucide-react';
import SectionWrapper from '../common/SectionWrapper';
import FieldEditor from '../common/FieldEditor';
import { PersonalInfoSkeleton } from '../common/SkeletonComponents';

function PersonalInfo({ data = {}, onChange, editable = true, isLoading = false }) {
  // Ensure data is never null
  const safeData = data || {};
  
  const updateField = (field, value) => {
    onChange({ ...safeData, [field]: value });
  };

  const updateProfile = (profile, value) => {
    onChange({
      ...safeData,
      profiles: {
        ...safeData.profiles,
        [profile]: value
      }
    });
  };

  const updateOtherLink = (index, field, value) => {
    const updated = [...(safeData.profiles?.other || [])];
    updated[index] = { ...updated[index], [field]: value };
    onChange({
      ...safeData,
      profiles: {
        ...safeData.profiles,
        other: updated
      }
    });
  };

  const addOtherLink = () => {
    const current = safeData.profiles?.other || [];
    onChange({
      ...safeData,
      profiles: {
        ...safeData.profiles,
        other: [...current, { label: '', url: '' }]
      }
    });
  };

  const removeOtherLink = (index) => {
    const updated = (safeData.profiles?.other || []).filter((_, i) => i !== index);
    onChange({
      ...safeData,
      profiles: {
        ...safeData.profiles,
        other: updated
      }
    });
  };

  // Show skeleton only during actual loading
  const showSkeleton = isLoading && (!data || Object.keys(safeData).length === 0);

  return (
    <SectionWrapper icon={User} title="Personal Information">
      {showSkeleton ? (
        <PersonalInfoSkeleton />
      ) : (
      <div className="space-y-3 animate-fade-in">
        {/* Name */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400 w-20">Name:</span>
          <FieldEditor
            value={safeData.name || ''}
            onChange={(value) => updateField('name', value)}
            placeholder="Your name"
            editable={editable}
            className="font-medium text-gray-900 dark:text-white"
          />
        </div>

        {/* Email */}
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-gray-400" />
          <FieldEditor
            value={safeData.email || ''}
            onChange={(value) => updateField('email', value)}
            placeholder="email@example.com"
            type="email"
            editable={editable}
            className="text-gray-700 dark:text-gray-300"
          />
        </div>

        {/* Phone */}
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-gray-400" />
          <FieldEditor
            value={safeData.phone || ''}
            onChange={(value) => updateField('phone', value)}
            placeholder="Phone number"
            editable={editable}
            className="text-gray-700 dark:text-gray-300"
          />
        </div>

        {/* Professional Links */}
        <div className="pt-2">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Professional Links</p>
          <div className="space-y-2 ml-4">
            {/* LinkedIn */}
            <div className="flex items-center gap-2">
              <Linkedin className="h-4 w-4 text-gray-400" />
              <FieldEditor
                value={safeData.profiles?.linkedin || ''}
                onChange={(value) => updateProfile('linkedin', value)}
                placeholder="LinkedIn URL"
                type="url"
                editable={editable}
                size="small"
                className="text-gray-600 dark:text-gray-400"
              />
            </div>

            {/* GitHub */}
            <div className="flex items-center gap-2">
              <Github className="h-4 w-4 text-gray-400" />
              <FieldEditor
                value={safeData.profiles?.github || ''}
                onChange={(value) => updateProfile('github', value)}
                placeholder="GitHub URL"
                type="url"
                editable={editable}
                size="small"
                className="text-gray-600 dark:text-gray-400"
              />
            </div>

            {/* Website */}
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-gray-400" />
              <FieldEditor
                value={safeData.profiles?.website || ''}
                onChange={(value) => updateProfile('website', value)}
                placeholder="Personal website"
                type="url"
                editable={editable}
                size="small"
                className="text-gray-600 dark:text-gray-400"
              />
            </div>

            {/* Portfolio */}
            <div className="flex items-center gap-2">
              <Link className="h-4 w-4 text-gray-400" />
              <FieldEditor
                value={safeData.profiles?.portfolio || ''}
                onChange={(value) => updateProfile('portfolio', value)}
                placeholder="Portfolio URL"
                type="url"
                editable={editable}
                size="small"
                className="text-gray-600 dark:text-gray-400"
              />
            </div>

            {/* Google Scholar */}
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-gray-400" />
              <FieldEditor
                value={safeData.profiles?.scholar || ''}
                onChange={(value) => updateProfile('scholar', value)}
                placeholder="Google Scholar URL"
                type="url"
                editable={editable}
                size="small"
                className="text-gray-600 dark:text-gray-400"
              />
            </div>

            {/* ORCID */}
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-400" />
              <FieldEditor
                value={safeData.profiles?.orcid || ''}
                onChange={(value) => updateProfile('orcid', value)}
                placeholder="ORCID URL"
                type="url"
                editable={editable}
                size="small"
                className="text-gray-600 dark:text-gray-400"
              />
            </div>

            {/* Other Links */}
            {(safeData.profiles?.other?.length > 0 || editable) && (
              <div className="pt-2">
                <div className="flex items-center mb-1">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Other Links</p>
                  {editable && (
                    <button
                      onClick={addOtherLink}
                      className="inline-flex items-center gap-1 ml-3 text-xs text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                      Add
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {safeData.profiles?.other?.map((link, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <FieldEditor
                        value={link.label}
                        onChange={(value) => updateOtherLink(idx, 'label', value)}
                        placeholder="Label"
                        editable={editable}
                        size="small"
                        className="text-gray-600 dark:text-gray-400 w-24"
                      />
                      <FieldEditor
                        value={link.url}
                        onChange={(value) => updateOtherLink(idx, 'url', value)}
                        placeholder="URL"
                        type="url"
                        editable={editable}
                        size="small"
                        className="text-gray-600 dark:text-gray-400 flex-1"
                      />
                      {editable && (
                        <button
                          onClick={() => removeOtherLink(idx)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      )}
    </SectionWrapper>
  );
}

export default PersonalInfo;