import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';

function DimensionRadarChart({ data }) {
  const chartData = data || [];
  
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
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="card">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Dimension Analysis</h3>
      
      <ResponsiveContainer width="100%" height={400}>
        <RadarChart data={chartData}>
          <PolarGrid 
            stroke="#e5e7eb"
            strokeDasharray="3 3"
          />
          <PolarAngleAxis 
            dataKey="dimension" 
            tick={{ fill: '#6b7280', fontSize: 12 }}
          />
          <PolarRadiusAxis 
            domain={[0, 100]}
            tick={{ fill: '#9ca3af', fontSize: 10 }}
            axisLine={false}
          />
          <Radar 
            name="Your Score" 
            dataKey="score" 
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.3}
            strokeWidth={2}
          />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {chartData.map((item, idx) => {
            const getColorClass = (score) => {
              if (score >= 70) return 'text-success-600';
              if (score >= 50) return 'text-warning-600';
              return 'text-danger-600';
            };
            
            return (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{item.dimension}</span>
                <span className={`text-sm font-semibold ${getColorClass(item.score)}`}>
                  {item.score}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default DimensionRadarChart;