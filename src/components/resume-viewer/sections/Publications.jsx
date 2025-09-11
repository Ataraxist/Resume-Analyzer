import { BookOpen } from 'lucide-react';
import SectionWrapper from '../common/SectionWrapper';
import FieldEditor from '../common/FieldEditor';
import ArrayManager from '../common/ArrayManager';
import ItemCard from '../common/ItemCard';
import { useArrayHandlers } from '../hooks/useArrayHandlers';

const Publications = ({ data = [], onChange, editable = false }) => {
  const { handleRemove, handleUpdate } = useArrayHandlers(data, onChange);
  
  const handleAdd = () => {
    onChange([...data, {
      title: '',
      venue: '',
      date: '',
      authors: [],
      doi: '',
      url: '',
      notes: ''
    }]);
  };


  // Hide empty section in view mode
  if (!editable && data.length === 0) {
    return null;
  }

  return (
    <SectionWrapper
      icon={BookOpen}
      title="Publications"
      onAdd={editable ? handleAdd : null}
    >
      {(data?.length > 0 || editable) && (
        <div className="space-y-4">
          {data.map((pub, index) => (
            <ItemCard
              key={index}
              onRemove={editable ? () => handleRemove(index) : null}
            >
              <div className="space-y-3">
                {/* Title - Primary */}
                <div className="flex items-start gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-16 mt-0.5">Title:</span>
                  <div className="flex-1 text-sm font-medium text-gray-900 dark:text-white">
                    <FieldEditor
                      value={pub.title}
                      onChange={(value) => handleUpdate(index, 'title', value)}
                      editable={editable}
                      placeholder="Publication Title"
                    />
                  </div>
                </div>
                
                {/* Venue - Secondary */}
                <div className="flex items-start gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-16 mt-0.5">Venue:</span>
                  <div className="flex-1 text-sm text-gray-600 dark:text-gray-400">
                    <FieldEditor
                      value={pub.venue}
                      onChange={(value) => handleUpdate(index, 'venue', value)}
                      editable={editable}
                      placeholder="Journal/Conference"
                    />
                  </div>
                </div>
                
                {/* Authors */}
                {(pub.authors?.length > 0 || editable) && (
                  <ArrayManager
                    items={pub.authors || []}
                    onItemsChange={(items) => handleUpdate(index, 'authors', items)}
                    editable={editable}
                    placeholder="Add author..."
                    badgeStyle={true}
                    label="Authors"
                  />
                )}
                
                {/* Date - Metadata */}
                {(pub.date || editable) && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400 w-16">Date:</span>
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      <FieldEditor
                        value={pub.date}
                        onChange={(value) => handleUpdate(index, 'date', value)}
                        editable={editable}
                        placeholder="2024-03"
                        size="small"
                      />
                    </div>
                  </div>
                )}
                
                {/* DOI */}
                {(pub.doi || editable) && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400 w-16">DOI:</span>
                    <div className="flex-1 text-sm text-gray-600 dark:text-gray-400">
                      <FieldEditor
                        value={pub.doi}
                        onChange={(value) => handleUpdate(index, 'doi', value)}
                        editable={editable}
                        placeholder="10.1234/example.2023"
                      />
                    </div>
                  </div>
                )}
                
                {/* URL */}
                {(pub.url || editable) && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400 w-16">URL:</span>
                    <div className="flex-1 text-sm text-gray-600 dark:text-gray-400">
                      <FieldEditor
                        value={pub.url}
                        onChange={(value) => handleUpdate(index, 'url', value)}
                        editable={editable}
                        placeholder="https://doi.org/10.1234/example"
                      />
                    </div>
                  </div>
                )}
                
                {/* Notes */}
                {(pub.notes || editable) && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <FieldEditor
                      value={pub.notes}
                      onChange={(value) => handleUpdate(index, 'notes', value)}
                      editable={editable}
                      placeholder="Notes"
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

export default Publications;