import { ChevronRight } from 'lucide-react';

function OccupationCard({ occupation, onSelect }) {
  return (
    <button
      onClick={() => onSelect(occupation)}
      className="w-full text-left p-4 bg-white border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors group"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 group-hover:text-primary-700">
            {occupation.title}
          </h4>
          <p className="text-xs text-gray-500 mt-1">Code: {occupation.code}</p>
        </div>
        <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-primary-600" />
      </div>
    </button>
  );
}

export default OccupationCard;