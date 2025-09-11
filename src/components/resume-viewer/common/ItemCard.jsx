import { X } from 'lucide-react';

function ItemCard({ 
  children, 
  onRemove, 
  editable = true,
  className = '' 
}) {
  return (
    <div className={`relative border-l-2 border-gray-200 dark:border-gray-700 pl-3 group ${className}`}>
      {editable && onRemove && (
        <button
          onClick={onRemove}
          className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full p-1 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-700 transition-all"
        >
          <X className="h-3 w-3 text-gray-400 hover:text-red-500" />
        </button>
      )}
      {children}
    </div>
  );
}

export default ItemCard;