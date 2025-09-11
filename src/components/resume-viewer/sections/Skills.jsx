import { Code } from 'lucide-react';
import SectionWrapper from '../common/SectionWrapper';
import ArrayManager from '../common/ArrayManager';
import { SkillsSkeleton } from '../common/SkeletonComponents';

const SKILL_CATEGORIES = [
  { key: 'technical', label: 'Technical Skills', badgeClass: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' },
  { key: 'soft_skills', label: 'Soft Skills', badgeClass: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
  { key: 'tools', label: 'Tools & Software', badgeClass: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' },
  { key: 'domains', label: 'Domain Knowledge', badgeClass: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' },
  { key: 'programming_languages', label: 'Programming Languages', badgeClass: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' },
  { key: 'spoken_languages', label: 'Spoken Languages', badgeClass: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300' },
];

function Skills({ data = {}, onChange, editable = true, isLoading = false }) {
  const updateCategory = (category, items) => {
    onChange({
      ...data,
      [category]: items
    });
  };

  // Show skeleton only during actual loading
  const showSkeleton = isLoading && (!data || Object.keys(data).length === 0);

  // Hide empty section in view mode
  if (!editable && !isLoading) {
    // Check if all skill categories are empty
    const hasAnySkills = Object.values(data).some(skills => 
      Array.isArray(skills) && skills.length > 0
    );
    if (!hasAnySkills) {
      return null;
    }
  }

  return (
    <SectionWrapper icon={Code} title="Skills">
      {showSkeleton ? (
        <SkillsSkeleton />
      ) : (
      <div className="space-y-4 animate-fade-in">
        {/* All skill categories including languages */}
        {SKILL_CATEGORIES.map(({ key, label, badgeClass }) => (
          <div key={key}>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{label}</p>
            <ArrayManager
              items={data[key] || []}
              onItemsChange={(items) => updateCategory(key, items)}
              placeholder={label.toLowerCase()}
              editable={editable}
              badgeStyle={true}
              badgeClass={badgeClass}
            />
          </div>
        ))}
      </div>
      )}
    </SectionWrapper>
  );
}

export default Skills;