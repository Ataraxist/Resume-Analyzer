import { AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react';

function GapAnalysisView({ dimensionScores }) {
  // Organize gaps by priority
  const organizeGaps = () => {
    const critical = [];
    const important = [];
    const nice_to_have = [];
    
    Object.entries(dimensionScores).forEach(([dimension, data]) => {
      if (data.gaps && data.gaps.length > 0) {
        const dimensionName = dimension.charAt(0).toUpperCase() + 
                            dimension.slice(1).replace(/([A-Z])/g, ' $1').trim();
        
        data.gaps.forEach((gap) => {
          const gapItem = {
            dimension: dimensionName,
            item: gap,
            score: data.score
          };
          
          // Prioritize based on dimension and score
          if (data.score < 50 && ['tasks', 'skills'].includes(dimension)) {
            critical.push(gapItem);
          } else if (data.score < 70 && ['education', 'tools', 'workActivities'].includes(dimension)) {
            important.push(gapItem);
          } else {
            nice_to_have.push(gapItem);
          }
        });
      }
    });
    
    return { critical, important, nice_to_have };
  };
  
  const gaps = organizeGaps();
  const totalGaps = gaps.critical.length + gaps.important.length + gaps.nice_to_have.length;
  
  const GapSection = ({ title, items, icon: Icon, colorClass, bgClass }) => {
    if (items.length === 0) return null;
    
    return (
      <div className="card">
        <div className="flex items-center mb-4">
          <Icon className={`h-5 w-5 ${colorClass} mr-2`} />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <span className={`ml-auto px-2 py-1 text-xs font-medium rounded-full ${bgClass}`}>
            {items.length} gaps
          </span>
        </div>
        
        <div className="space-y-3">
          {items.map((gap, idx) => (
            <div key={idx} className="border-l-4 border-gray-200 pl-4 py-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{gap.item}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {gap.dimension} • Current score: {gap.score}%
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <div>
      {/* Summary Card */}
      <div className="card mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Gap Analysis Summary</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-danger-50 rounded-lg">
            <AlertCircle className="h-8 w-8 text-danger-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-danger-700">{gaps.critical.length}</p>
            <p className="text-sm text-danger-600">Critical Gaps</p>
          </div>
          
          <div className="text-center p-4 bg-warning-50 rounded-lg">
            <AlertTriangle className="h-8 w-8 text-warning-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-warning-700">{gaps.important.length}</p>
            <p className="text-sm text-warning-600">Important Gaps</p>
          </div>
          
          <div className="text-center p-4 bg-primary-50 rounded-lg">
            <Info className="h-8 w-8 text-primary-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-primary-700">{gaps.nice_to_have.length}</p>
            <p className="text-sm text-primary-600">Nice to Have</p>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Total Gaps Identified:</span> {totalGaps}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Focus on critical gaps first to maximize your qualification improvement
          </p>
        </div>
      </div>
      
      {/* Gap Sections */}
      <div className="space-y-6">
        <GapSection
          title="Critical Gaps"
          items={gaps.critical}
          icon={AlertCircle}
          colorClass="text-danger-600"
          bgClass="bg-danger-100 text-danger-800"
        />
        
        <GapSection
          title="Important Gaps"
          items={gaps.important}
          icon={AlertTriangle}
          colorClass="text-warning-600"
          bgClass="bg-warning-100 text-warning-800"
        />
        
        <GapSection
          title="Nice to Have"
          items={gaps.nice_to_have}
          icon={Info}
          colorClass="text-primary-600"
          bgClass="bg-primary-100 text-primary-800"
        />
      </div>
      
      {totalGaps === 0 && (
        <div className="card text-center py-12">
          <div className="text-success-600 mb-4">
            <CheckCircle className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Excellent Match!
          </h3>
          <p className="text-gray-600">
            No significant gaps identified. You meet most requirements for this occupation.
          </p>
        </div>
      )}
    </div>
  );
}

export default GapAnalysisView;