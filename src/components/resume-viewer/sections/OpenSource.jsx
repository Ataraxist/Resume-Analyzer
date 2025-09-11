import { GitBranch } from 'lucide-react';
import SectionWrapper from '../common/SectionWrapper';
import FieldEditor from '../common/FieldEditor';
import ArrayManager from '../common/ArrayManager';
import ItemCard from '../common/ItemCard';
import { useArrayHandlers } from '../hooks/useArrayHandlers';

const OpenSource = ({ data = [], onChange, editable = false }) => {
  const { handleRemove, handleUpdate } = useArrayHandlers(data, onChange);
  
  const handleAdd = () => {
    onChange([...data, {
      project: '',
      role: '',
      repo_url: '',
      contributions: []
    }]);
  };

  // Hide empty section in view mode
  if (!editable && data.length === 0) {
    return null;
  }

  return (
    <SectionWrapper
      icon={GitBranch}
      title="Open Source Contributions"
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
                {/* Project - Primary */}
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  <FieldEditor
                    value={item.project}
                    onChange={(value) => handleUpdate(index, 'project', value)}
                    editable={editable}
                    placeholder="Project Name"
                  />
                </div>
                
                {/* Role - Secondary */}
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <FieldEditor
                    value={item.role}
                    onChange={(value) => handleUpdate(index, 'role', value)}
                    editable={editable}
                    placeholder="Role (Contributor, Maintainer, etc.)"
                  />
                </div>
                
                {/* Repository URL */}
                {(item.repo_url || editable) && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <FieldEditor
                      value={item.repo_url}
                      onChange={(value) => handleUpdate(index, 'repo_url', value)}
                      editable={editable}
                      placeholder="Repository URL"
                    />
                  </div>
                )}
                
                {/* Contributions */}
                {(item.contributions?.length > 0 || editable) && (
                  <ArrayManager
                    items={item.contributions || []}
                    onItemsChange={(items) => handleUpdate(index, 'contributions', items)}
                    editable={editable}
                    placeholder="Add contribution..."
                    label="Contributions"
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

export default OpenSource;