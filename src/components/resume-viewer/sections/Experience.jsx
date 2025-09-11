import { Briefcase } from 'lucide-react';
import SectionWrapper from '../common/SectionWrapper';
import ItemCard from '../common/ItemCard';
import FieldEditor from '../common/FieldEditor';
import ArrayManager from '../common/ArrayManager';
import { ExperienceSkeleton } from '../common/SkeletonComponents';

function Experience({ data = [], onChange, editable = true, isLoading = false }) {
  const showSkeleton = isLoading && (!data || (Array.isArray(data) && data.length === 0));
  
  // Hide empty section in view mode
  if (!editable && Array.isArray(data) && data.length === 0) {
    return null;
  }
  
  const addExperience = () => {
    onChange([...data, {
      organization: '',
      role: '',
      department: '',
      employment_type: '',
      dates: { start: '', end: '' },
      responsibilities: [],
      achievements: [],
      technologies: []
    }]);
  };

  const updateExperience = (index, field, value) => {
    const updated = [...data];
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      updated[index] = {
        ...updated[index],
        [parent]: {
          ...updated[index][parent],
          [child]: value
        }
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    onChange(updated);
  };

  const removeExperience = (index) => {
    onChange(data.filter((_, i) => i !== index));
  };

  return (
    <SectionWrapper 
      icon={Briefcase} 
      title="Experience" 
      onAdd={editable ? addExperience : null}
      editable={editable}
      isEmpty={data.length === 0}
    >
      {showSkeleton ? (
        <ExperienceSkeleton />
      ) : (
      <div className="space-y-4 animate-fade-in">
        {data.map((exp, idx) => (
          <ItemCard 
            key={idx} 
            onRemove={() => removeExperience(idx)}
            editable={editable}
          >
            {/* Role */}
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              <FieldEditor
                value={exp.role}
                onChange={(value) => updateExperience(idx, 'role', value)}
                placeholder="Job Title"
                editable={editable}
              />
            </div>

            {/* Organization and Department */}
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <FieldEditor
                value={exp.organization}
                onChange={(value) => updateExperience(idx, 'organization', value)}
                placeholder="Company"
                editable={editable}
              />
              {(exp.department || editable) && (
                <>
                  {' - '}
                  <FieldEditor
                    value={exp.department}
                    onChange={(value) => updateExperience(idx, 'department', value)}
                    placeholder="Department"
                    editable={editable}
                  />
                </>
              )}
            </div>

            {/* Employment Type */}
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              <FieldEditor
                value={exp.employment_type}
                onChange={(value) => updateExperience(idx, 'employment_type', value)}
                placeholder="Employment Type (full-time, part-time, contract, etc.)"
                editable={editable}
                size="small"
              />
            </div>

            {/* Dates and Location */}
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1 space-x-4">
              <span>
                <FieldEditor
                  value={exp.dates?.start}
                  onChange={(value) => updateExperience(idx, 'dates.start', value)}
                  placeholder="Jan 2022"
                  editable={editable}
                  size="small"
                />
                {' - '}
                <FieldEditor
                  value={exp.dates?.end}
                  onChange={(value) => updateExperience(idx, 'dates.end', value)}
                  placeholder="Present"
                  editable={editable}
                  size="small"
                />
              </span>
            </div>

            {/* Responsibilities */}
            {(exp.responsibilities?.length > 0 || editable) && (
              <div className="mt-3">
                <ArrayManager
                  items={exp.responsibilities || []}
                  onItemsChange={(items) => updateExperience(idx, 'responsibilities', items)}
                  placeholder="responsibility"
                  editable={editable}
                  label="Responsibilities"
                />
              </div>
            )}

            {/* Achievements */}
            {(exp.achievements?.length > 0 || editable) && (
              <div className="mt-3">
                <ArrayManager
                  items={exp.achievements || []}
                  onItemsChange={(items) => updateExperience(idx, 'achievements', items)}
                  placeholder="achievement"
                  editable={editable}
                  label="Achievements"
                />
              </div>
            )}

            {/* Technologies */}
            {(exp.technologies?.length > 0 || editable) && (
              <div className="mt-3">
                <ArrayManager
                  items={exp.technologies || []}
                  onItemsChange={(items) => updateExperience(idx, 'technologies', items)}
                  placeholder="technology"
                  editable={editable}
                  badgeStyle={true}
                  badgeClass="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  label="Technologies"
                />
              </div>
            )}

          </ItemCard>
        ))}
      </div>
      )}
    </SectionWrapper>
  );
}

export default Experience;