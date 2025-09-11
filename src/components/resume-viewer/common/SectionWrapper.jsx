import { Plus } from 'lucide-react';

function SectionWrapper({ 
  icon, 
  title, 
  children, 
  onAdd,
  editable = true,
  isEmpty = false 
}) {
  const Icon = icon;
  return (
    <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
      <div className="flex items-center mb-4">
        <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400 mr-2" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
        {editable && onAdd && (
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-1 ml-3 px-2 py-0.5 text-xs text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <Plus className="h-3 w-3" />
            Add
          </button>
        )}
      </div>
      <div className="ml-7">
        {isEmpty && !editable ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 italic">No data available</p>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

export default SectionWrapper;