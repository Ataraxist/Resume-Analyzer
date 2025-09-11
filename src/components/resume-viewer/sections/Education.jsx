import { GraduationCap } from 'lucide-react';
import SectionWrapper from '../common/SectionWrapper';
import FieldEditor from '../common/FieldEditor';
import ArrayManager from '../common/ArrayManager';
import ItemCard from '../common/ItemCard';
import { EducationSkeleton } from '../common/SkeletonComponents';
import { useArrayHandlers } from '../hooks/useArrayHandlers';

const Education = ({ data = [], onChange, editable = false, isLoading = false }) => {
  const { handleRemove, handleUpdate } = useArrayHandlers(data, onChange);
  const showSkeleton = isLoading && (!data || (Array.isArray(data) && data.length === 0));
  
  // Hide empty section in view mode
  if (!editable && Array.isArray(data) && data.length === 0) {
    return null;
  }
  
  const handleAdd = () => {
    onChange([...data, {
      degree: '',
      field_of_study: '',
      institution: '',
      dates: { start: '', end: '' },
      gpa: '',
      honors_awards: [],
      coursework: [],
      thesis_title: '',
      advisor: ''
    }]);
  };


  return (
    <SectionWrapper
      icon={GraduationCap}
      title="Education"
      onAdd={editable ? handleAdd : null}
    >
      {showSkeleton ? (
        <EducationSkeleton />
      ) : (
      (data?.length > 0 || editable) && (
        <div className="space-y-4 animate-fade-in">
          {data.map((edu, index) => (
            <ItemCard
              key={index}
              onRemove={editable ? () => handleRemove(index) : null}
            >
              <div className="space-y-3">
                {/* Degree - Primary Title */}
                <div className="flex items-start gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-20 mt-0.5">Degree:</span>
                  <div className="flex-1 text-sm font-medium text-gray-900 dark:text-white">
                    <FieldEditor
                      value={edu.degree}
                      onChange={(value) => handleUpdate(index, 'degree', value)}
                      editable={editable}
                      placeholder="Bachelor of Science"
                    />
                  </div>
                </div>
                
                {/* Field of Study - Secondary Info */}
                <div className="flex items-start gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-20 mt-0.5">Field:</span>
                  <div className="flex-1 text-sm text-gray-600 dark:text-gray-400">
                    <FieldEditor
                      value={edu.field_of_study}
                      onChange={(value) => handleUpdate(index, 'field_of_study', value)}
                      editable={editable}
                      placeholder="Computer Science"
                    />
                  </div>
                </div>
                
                {/* Institution */}
                <div className="flex items-start gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-20 mt-0.5">Institution:</span>
                  <div className="flex-1 text-sm text-gray-600 dark:text-gray-400">
                    <FieldEditor
                      value={edu.institution}
                      onChange={(value) => handleUpdate(index, 'institution', value)}
                      editable={editable}
                      placeholder="University Name"
                    />
                  </div>
                </div>

                {/* Dates and GPA - Metadata Row */}
                <div className="text-xs text-gray-500 dark:text-gray-500 flex gap-4">
                  <span>
                    <FieldEditor
                      value={edu.dates?.start}
                      onChange={(value) => handleUpdate(index, 'dates.start', value)}
                      editable={editable}
                      placeholder="Jan 2020"
                      size="small"
                    />
                    {' - '}
                    <FieldEditor
                      value={edu.dates?.end}
                      onChange={(value) => handleUpdate(index, 'dates.end', value)}
                      editable={editable}
                      placeholder="May 2024"
                      size="small"
                    />
                  </span>
                  {(edu.gpa || editable) && (
                    <span>
                      <span className="mr-1">GPA:</span>
                      <FieldEditor
                        value={edu.gpa}
                        onChange={(value) => handleUpdate(index, 'gpa', value)}
                        editable={editable}
                        placeholder="3.8"
                        size="small"
                      />
                    </span>
                  )}
                </div>

                {/* Thesis Title */}
                {(edu.thesis_title || editable) && (
                  <div className="flex items-start gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400 w-20 mt-0.5">Thesis:</span>
                    <div className="flex-1 text-sm text-gray-600 dark:text-gray-400">
                      <FieldEditor
                        value={edu.thesis_title}
                        onChange={(value) => handleUpdate(index, 'thesis_title', value)}
                        editable={editable}
                        placeholder="Thesis Title"
                      />
                    </div>
                  </div>
                )}
                
                {/* Advisor */}
                {(edu.advisor || editable) && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="mr-1">Advisor:</span>
                    <FieldEditor
                      value={edu.advisor}
                      onChange={(value) => handleUpdate(index, 'advisor', value)}
                      editable={editable}
                      placeholder="Dr. Jane Smith"
                      size="small"
                    />
                  </div>
                )}

                {(edu.honors_awards?.length > 0 || editable) && (
                  <ArrayManager
                    items={edu.honors_awards || []}
                    onItemsChange={(items) => handleUpdate(index, 'honors_awards', items)}
                    editable={editable}
                    placeholder="Add honor/award..."
                    badgeStyle={true}
                    label="Honors & Awards"
                  />
                )}

                {(edu.coursework?.length > 0 || editable) && (
                  <ArrayManager
                    items={edu.coursework || []}
                    onItemsChange={(items) => handleUpdate(index, 'coursework', items)}
                    editable={editable}
                    placeholder="Add relevant coursework..."
                    badgeStyle={true}
                    label="Relevant Coursework"
                  />
                )}

              </div>
            </ItemCard>
          ))}
        </div>
      ))}
    </SectionWrapper>
  );
};

export default Education;