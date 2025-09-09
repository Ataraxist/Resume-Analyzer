import { Link } from 'react-router-dom';
import { FileText, Search, BarChart3, Target, Award, TrendingUp } from 'lucide-react';

function HomePage() {
  const features = [
    {
      icon: FileText,
      title: 'Career Path Analysis',
      description: 'AI evaluates your experience against career requirements'
    },
    {
      icon: Search,
      title: 'Skill Gap Discovery',
      description: 'Identify missing skills and competencies for your target role'
    },
    {
      icon: BarChart3,
      title: 'Professional Development',
      description: 'Get personalized learning and certification recommendations'
    },
    {
      icon: Target,
      title: 'Career Roadmap',
      description: 'Clear pathway to achieve your professional goals'
    },
    {
      icon: Award,
      title: 'Actionable Guidance',
      description: 'Specific steps to accelerate your career growth'
    },
    {
      icon: TrendingUp,
      title: 'Progress Tracking',
      description: 'Monitor your professional development journey'
    }
  ];
  
  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="text-center py-16">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          AI-Powered Career Development Advisor
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Bridge the gap between your current skills and career goals with personalized 
          guidance powered by O*NET occupational data.
        </p>
        
        {/* Process Steps */}
        <div className="py-12 bg-gray-50 -mx-4 px-4 rounded-lg mb-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Simple 3-Step Process
          </h2>
          <div className="flex flex-col md:flex-row justify-between items-center max-w-4xl mx-auto">
            <div className="text-center mb-8 md:mb-0">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-lg font-semibold mb-2">Choose Your Career Path</h3>
              <p className="text-gray-600">Explore 1000+ O*NET career profiles</p>
            </div>
            
            <div className="hidden md:block flex-1 h-1 bg-gray-300 mx-4" />
            
            <div className="text-center mb-8 md:mb-0">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-lg font-semibold mb-2">Share Your Experience</h3>
              <p className="text-gray-600">Upload resume or import from Google Docs</p>
            </div>
            
            <div className="hidden md:block flex-1 h-1 bg-gray-300 mx-4" />
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-lg font-semibold mb-2">Get Your Career Roadmap</h3>
              <p className="text-gray-600">Personalized guidance & action plan</p>
            </div>
          </div>
        </div>
        
        <Link
          to="/careers"
          className="inline-flex items-center px-6 py-3 text-lg font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
        >
          Explore Career Paths
        </Link>
      </div>
      
      {/* Features Grid */}
      <div className="py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="card">
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-primary-100 rounded-lg">
                    <Icon className="h-6 w-6 text-primary-600" />
                  </div>
                  <h3 className="ml-3 text-lg font-semibold text-gray-900">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default HomePage;