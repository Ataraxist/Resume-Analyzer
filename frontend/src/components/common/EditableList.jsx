import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import EditableText from './EditableText';

function EditableList({ 
  items = [], 
  onChange, 
  placeholder = "Add item",
  badgeClass = "badge badge-info",
  disabled = false 
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState('');

  const handleAdd = () => {
    if (newItem.trim()) {
      onChange([...items, newItem.trim()]);
      setNewItem('');
      setIsAdding(false);
    }
  };

  const handleRemove = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange(newItems);
  };

  const handleEdit = (index, newValue) => {
    if (newValue.trim()) {
      const newItems = [...items];
      newItems[index] = newValue.trim();
      onChange(newItems);
    } else {
      handleRemove(index);
    }
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

  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item, idx) => (
        <span key={idx} className={`${badgeClass} text-xs flex items-center gap-1 group`}>
          <EditableText
            value={item}
            onChange={(newValue) => handleEdit(idx, newValue)}
            className="text-xs"
            disabled={disabled}
          />
          {!disabled && (
            <button
              onClick={() => handleRemove(idx)}
              className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Remove"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </span>
      ))}
      
      {!disabled && (
        <>
          {isAdding ? (
            <span className={`${badgeClass} text-xs`}>
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onBlur={handleAdd}
                onKeyDown={handleKeyDown}
                className="bg-transparent border-none outline-none text-xs w-24"
                placeholder={placeholder}
                autoFocus
              />
            </span>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-full transition-colors"
              title={`Add ${placeholder}`}
            >
              <Plus className="h-3 w-3" />
              Add
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default EditableList;