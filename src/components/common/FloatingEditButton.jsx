import { Pencil, Eye } from 'lucide-react';
import { useEditMode } from '../../contexts/EditModeContext';

function FloatingEditButton() {
  const { isEditMode, toggleEditMode } = useEditMode();

  const handleClick = () => {
    toggleEditMode();
  };

  return (
    <button
      onClick={handleClick}
      className={`
        fixed bottom-8 right-8 z-50
        w-14 h-14 rounded-full
        flex items-center justify-center
        shadow-lg hover:shadow-xl
        transform transition-all duration-200
        hover:scale-110 active:scale-95
        ${isEditMode 
          ? 'bg-green-600 hover:bg-green-700 text-white' 
          : 'bg-primary-600 hover:bg-primary-700 text-white'
        }
      `}
      title={isEditMode ? 'Switch to View Mode' : 'Switch to Edit Mode'}
      aria-label={isEditMode ? 'Switch to View Mode' : 'Switch to Edit Mode'}
    >
      {isEditMode ? (
        <Eye className="h-6 w-6" />
      ) : (
        <Pencil className="h-6 w-6" />
      )}
    </button>
  );
}

export default FloatingEditButton;