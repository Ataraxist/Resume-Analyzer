import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

function FitScoreGauge({ score, category }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, 100);
    return () => clearTimeout(timer);
  }, [score]);
  
  // Calculate rotation for the gauge needle
  const rotation = (animatedScore / 100) * 180 - 90;
  
  // Get color based on score
  const getColor = () => {
    if (score >= 85) return 'text-success-600';
    if (score >= 70) return 'text-primary-600';
    if (score >= 50) return 'text-warning-600';
    return 'text-danger-600';
  };
  
  const getIcon = () => {
    if (score >= 70) return TrendingUp;
    if (score >= 50) return Minus;
    return TrendingDown;
  };
  
  const Icon = getIcon();
  
  return (
    <div className="card">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Overall Fit Score</h3>
      
      <div className="relative">
        {/* SVG Gauge */}
        <div className="flex justify-center mb-4">
          <svg width="240" height="140" viewBox="0 0 240 140">
            {/* Background arc */}
            <path
              d="M 30 120 A 90 90 0 0 1 210 120"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="20"
              strokeLinecap="round"
            />
            
            {/* Score arc */}
            <path
              d="M 30 120 A 90 90 0 0 1 210 120"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="20"
              strokeLinecap="round"
              strokeDasharray={`${(animatedScore / 100) * 282.7} 282.7`}
              style={{
                transition: 'stroke-dasharray 1s ease-in-out'
              }}
            />
            
            {/* Gradient definition */}
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="33%" stopColor="#eab308" />
                <stop offset="66%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
            </defs>
            
            {/* Needle */}
            <line
              x1="120"
              y1="120"
              x2="120"
              y2="40"
              stroke="#1f2937"
              strokeWidth="3"
              strokeLinecap="round"
              transform={`rotate(${rotation} 120 120)`}
              style={{
                transition: 'transform 1s ease-in-out'
              }}
            />
            
            {/* Center circle */}
            <circle cx="120" cy="120" r="8" fill="#1f2937" />
          </svg>
        </div>
        
        {/* Score Display */}
        <div className="text-center">
          <div className={`text-5xl font-bold ${getColor()}`}>
            {Math.round(animatedScore)}%
          </div>
          
          <div className="mt-3">
            <div className={`inline-flex items-center px-3 py-1 rounded-full bg-${category.color}-100`}>
              <Icon className={`h-4 w-4 mr-1 text-${category.color}-600`} />
              <span className={`text-sm font-medium text-${category.color}-800`}>
                {category.category}
              </span>
            </div>
          </div>
          
          <p className="mt-3 text-sm text-gray-600">
            {category.description}
          </p>
        </div>
        
        {/* Score Ranges */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className="text-center">
              <div className="h-2 bg-danger-500 rounded-full mb-1" />
              <span className="text-gray-600">Poor</span>
              <span className="block text-gray-400">&lt;50</span>
            </div>
            <div className="text-center">
              <div className="h-2 bg-warning-500 rounded-full mb-1" />
              <span className="text-gray-600">Moderate</span>
              <span className="block text-gray-400">50-70</span>
            </div>
            <div className="text-center">
              <div className="h-2 bg-primary-500 rounded-full mb-1" />
              <span className="text-gray-600">Good</span>
              <span className="block text-gray-400">70-85</span>
            </div>
            <div className="text-center">
              <div className="h-2 bg-success-500 rounded-full mb-1" />
              <span className="text-gray-600">Excellent</span>
              <span className="block text-gray-400">&gt;85</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FitScoreGauge;