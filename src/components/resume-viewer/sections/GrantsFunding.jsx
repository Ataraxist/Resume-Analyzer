import { DollarSign } from 'lucide-react';
import SectionWrapper from '../common/SectionWrapper';
import FieldEditor from '../common/FieldEditor';
import ArrayManager from '../common/ArrayManager';
import ItemCard from '../common/ItemCard';
import { useArrayHandlers } from '../hooks/useArrayHandlers';

const GrantsFunding = ({ data = [], onChange, editable = false }) => {
  const { handleRemove, handleUpdate } = useArrayHandlers(data, onChange);
  
  const handleAdd = () => {
    onChange([...data, {
      name: '',
      sponsor: '',
      amount: '',
      date: '',
      role: ''
    }]);
  };

  // Hide empty section in view mode
  if (!editable && data.length === 0) {
    return null;
  }

  return (
    <SectionWrapper
      icon={DollarSign}
      title="Grants & Funding"
      onAdd={editable ? handleAdd : null}
    >
      {(data?.length > 0 || editable) && (
        <div className="space-y-4">
          {data.map((grant, index) => (
            <ItemCard
              key={index}
              onRemove={editable ? () => handleRemove(index) : null}
            >
              <div className="space-y-3">
                {/* Grant Name - Primary */}
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  <FieldEditor
                    value={grant.name}
                    onChange={(value) => handleUpdate(index, 'name', value)}
                    editable={editable}
                    placeholder="Grant Name"
                  />
                </div>
                
                {/* Sponsor - Secondary */}
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <FieldEditor
                    value={grant.sponsor}
                    onChange={(value) => handleUpdate(index, 'sponsor', value)}
                    editable={editable}
                    placeholder="Sponsor"
                  />
                </div>
                
                {/* Role */}
                {(grant.role || editable) && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <FieldEditor
                      value={grant.role}
                      onChange={(value) => handleUpdate(index, 'role', value)}
                      editable={editable}
                      placeholder="Your Role"
                    />
                  </div>
                )}
                
                {/* Amount and Date - Metadata */}
                <div className="text-xs text-gray-500 dark:text-gray-500 flex gap-4">
                  {(grant.amount || editable) && (
                    <span>
                      <span className="mr-1">Amount:</span>
                      <FieldEditor
                        value={grant.amount}
                        onChange={(value) => handleUpdate(index, 'amount', value)}
                        editable={editable}
                        placeholder="$50,000"
                        size="small"
                      />
                    </span>
                  )}
                  {(grant.date || editable) && (
                    <FieldEditor
                      value={grant.date}
                      onChange={(value) => handleUpdate(index, 'date', value)}
                      editable={editable}
                      placeholder="2023"
                      size="small"
                    />
                  )}
                </div>
              </div>
            </ItemCard>
          ))}
        </div>
      )}
    </SectionWrapper>
  );
};

export default GrantsFunding;