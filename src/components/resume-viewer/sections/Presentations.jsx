import { Mic } from 'lucide-react';
import SectionWrapper from '../common/SectionWrapper';
import FieldEditor from '../common/FieldEditor';
import ItemCard from '../common/ItemCard';
import { useArrayHandlers } from '../hooks/useArrayHandlers';

const Presentations = ({ data = [], onChange, editable = false }) => {
  const { handleRemove, handleUpdate } = useArrayHandlers(data, onChange);
  
  const handleAdd = () => {
    onChange([...data, {
      title: '',
      event: '',
      type: '',
      date: '',
      url: ''
    }]);
  };

  // Hide empty section in view mode
  if (!editable && data.length === 0) {
    return null;
  }

  return (
    <SectionWrapper
      icon={Mic}
      title="Presentations"
      onAdd={editable ? handleAdd : null}
    >
      {(data?.length > 0 || editable) && (
        <div className="space-y-4">
          {data.map((pres, index) => (
            <ItemCard
              key={index}
              onRemove={editable ? () => handleRemove(index) : null}
            >
              <div className="space-y-3">
                {/* Title - Primary */}
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  <FieldEditor
                    value={pres.title}
                    onChange={(value) => handleUpdate(index, 'title', value)}
                    editable={editable}
                    placeholder="Presentation Title"
                  />
                </div>
                
                {/* Event - Secondary */}
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <FieldEditor
                    value={pres.event}
                    onChange={(value) => handleUpdate(index, 'event', value)}
                    editable={editable}
                    placeholder="Event/Conference"
                  />
                </div>
                
                {/* Type and Date - Metadata */}
                <div className="text-xs text-gray-500 dark:text-gray-500 flex gap-4">
                  {(pres.type || editable) && (
                    <FieldEditor
                      value={pres.type}
                      onChange={(value) => handleUpdate(index, 'type', value)}
                      editable={editable}
                      placeholder="Talk/Poster/Keynote"
                      size="small"
                    />
                  )}
                  {(pres.date || editable) && (
                    <FieldEditor
                      value={pres.date}
                      onChange={(value) => handleUpdate(index, 'date', value)}
                      editable={editable}
                      placeholder="Oct 2023"
                      size="small"
                    />
                  )}
                </div>
                
                {/* URL */}
                {(pres.url || editable) && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <FieldEditor
                      value={pres.url}
                      onChange={(value) => handleUpdate(index, 'url', value)}
                      editable={editable}
                      placeholder="Link to slides or recording"
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

export default Presentations;