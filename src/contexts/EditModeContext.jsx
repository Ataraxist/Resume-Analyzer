import { createContext, useContext, useEffect, useState } from 'react';

const EditModeContext = createContext();

export function EditModeProvider({ children }) {
  const [isEditMode, setIsEditMode] = useState(() => {
    // Check localStorage for saved preference
    const savedMode = localStorage.getItem('editMode');
    if (savedMode !== null) {
      return savedMode === 'true';
    }
    // Default to view mode (not editing)
    return false;
  });

  useEffect(() => {
    // Update localStorage when edit mode changes
    localStorage.setItem('editMode', isEditMode.toString());
  }, [isEditMode]);

  const toggleEditMode = () => {
    setIsEditMode(prev => !prev);
  };

  const setEditMode = (value) => {
    setIsEditMode(value);
  };

  return (
    <EditModeContext.Provider value={{ isEditMode, toggleEditMode, setEditMode }}>
      {children}
    </EditModeContext.Provider>
  );
}

export function useEditMode() {
  const context = useContext(EditModeContext);
  if (!context) {
    throw new Error('useEditMode must be used within an EditModeProvider');
  }
  return context;
}