import { useState, useCallback } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

function DimensionRadarChart({ data, selectedDimension, onDimensionSelect, onDimensionHover, hoveredDimension: externalHoveredDimension, isAutoCycling: _isAutoCycling, showProgress, cycleProgress }) {
  const [localHoveredDimension, setLocalHoveredDimension] = useState(null);
  
  // Handle hover start
  const handleHoverStart = useCallback((dimension) => {
    setLocalHoveredDimension(dimension);
    if (onDimensionHover) {
      onDimensionHover(dimension);
    }
  }, [onDimensionHover]);
  
  // Handle hover end
  const handleHoverEnd = useCallback(() => {
    setLocalHoveredDimension(null);
    if (onDimensionHover) {
      onDimensionHover(null);
    }
  }, [onDimensionHover]);
  
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload[0]) {
      return (
        <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-900">
            {payload[0].payload.dimension}
          </p>
          <p className="text-sm text-primary-600">
            Score: {payload[0].value}%
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Click to view details
          </p>
        </div>
      );
    }
    return null;
  };
  
  const handleDimensionClick = useCallback((dimension) => {
    if (selectedDimension === dimension) {
      onDimensionSelect(dimension);
    } else {
      onDimensionSelect(dimension);
    }
  }, [selectedDimension, onDimensionSelect]);
  
  const CustomDot = useCallback(({ cx, cy, payload }) => {
    const isSelected = selectedDimension === payload.key;
    const isHovered = localHoveredDimension === payload.key || externalHoveredDimension === payload.key;
    
    return (
      <circle
        cx={cx}
        cy={cy}
        r={isSelected ? 8 : isHovered ? 6 : 4}
        fill={isSelected ? '#2563eb' : '#3b82f6'}
        stroke="#fff"
        strokeWidth={2}
        style={{ cursor: 'pointer' }}
        onClick={() => handleDimensionClick(payload.key)}
        onMouseEnter={() => handleHoverStart(payload.key)}
        onMouseLeave={handleHoverEnd}
      />
    );
  }, [selectedDimension, localHoveredDimension, externalHoveredDimension, handleDimensionClick, handleHoverStart, handleHoverEnd]);
  
  const CustomLabel = useCallback(({ payload, x, y, textAnchor, index }) => {
    const itemKey = data?.[index]?.key;
    const isSelected = selectedDimension === itemKey;
    const isHovered = localHoveredDimension === itemKey || externalHoveredDimension === itemKey;
    
    return (
      <text
        x={x}
        y={y}
        textAnchor={textAnchor}
        fill={isSelected ? '#2563eb' : isHovered ? '#3b82f6' : '#6b7280'}
        fontSize={isSelected ? 14 : 12}
        fontWeight={isSelected ? 600 : 400}
        style={{ cursor: 'pointer' }}
        onClick={() => handleDimensionClick(data[index].key)}
        onMouseEnter={() => handleHoverStart(data[index].key)}
        onMouseLeave={handleHoverEnd}
      >
        {payload.value}
      </text>
    );
  }, [data, selectedDimension, localHoveredDimension, externalHoveredDimension, handleDimensionClick, handleHoverStart, handleHoverEnd]);
  
  // Early return after all hooks are defined
  if (!data) {
    return null;
  }
  
  const chartData = data;
  
  return (
    <div className="card relative">
      <div className="flex flex-col lg:flex-row lg:gap-8">
        {/* Radar Chart */}
        <div className="flex-1 min-w-0">
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={chartData}>
              <PolarGrid 
                stroke="#e5e7eb"
                strokeDasharray="3 3"
              />
              <PolarAngleAxis 
                dataKey="dimension" 
                tick={CustomLabel}
              />
              <PolarRadiusAxis 
                domain={[0, 100]}
                tick={{ fill: '#9ca3af', fontSize: 10 }}
                axisLine={false}
              />
              <Radar 
                name="Your Score" 
                dataKey="score" 
                stroke={selectedDimension ? '#94a3b8' : '#3b82f6'}
                fill={selectedDimension ? '#94a3b8' : '#3b82f6'}
                fillOpacity={0.3}
                strokeWidth={2}
                dot={CustomDot}
                isAnimationActive={false}
              />
              {selectedDimension && (
                <Radar
                  dataKey={(item) => item.key === selectedDimension ? item.score : null}
                  stroke="#2563eb"
                  fill="#2563eb"
                  fillOpacity={0.5}
                  strokeWidth={3}
                  dot={false}
                  isAnimationActive={false}
                />
              )}
              <Tooltip content={<CustomTooltip />} isAnimationActive={false} animationDuration={0} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend - Right side on large screens, below on small screens */}
        <div className="mt-4 lg:mt-0 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-gray-200 lg:pl-8 lg:w-80">
          <div className="space-y-2">
            {chartData.map((item, idx) => {
              const isSelected = selectedDimension === item.key;
              const isHovered = localHoveredDimension === item.key || externalHoveredDimension === item.key;
              
              const getColorClass = (score) => {
                if (score >= 70) return 'text-success-600';
                if (score >= 50) return 'text-warning-600';
                return 'text-danger-600';
              };
              
              return (
                <div 
                  key={idx} 
                  className={`flex items-center justify-between p-3 rounded cursor-pointer transition-all ${
                    isSelected ? 'bg-primary-100 ring-2 ring-primary-500' : 
                    isHovered ? 'bg-gray-50' : ''
                  }`}
                  onClick={() => handleDimensionClick(item.key)}
                  onMouseEnter={() => handleHoverStart(item.key)}
                  onMouseLeave={handleHoverEnd}
                >
                  <span className={`text-sm ${isSelected ? 'font-medium text-primary-900' : 'text-gray-600'}`}>
                    {item.dimension}
                  </span>
                  <span className={`text-sm font-semibold ${getColorClass(item.score)}`}>
                    {item.score}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Auto-cycling progress indicator */}
      {showProgress && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-200">
          <div 
            className="h-full bg-primary-500 transition-all duration-100 ease-linear"
            style={{ width: `${cycleProgress}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default DimensionRadarChart;