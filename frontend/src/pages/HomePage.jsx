import { Link } from 'react-router-dom';
import { FileText, Search, BarChart3, Target, Award, TrendingUp } from 'lucide-react';

function HomePage() {
  const features = [
    {
      icon: FileText,
      title: 'Resume Parsing',
      description: 'Advanced AI extracts and structures your resume data automatically'
    },
    {
      icon: Search,
      title: 'O*NET Integration',
      description: 'Compare against 1000+ official occupation definitions'
    },
    {
      icon: BarChart3,
      title: 'Detailed Analysis',
      description: 'Get scores across 6 professional dimensions'
    },
    {
      icon: Target,
      title: 'Gap Identification',
      description: 'Discover exactly what skills and experience you need'
    },
    {
      icon: Award,
      title: 'Recommendations',
      description: 'Receive actionable steps to improve your qualification'
    },
    {
      icon: TrendingUp,
      title: 'Career Growth',
      description: 'Track your progress and improvement over time'
    }
  ];
  
  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="text-center py-16">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          AI-Powered Resume Analysis
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Compare your resume against real O*NET job requirements and get actionable 
          insights to advance your career.
        </p>
        <Link
          to="/jobs"
          className="inline-flex items-center px-6 py-3 text-lg font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
        >
          Browse Jobs
        </Link>
      </div>
      
      {/* Features Grid */}
      <div className="py-12">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          How It Works
        </h2>
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
      
      {/* Process Steps */}
      <div className="py-12 bg-gray-50 -mx-4 px-4 rounded-lg">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Simple 3-Step Process
        </h2>
        <div className="flex flex-col md:flex-row justify-between items-center max-w-4xl mx-auto">
          <div className="text-center mb-8 md:mb-0">
            <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              1
            </div>
            <h3 className="text-lg font-semibold mb-2">Select Target Job</h3>
            <p className="text-gray-600">Browse 1000+ O*NET occupations</p>
          </div>
          
          <div className="hidden md:block flex-1 h-1 bg-gray-300 mx-4" />
          
          <div className="text-center mb-8 md:mb-0">
            <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              2
            </div>
            <h3 className="text-lg font-semibold mb-2">Upload Resume</h3>
            <p className="text-gray-600">PDF, DOCX, or TXT format</p>
          </div>
          
          <div className="hidden md:block flex-1 h-1 bg-gray-300 mx-4" />
          
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              3
            </div>
            <h3 className="text-lg font-semibold mb-2">Get Analysis</h3>
            <p className="text-gray-600">Detailed insights & recommendations</p>
          </div>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="text-center py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">
          Ready to Analyze Your Resume?
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          Get comprehensive insights in less than 60 seconds.
        </p>
        <Link
          to="/jobs"
          className="inline-flex items-center px-8 py-4 text-lg font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
        >
          Explore Jobs Now
        </Link>
      </div>
    </div>
  );
}

export default HomePage;