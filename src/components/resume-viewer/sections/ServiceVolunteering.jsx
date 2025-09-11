import { Heart } from 'lucide-react';
import SectionWrapper from '../common/SectionWrapper';
import FieldEditor from '../common/FieldEditor';
import ItemCard from '../common/ItemCard';
import { useArrayHandlers } from '../hooks/useArrayHandlers';

const ServiceVolunteering = ({ data = [], onChange, editable = false }) => {
  const { handleRemove, handleUpdate } = useArrayHandlers(data, onChange);
  
  const handleAdd = () => {
    onChange([...data, {
      organization: '',
      role: '',
      dates: { start: '', end: '' },
      description: ''
    }]);
  };


  // Hide empty section in view mode
  if (!editable && data.length === 0) {
    return null;
  }

  return (
    <SectionWrapper
      icon={Heart}
      title="Service & Volunteering"
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
                {/* Organization - Primary */}
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  <FieldEditor
                    value={item.organization}
                    onChange={(value) => handleUpdate(index, 'organization', value)}
                    editable={editable}
                    placeholder="Organization"
                  />
                </div>
                
                {/* Role - Secondary */}
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <FieldEditor
                    value={item.role}
                    onChange={(value) => handleUpdate(index, 'role', value)}
                    editable={editable}
                    placeholder="Role/Position"
                  />
                </div>
                
                {/* Dates - Metadata */}
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  <FieldEditor
                    value={item.dates?.start}
                    onChange={(value) => handleUpdate(index, 'dates.start', value)}
                    editable={editable}
                    placeholder="Jun 2021"
                    size="small"
                  />
                  {' - '}
                  <FieldEditor
                    value={item.dates?.end}
                    onChange={(value) => handleUpdate(index, 'dates.end', value)}
                    editable={editable}
                    placeholder="Present"
                    size="small"
                  />
                </div>
                
                {/* Description */}
                {(item.description || editable) && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <FieldEditor
                      value={item.description}
                      onChange={(value) => handleUpdate(index, 'description', value)}
                      editable={editable}
                      placeholder="Description of your role and responsibilities..."
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

export default ServiceVolunteering;