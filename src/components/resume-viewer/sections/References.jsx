import { UserCheck } from 'lucide-react';
import SectionWrapper from '../common/SectionWrapper';
import FieldEditor from '../common/FieldEditor';
import ItemCard from '../common/ItemCard';
import { useArrayHandlers } from '../hooks/useArrayHandlers';

const References = ({ data = [], onChange, editable = false }) => {
  const { handleRemove, handleUpdate } = useArrayHandlers(data, onChange);
  
  const handleAdd = () => {
    onChange([...data, {
      name: '',
      relationship: '',
      contact: ''
    }]);
  };

  // Hide empty section in view mode
  if (!editable && data.length === 0) {
    return null;
  }

  return (
    <SectionWrapper
      icon={UserCheck}
      title="References"
      onAdd={editable ? handleAdd : null}
    >
      {(data?.length > 0 || editable) && (
        <div className="space-y-4">
          {data.map((ref, index) => (
            <ItemCard
              key={index}
              onRemove={editable ? () => handleRemove(index) : null}
            >
              <div className="space-y-2">
                {/* Name - Primary */}
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  <FieldEditor
                    value={ref.name}
                    onChange={(value) => handleUpdate(index, 'name', value)}
                    editable={editable}
                    placeholder="Name"
                  />
                </div>
                
                {/* Relationship - Secondary */}
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <FieldEditor
                    value={ref.relationship}
                    onChange={(value) => handleUpdate(index, 'relationship', value)}
                    editable={editable}
                    placeholder="Relationship"
                  />
                </div>
                
                {/* Contact - Metadata */}
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  <FieldEditor
                    value={ref.contact}
                    onChange={(value) => handleUpdate(index, 'contact', value)}
                    editable={editable}
                    placeholder="Contact Information"
                    size="small"
                  />
                </div>
              </div>
            </ItemCard>
          ))}
        </div>
      )}
    </SectionWrapper>
  );
};

export default References;