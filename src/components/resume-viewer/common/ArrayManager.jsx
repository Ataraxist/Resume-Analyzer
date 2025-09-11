import { useState } from 'react';
import { Plus, X } from 'lucide-react';

function ArrayManager({ 
  items = [], 
  onItemsChange,
  placeholder = 'Add item',
  editable = true,
  renderItem = null, // Custom render function for complex items
  badgeStyle = false, // Show as badges instead of list
  badgeClass = 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
  label = null // Optional label for the array
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState('');

  const handleAdd = () => {
    if (newItem.trim()) {
      onItemsChange([...items, newItem.trim()]);
      setNewItem('');
      setIsAdding(false);
    }
  };

  const handleRemove = (index) => {
    onItemsChange(items.filter((_, i) => i !== index));
  };

  const handleUpdate = (index, value) => {
    const updated = [...items];
    updated[index] = value;
    onItemsChange(updated);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    } else if (e.key === 'Escape') {
      setNewItem('');
      setIsAdding(false);
    }
  };

  if (badgeStyle) {
    return (
      <div>
        {label && <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{label}</p>}
        <div className="flex flex-wrap gap-2">
        {items.map((item, idx) => (
          <span key={idx} className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${badgeClass}`}>
            {renderItem ? renderItem(item, idx, handleUpdate, handleRemove) : (
              <>
                <span>{item}</span>
                {editable && (
                  <button
                    onClick={() => handleRemove(idx)}
                    className="ml-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </>
            )}
          </span>
        ))}
        
        {editable && (
          <>
            {isAdding ? (
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onBlur={handleAdd}
                onKeyDown={handleKeyDown}
                className={`px-2 py-1 text-xs bg-transparent border border-dashed border-gray-400 dark:border-gray-600 rounded-full outline-none dark:text-white`}
                placeholder={placeholder}
                autoFocus
              />
            ) : (
              <button
                onClick={() => setIsAdding(true)}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                <Plus className="h-3 w-3" />
                Add
              </button>
            )}
          </>
        )}
        </div>
      </div>
    );
  }

  // List style for complex items
  return (
    <div className="space-y-2">
      {label && <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{label}</p>}
      {items.map((item, idx) => (
        <div key={idx} className="group relative">
          {renderItem ? (
            renderItem(item, idx, handleUpdate, handleRemove)
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
              {editable && (
                <button
                  onClick={() => handleRemove(idx)}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>
      ))}
      
      {editable && (
        <>
          {isAdding ? (
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onBlur={handleAdd}
              onKeyDown={handleKeyDown}
              className="text-sm bg-transparent border-b border-gray-400 dark:border-gray-600 outline-none dark:text-white w-full"
              placeholder={placeholder}
              autoFocus
            />
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default ArrayManager;