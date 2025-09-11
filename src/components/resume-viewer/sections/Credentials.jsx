import { Shield, Award, Lock, Plus } from 'lucide-react';
import SectionWrapper from '../common/SectionWrapper';
import FieldEditor from '../common/FieldEditor';
import ItemCard from '../common/ItemCard';
import ArrayManager from '../common/ArrayManager';

const Credentials = ({ data = {}, onChange, editable = false, isLoading = false }) => {
  const safeData = data || {};
  const { certifications = [], licenses = [], security_clearances = [], work_authorization = [] } = safeData;

  // Show skeleton only during actual loading
  const showSkeleton = isLoading && (!data || Object.keys(safeData).length === 0);
  
  // Hide empty section in view mode
  if (!editable && !isLoading) {
    const hasAnyCredentials = 
      certifications.length > 0 || 
      licenses.length > 0 || 
      security_clearances.length > 0 || 
      work_authorization.length > 0;
    if (!hasAnyCredentials) {
      return null;
    }
  }

  const handleAddCertification = () => {
    onChange({
      ...safeData,
      certifications: [...certifications, {
        name: '',
        issuer: '',
        issue_date: '',
        expiry_date: '',
        credential_id: ''
      }]
    });
  };

  const handleAddLicense = () => {
    onChange({
      ...safeData,
      licenses: [...licenses, {
        name: '',
        authority: '',
        region: '',
        issue_date: '',
        expiry_date: '',
        license_id: ''
      }]
    });
  };


  const handleRemove = (type, index) => {
    onChange({
      ...safeData,
      [type]: safeData[type].filter((_, i) => i !== index)
    });
  };

  const handleUpdate = (type, index, field, value) => {
    const updated = { ...safeData };
    updated[type] = [...updated[type]];
    updated[type][index] = { ...updated[type][index], [field]: value };
    onChange(updated);
  };

  // Show skeleton loading state - just the title
  if (showSkeleton) {
    return (
      <SectionWrapper icon={Shield} title="Credentials" />
    );
  }

  return (
    <SectionWrapper
      icon={Shield}
      title="Credentials"
    >
      <div className="space-y-6">
        {(certifications?.length > 0 || editable) && (
          <div className="space-y-3">
            <div className="flex items-center">
              <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Award className="w-4 h-4" />
                Certifications
              </h4>
              {editable && (
                <button
                  onClick={handleAddCertification}
                  className="inline-flex items-center gap-1 ml-3 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              )}
            </div>
            <div className="space-y-3">
              {certifications.map((cert, index) => (
                <ItemCard
                  key={index}
                  onRemove={editable ? () => handleRemove('certifications', index) : null}
                >
                  <div className="space-y-3">
                    {/* Certification Name - Primary */}
                    <div className="flex items-start gap-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400 w-16 mt-0.5">Name:</span>
                      <div className="flex-1 text-sm font-medium text-gray-900 dark:text-white">
                        <FieldEditor
                          value={cert.name}
                          onChange={(value) => handleUpdate('certifications', index, 'name', value)}
                          editable={editable}
                          placeholder="AWS Certified Solutions Architect"
                        />
                      </div>
                    </div>
                    
                    {/* Issuer - Secondary */}
                    <div className="flex items-start gap-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400 w-16 mt-0.5">Issuer:</span>
                      <div className="flex-1 text-sm text-gray-600 dark:text-gray-400">
                        <FieldEditor
                          value={cert.issuer}
                          onChange={(value) => handleUpdate('certifications', index, 'issuer', value)}
                          editable={editable}
                          placeholder="Amazon Web Services"
                        />
                      </div>
                    </div>
                    
                    {/* Dates and ID - Metadata */}
                    <div className="text-xs text-gray-500 dark:text-gray-500 flex gap-4">
                      {(cert.issue_date || editable) && (
                        <span>
                          <span className="mr-1">Issued:</span>
                          <FieldEditor
                            value={cert.issue_date}
                            onChange={(value) => handleUpdate('certifications', index, 'issue_date', value)}
                            editable={editable}
                            placeholder="Jan 2023"
                            size="small"
                          />
                        </span>
                      )}
                      {(cert.expiry_date || editable) && (
                        <span>
                          <span className="mr-1">Expires:</span>
                          <FieldEditor
                            value={cert.expiry_date}
                            onChange={(value) => handleUpdate('certifications', index, 'expiry_date', value)}
                            editable={editable}
                            placeholder="Jan 2026"
                            size="small"
                          />
                        </span>
                      )}
                      {(cert.credential_id || editable) && (
                        <span>
                          <span className="mr-1">ID:</span>
                          <FieldEditor
                            value={cert.credential_id}
                            onChange={(value) => handleUpdate('certifications', index, 'credential_id', value)}
                            editable={editable}
                            placeholder="ABC123XYZ"
                            size="small"
                          />
                        </span>
                      )}
                    </div>
                  </div>
                </ItemCard>
              ))}
            </div>
          </div>
        )}

        {(licenses?.length > 0 || editable) && (
          <div className="space-y-3">
            <div className="flex items-center">
              <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Award className="w-4 h-4" />
                Professional Licenses
              </h4>
              {editable && (
                <button
                  onClick={handleAddLicense}
                  className="inline-flex items-center gap-1 ml-3 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              )}
            </div>
            <div className="space-y-3">
              {licenses.map((license, index) => (
                <ItemCard
                  key={index}
                  onRemove={editable ? () => handleRemove('licenses', index) : null}
                >
                  <div className="space-y-3">
                    {/* License Name - Primary */}
                    <div className="flex items-start gap-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400 w-20 mt-0.5">License:</span>
                      <div className="flex-1 text-sm font-medium text-gray-900 dark:text-white">
                        <FieldEditor
                          value={license.name}
                          onChange={(value) => handleUpdate('licenses', index, 'name', value)}
                          editable={editable}
                          placeholder="Professional Engineer"
                        />
                      </div>
                    </div>
                    
                    {/* Authority - Secondary */}
                    <div className="flex items-start gap-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400 w-20 mt-0.5">Authority:</span>
                      <div className="flex-1 text-sm text-gray-600 dark:text-gray-400">
                        <FieldEditor
                          value={license.authority}
                          onChange={(value) => handleUpdate('licenses', index, 'authority', value)}
                          editable={editable}
                          placeholder="State Board"
                        />
                      </div>
                    </div>
                    
                    {/* Region - Secondary */}
                    {(license.region || editable) && (
                      <div className="flex items-start gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400 w-20 mt-0.5">Region:</span>
                        <div className="flex-1 text-sm text-gray-600 dark:text-gray-400">
                          <FieldEditor
                            value={license.region}
                            onChange={(value) => handleUpdate('licenses', index, 'region', value)}
                            editable={editable}
                            placeholder="California"
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Dates and ID - Metadata */}
                    <div className="text-xs text-gray-500 dark:text-gray-500 flex gap-4">
                      {(license.license_id || editable) && (
                        <span>
                          <span className="mr-1">ID:</span>
                          <FieldEditor
                            value={license.license_id}
                            onChange={(value) => handleUpdate('licenses', index, 'license_id', value)}
                            editable={editable}
                            placeholder="LIC-456789"
                            size="small"
                          />
                        </span>
                      )}
                      {(license.issue_date || editable) && (
                        <span>
                          <span className="mr-1">Issued:</span>
                          <FieldEditor
                            value={license.issue_date}
                            onChange={(value) => handleUpdate('licenses', index, 'issue_date', value)}
                            editable={editable}
                            placeholder="Jan 2023"
                            size="small"
                          />
                        </span>
                      )}
                      {(license.expiry_date || editable) && (
                        <span>
                          <span className="mr-1">Expires:</span>
                          <FieldEditor
                            value={license.expiry_date}
                            onChange={(value) => handleUpdate('licenses', index, 'expiry_date', value)}
                            editable={editable}
                            placeholder="Jan 2026"
                            size="small"
                          />
                        </span>
                      )}
                    </div>
                  </div>
                </ItemCard>
              ))}
            </div>
          </div>
        )}

        {(security_clearances?.length > 0 || editable) && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Security Clearances
              </h4>
            </div>
            <ArrayManager
              items={security_clearances}
              onItemsChange={(items) => onChange({ ...safeData, security_clearances: items })}
              editable={editable}
              placeholder="Add clearance level..."
              badgeStyle={true}
            />
          </div>
        )}

        {/* Work Authorization */}
        {(work_authorization?.length > 0 || editable) && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Work Authorization
              </h4>
            </div>
            <ArrayManager
              items={work_authorization}
              onItemsChange={(items) => onChange({ ...safeData, work_authorization: items })}
              editable={editable}
              placeholder="Add authorization type (e.g., US Citizen, Green Card, H1B)..."
              badgeStyle={true}
              badgeClass="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
            />
          </div>
        )}
      </div>
    </SectionWrapper>
  );
};

export default Credentials;