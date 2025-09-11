function DimensionRadarChartSkeleton() {
  // Mock data for 6 dimensions
  const dimensions = [
    'Job Tasks',
    'Core Skills', 
    'Education',
    'Work Activities',
    'Knowledge Areas',
    'Tools & Software'
  ];

  return (
    <div className="card relative animate-pulse">
      <div className="flex flex-col lg:flex-row lg:gap-8">
        {/* Radar Chart Skeleton */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-center" style={{ height: '400px' }}>
            {/* Hexagonal radar chart skeleton */}
            <svg width="100%" height="100%" viewBox="0 0 400 400" className="max-w-md">
              {/* Grid circles */}
              {[80, 120, 160, 200, 240].map((radius, idx) => (
                <circle
                  key={idx}
                  cx="200"
                  cy="200"
                  r={radius}
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
              ))}
              
              {/* Hexagonal lines for 6 dimensions */}
              {dimensions.map((_, idx) => {
                const angle = (idx * 60 - 90) * (Math.PI / 180);
                const x = 200 + 240 * Math.cos(angle);
                const y = 200 + 240 * Math.sin(angle);
                return (
                  <line
                    key={idx}
                    x1="200"
                    y1="200"
                    x2={x}
                    y2={y}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                  />
                );
              })}
              
              {/* Mock polygon shape */}
              <polygon
                points="200,100 280,150 280,250 200,300 120,250 120,150"
                fill="#cbd5e1"
                fillOpacity="0.3"
                stroke="#94a3b8"
                strokeWidth="2"
              />
              
              {/* Dimension labels */}
              {dimensions.map((label, idx) => {
                const angle = (idx * 60 - 90) * (Math.PI / 180);
                const x = 200 + 260 * Math.cos(angle);
                const y = 200 + 260 * Math.sin(angle);
                return (
                  <text
                    key={idx}
                    x={x}
                    y={y}
                    textAnchor="middle"
                    className="fill-gray-400 text-xs"
                  >
                    {label}
                  </text>
                );
              })}
              
              {/* Center scores */}
              <text x="200" y="200" textAnchor="middle" className="fill-gray-400 text-sm">
                Loading...
              </text>
            </svg>
          </div>
        </div>
        
        {/* Legend Skeleton - Right side on large screens, below on small screens */}
        <div className="mt-4 lg:mt-0 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700 lg:pl-8 lg:w-80">
          <div className="space-y-2">
            {dimensions.map((dimension, idx) => (
              <div 
                key={idx} 
                className="flex items-center justify-between p-3 rounded bg-gray-50 dark:bg-gray-800"
              >
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Progress indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <div className="h-full bg-gray-300 dark:bg-gray-600 animate-pulse w-full"></div>
      </div>
    </div>
  );
}

export default DimensionRadarChartSkeleton;