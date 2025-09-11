import { Trophy } from 'lucide-react';
import SectionWrapper from '../common/SectionWrapper';
import FieldEditor from '../common/FieldEditor';
import ItemCard from '../common/ItemCard';
import { useArrayHandlers } from '../hooks/useArrayHandlers';

const AwardsHonors = ({ data = [], onChange, editable = false }) => {
  const { handleRemove, handleUpdate } = useArrayHandlers(data, onChange);
  
  const handleAdd = () => {
    onChange([...data, {
      name: '',
      issuer: '',
      date: '',
      description: ''
    }]);
  };


  // Hide empty section in view mode
  if (!editable && data.length === 0) {
    return null;
  }

  return (
    <SectionWrapper
      icon={Trophy}
      title="Awards & Honors"
      onAdd={editable ? handleAdd : null}
    >
      {(data?.length > 0 || editable) && (
        <div className="space-y-4">
          {data.map((award, index) => (
            <ItemCard
              key={index}
              onRemove={editable ? () => handleRemove(index) : null}
            >
              <div className="space-y-3">
                {/* Award Name - Primary */}
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  <FieldEditor
                    value={award.name}
                    onChange={(value) => handleUpdate(index, 'name', value)}
                    editable={editable}
                    placeholder="Award Name"
                  />
                </div>
                
                {/* Issuer - Secondary */}
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <FieldEditor
                    value={award.issuer}
                    onChange={(value) => handleUpdate(index, 'issuer', value)}
                    editable={editable}
                    placeholder="Issuing Organization"
                  />
                </div>
                
                {/* Date - Metadata */}
                {(award.date || editable) && (
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    <FieldEditor
                      value={award.date}
                      onChange={(value) => handleUpdate(index, 'date', value)}
                      editable={editable}
                      placeholder="May 2023"
                      size="small"
                    />
                  </div>
                )}
                
                {/* Description */}
                {(award.description || editable) && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <FieldEditor
                      value={award.description}
                      onChange={(value) => handleUpdate(index, 'description', value)}
                      editable={editable}
                      placeholder="Description of the award..."
                      type="multiline"
                    />
                  </div>
                )}
              </div>
            </ItemCard>
          ))}
        </div>
      )}
    </SectionWrapper>
  );
};

export default AwardsHonors;