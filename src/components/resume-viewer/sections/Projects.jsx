import { Folder, Plus, X } from 'lucide-react';
import SectionWrapper from '../common/SectionWrapper';
import FieldEditor from '../common/FieldEditor';
import ArrayManager from '../common/ArrayManager';
import ItemCard from '../common/ItemCard';
import { useArrayHandlers } from '../hooks/useArrayHandlers';

const Projects = ({ data = [], onChange, editable = false }) => {
  const { handleRemove, handleUpdate } = useArrayHandlers(data, onChange);
  
  const handleAdd = () => {
    onChange([...data, {
      name: '',
      role: '',
      organization: '',
      description: '',
      dates: { start: '', end: '' },
      links: [],
      technologies: [],
      impact: []
    }]);
  };


  // Hide empty section in view mode
  if (!editable && data.length === 0) {
    return null;
  }

  return (
    <SectionWrapper
      icon={Folder}
      title="Projects"
      onAdd={editable ? handleAdd : null}
    >
      {(data?.length > 0 || editable) && (
        <div className="space-y-4">
          {data.map((project, index) => (
            <ItemCard
              key={index}
              onRemove={editable ? () => handleRemove(index) : null}
            >
              <div className="space-y-3">
                {/* Project Name - Primary Title */}
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  <FieldEditor
                    value={project.name}
                    onChange={(value) => handleUpdate(index, 'name', value)}
                    editable={editable}
                    placeholder="Project Name"
                  />
                </div>
                
                {/* Role - Secondary Info */}
                {(project.role || editable) && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <FieldEditor
                      value={project.role}
                      onChange={(value) => handleUpdate(index, 'role', value)}
                      editable={editable}
                      placeholder="Your Role"
                    />
                  </div>
                )}

                {/* Organization */}
                {(project.organization || editable) && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <FieldEditor
                      value={project.organization}
                      onChange={(value) => handleUpdate(index, 'organization', value)}
                      editable={editable}
                      placeholder="Organization/Company"
                    />
                  </div>
                )}

                {/* Dates - Metadata */}
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  <FieldEditor
                    value={project.dates?.start}
                    onChange={(value) => handleUpdate(index, 'dates.start', value)}
                    editable={editable}
                    placeholder="Mar 2023"
                    size="small"
                  />
                  {' - '}
                  <FieldEditor
                    value={project.dates?.end}
                    onChange={(value) => handleUpdate(index, 'dates.end', value)}
                    editable={editable}
                    placeholder="Jun 2023"
                    size="small"
                  />
                </div>

                <FieldEditor
                  value={project.description}
                  onChange={(value) => handleUpdate(index, 'description', value)}
                  editable={editable}
                  placeholder="Project description..."
                  type="multiline"
                />

                {(project.technologies?.length > 0 || editable) && (
                  <ArrayManager
                    items={project.technologies || []}
                    onItemsChange={(items) => handleUpdate(index, 'technologies', items)}
                    editable={editable}
                    placeholder="Add technology..."
                    badgeStyle={true}
                    label="Technologies"
                  />
                )}

                {(project.impact?.length > 0 || editable) && (
                  <ArrayManager
                    items={project.impact || []}
                    onItemsChange={(items) => handleUpdate(index, 'impact', items)}
                    editable={editable}
                    placeholder="Add impact..."
                    label="Impact"
                  />
                )}

                {(project.links?.length > 0 || editable) && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Links</p>
                    <div className="space-y-2">
                      {project.links?.map((link, linkIdx) => (
                        <div key={linkIdx} className="flex gap-2">
                          <FieldEditor
                            value={link.label}
                            onChange={(value) => {
                              const newLinks = [...(project.links || [])];
                              newLinks[linkIdx] = { ...newLinks[linkIdx], label: value };
                              handleUpdate(index, 'links', newLinks);
                            }}
                            editable={editable}
                            placeholder="Link label"
                            size="small"
                          />
                          <FieldEditor
                            value={link.url}
                            onChange={(value) => {
                              const newLinks = [...(project.links || [])];
                              newLinks[linkIdx] = { ...newLinks[linkIdx], url: value };
                              handleUpdate(index, 'links', newLinks);
                            }}
                            editable={editable}
                            placeholder="URL"
                            className="flex-1"
                          />
                          {editable && (
                            <button
                              onClick={() => {
                                const newLinks = project.links.filter((_, i) => i !== linkIdx);
                                handleUpdate(index, 'links', newLinks);
                              }}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      {editable && (
                        <button
                          onClick={() => {
                            const newLinks = [...(project.links || []), { label: '', url: '' }];
                            handleUpdate(index, 'links', newLinks);
                          }}
                          className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                          Add
                        </button>
                      )}
                    </div>
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

export default Projects;