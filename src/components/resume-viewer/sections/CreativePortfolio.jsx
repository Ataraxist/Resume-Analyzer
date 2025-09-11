import { Palette } from 'lucide-react';
import SectionWrapper from '../common/SectionWrapper';
import FieldEditor from '../common/FieldEditor';
import ItemCard from '../common/ItemCard';
import { useArrayHandlers } from '../hooks/useArrayHandlers';

const CreativePortfolio = ({ data = [], onChange, editable = false }) => {
  const { handleRemove, handleUpdate } = useArrayHandlers(data, onChange);
  
  const handleAdd = () => {
    onChange([...data, {
      title: '',
      medium: '',
      role: '',
      venue: '',
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
      icon={Palette}
      title="Creative Portfolio"
      onAdd={editable ? handleAdd : null}
    >
      {(data?.length > 0 || editable) && (
        <div className="space-y-4">
          {data.map((work, index) => (
            <ItemCard
              key={index}
              onRemove={editable ? () => handleRemove(index) : null}
            >
              <div className="space-y-3">
                {/* Title - Primary */}
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  <FieldEditor
                    value={work.title}
                    onChange={(value) => handleUpdate(index, 'title', value)}
                    editable={editable}
                    placeholder="Work Title"
                  />
                </div>
                
                {/* Role - Secondary */}
                {(work.role || editable) && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <FieldEditor
                      value={work.role}
                      onChange={(value) => handleUpdate(index, 'role', value)}
                      editable={editable}
                      placeholder="Your Role"
                    />
                  </div>
                )}
                
                {/* Venue - Secondary */}
                {(work.venue || editable) && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <FieldEditor
                      value={work.venue}
                      onChange={(value) => handleUpdate(index, 'venue', value)}
                      editable={editable}
                      placeholder="Venue/Platform"
                    />
                  </div>
                )}
                
                {/* Medium and Date - Metadata */}
                <div className="text-xs text-gray-500 dark:text-gray-500 flex gap-4">
                  {(work.medium || editable) && (
                    <FieldEditor
                      value={work.medium}
                      onChange={(value) => handleUpdate(index, 'medium', value)}
                      editable={editable}
                      placeholder="Film/Photography/Digital"
                      size="small"
                    />
                  )}
                  {(work.date || editable) && (
                    <FieldEditor
                      value={work.date}
                      onChange={(value) => handleUpdate(index, 'date', value)}
                      editable={editable}
                      placeholder="Sep 2023"
                      size="small"
                    />
                  )}
                </div>
                
                {/* URL */}
                {(work.url || editable) && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <FieldEditor
                      value={work.url}
                      onChange={(value) => handleUpdate(index, 'url', value)}
                      editable={editable}
                      placeholder="Portfolio link or URL"
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

export default CreativePortfolio;