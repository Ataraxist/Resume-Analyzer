import { BookOpenCheck } from 'lucide-react';
import SectionWrapper from '../common/SectionWrapper';
import FieldEditor from '../common/FieldEditor';
import ArrayManager from '../common/ArrayManager';
import ItemCard from '../common/ItemCard';
import { useArrayHandlers } from '../hooks/useArrayHandlers';

const Teaching = ({ data = [], onChange, editable = false }) => {
  const { handleRemove, handleUpdate } = useArrayHandlers(data, onChange);
  
  const handleAdd = () => {
    onChange([...data, {
      role: '',
      course: '',
      institution: '',
      term: '',
      responsibilities: []
    }]);
  };

  // Hide empty section in view mode
  if (!editable && data.length === 0) {
    return null;
  }

  return (
    <SectionWrapper
      icon={BookOpenCheck}
      title="Teaching Experience"
      onAdd={editable ? handleAdd : null}
    >
      {(data?.length > 0 || editable) && (
        <div className="space-y-4">
          {data.map((item, index) => (
            <ItemCard
              key={index}
              onRemove={editable ? () => handleRemove(index) : null}
            >
              <div className="space-y-3">
                {/* Course - Primary */}
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  <FieldEditor
                    value={item.course}
                    onChange={(value) => handleUpdate(index, 'course', value)}
                    editable={editable}
                    placeholder="Course Name"
                  />
                </div>
                
                {/* Role - Secondary */}
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <FieldEditor
                    value={item.role}
                    onChange={(value) => handleUpdate(index, 'role', value)}
                    editable={editable}
                    placeholder="Role (Instructor, TA, etc.)"
                  />
                </div>
                
                {/* Institution - Secondary */}
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <FieldEditor
                    value={item.institution}
                    onChange={(value) => handleUpdate(index, 'institution', value)}
                    editable={editable}
                    placeholder="Institution"
                  />
                </div>
                
                {/* Term - Metadata */}
                {(item.term || editable) && (
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    <span className="mr-1">Term:</span>
                    <FieldEditor
                      value={item.term}
                      onChange={(value) => handleUpdate(index, 'term', value)}
                      editable={editable}
                      placeholder="Fall 2023"
                      size="small"
                    />
                  </div>
                )}
                
                {/* Responsibilities */}
                {(item.responsibilities?.length > 0 || editable) && (
                  <ArrayManager
                    items={item.responsibilities || []}
                    onItemsChange={(items) => handleUpdate(index, 'responsibilities', items)}
                    editable={editable}
                    placeholder="Add responsibility..."
                    label="Responsibilities"
                  />
                )}
              </div>
            </ItemCard>
          ))}
        </div>
      )}
    </SectionWrapper>
  );
};

export default Teaching;