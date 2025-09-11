import { Lightbulb } from 'lucide-react';
import SectionWrapper from '../common/SectionWrapper';
import FieldEditor from '../common/FieldEditor';
import ArrayManager from '../common/ArrayManager';
import ItemCard from '../common/ItemCard';
import { useArrayHandlers } from '../hooks/useArrayHandlers';

const Patents = ({ data = [], onChange, editable = false }) => {
  const { handleRemove, handleUpdate } = useArrayHandlers(data, onChange);
  
  const handleAdd = () => {
    onChange([...data, {
      title: '',
      number: '',
      date: '',
      assignee: '',
      url: ''
    }]);
  };

  // Hide empty section in view mode
  if (!editable && data.length === 0) {
    return null;
  }

  return (
    <SectionWrapper
      icon={Lightbulb}
      title="Patents"
      onAdd={editable ? handleAdd : null}
    >
      {(data?.length > 0 || editable) && (
        <div className="space-y-4">
          {data.map((patent, index) => (
            <ItemCard
              key={index}
              onRemove={editable ? () => handleRemove(index) : null}
            >
              <div className="space-y-3">
                {/* Title - Primary */}
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  <FieldEditor
                    value={patent.title}
                    onChange={(value) => handleUpdate(index, 'title', value)}
                    editable={editable}
                    placeholder="Patent Title"
                  />
                </div>
                
                {/* Assignee - Secondary */}
                {(patent.assignee || editable) && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <FieldEditor
                      value={patent.assignee}
                      onChange={(value) => handleUpdate(index, 'assignee', value)}
                      editable={editable}
                      placeholder="Assignee"
                    />
                  </div>
                )}
                
                {/* Patent Number and Date - Metadata */}
                <div className="text-xs text-gray-500 dark:text-gray-500 flex gap-4">
                  {(patent.number || editable) && (
                    <span>
                      <span className="mr-1">Number:</span>
                      <FieldEditor
                        value={patent.number}
                        onChange={(value) => handleUpdate(index, 'number', value)}
                        editable={editable}
                        placeholder="Patent Number"
                        size="small"
                      />
                    </span>
                  )}
                  {(patent.date || editable) && (
                    <FieldEditor
                      value={patent.date}
                      onChange={(value) => handleUpdate(index, 'date', value)}
                      editable={editable}
                      placeholder="2023-08-15"
                      size="small"
                    />
                  )}
                </div>
                
                {/* URL */}
                {(patent.url || editable) && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <FieldEditor
                      value={patent.url}
                      onChange={(value) => handleUpdate(index, 'url', value)}
                      editable={editable}
                      placeholder="Patent URL"
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

export default Patents;