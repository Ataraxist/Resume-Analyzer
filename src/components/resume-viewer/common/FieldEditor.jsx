import { useState, useEffect } from 'react';

function FieldEditor({ 
  value, 
  onChange, 
  placeholder = '',
  type = 'text', // text, email, url, multiline
  editable = true,
  className = '',
  size = 'normal' // small, normal, large
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value || '');

  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  const handleSave = () => {
    onChange(localValue);
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && type !== 'multiline') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setLocalValue(value || '');
      setIsEditing(false);
    }
  };

  const sizeClasses = {
    small: 'text-xs',
    normal: 'text-sm',
    large: 'text-base'
  };

  const baseClass = `${sizeClasses[size]} ${className}`;

  if (!editable) {
    return (
      <span className={baseClass}>
        {value || <span className="text-gray-400 dark:text-gray-500 italic">{placeholder}</span>}
      </span>
    );
  }

  if (isEditing) {
    if (type === 'multiline') {
      return (
        <textarea
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`${baseClass} bg-transparent border-b border-primary-500 outline-none w-full resize-none dark:text-white`}
          autoFocus
          rows={3}
        />
      );
    }

    return (
      <input
        type={type}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`${baseClass} bg-transparent border-b border-primary-500 outline-none dark:text-white`}
        autoFocus
      />
    );
  }

  return (
    <span
      onClick={() => setIsEditing(true)}
      className={`${baseClass} cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors`}
    >
      {value || <span className="text-gray-400 dark:text-gray-500 italic">{placeholder}</span>}
    </span>
  );
}

export default FieldEditor;