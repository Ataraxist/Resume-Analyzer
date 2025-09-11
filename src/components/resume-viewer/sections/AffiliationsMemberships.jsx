import { Users } from 'lucide-react';
import SectionWrapper from '../common/SectionWrapper';
import FieldEditor from '../common/FieldEditor';
import ItemCard from '../common/ItemCard';
import { useArrayHandlers } from '../hooks/useArrayHandlers';

const AffiliationsMemberships = ({ data = [], onChange, editable = false }) => {
  const { handleRemove, handleUpdate } = useArrayHandlers(data, onChange);
  
  const handleAdd = () => {
    onChange([...data, {
      organization: '',
      role: '',
      dates: { start: '', end: '' }
    }]);
  };

  // Hide empty section in view mode
  if (!editable && data.length === 0) {
    return null;
  }

  return (
    <SectionWrapper
      icon={Users}
      title="Professional Affiliations & Memberships"
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
                    placeholder="Organization Name"
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
                    placeholder="Jan 2020"
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
              </div>
            </ItemCard>
          ))}
        </div>
      )}
    </SectionWrapper>
  );
};

export default AffiliationsMemberships;