import { useState, useEffect, useRef } from 'react';
import { Check, X } from 'lucide-react';

function EditableText({ 
  value, 
  onChange, 
  placeholder = "Click to add", 
  className = "",
  multiline = false,
  disabled = false 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value || '');
  const inputRef = useRef(null);

  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    setIsEditing(false);
    if (localValue !== value) {
      onChange(localValue);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setLocalValue(value || '');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (disabled) {
    return <span className={className}>{value || placeholder}</span>;
  }

  if (isEditing) {
    const InputComponent = multiline ? 'textarea' : 'input';
    
    return (
      <div className="inline-flex items-center gap-1">
        <InputComponent
          ref={inputRef}
          type="text"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className={`${className} px-1 py-0.5 border border-primary-400 rounded outline-none focus:ring-1 focus:ring-primary-500 ${
            multiline ? 'min-h-[60px] w-full' : ''
          }`}
          rows={multiline ? 3 : undefined}
        />
      </div>
    );
  }

  return (
    <span 
      onClick={() => !disabled && setIsEditing(true)}
      className={`${className} cursor-pointer hover:bg-gray-100 hover:text-primary-600 px-1 py-0.5 rounded transition-colors inline`}
      title="Click to edit"
    >
      {value || <span className="text-gray-400 italic">{placeholder}</span>}
    </span>
  );
}

export default EditableText;