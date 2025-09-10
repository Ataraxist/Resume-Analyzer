import { useState, useEffect, useCallback } from 'react';
import { FileText, Clock, CheckCircle, AlertCircle, Trash2, ChevronRight } from 'lucide-react';
import firebaseResumeService from '../../services/firebaseResumeService';
import { useAuth } from '../../contexts/FirebaseAuthContext';

function PreviousResumes({ onSelectResume, onRefresh }) {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchMyResumes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      if (!user) {
        setResumes([]);
        return;
      }
      const recentResumes = await firebaseResumeService.getRecentResumes(user.uid, 10);
      if (!recentResumes) {
        throw new Error('Failed to load resumes');
      }
      setResumes(recentResumes);
    } catch (err) {
      console.error('Failed to fetch resumes:', err);
      // Don't show error for empty results, just set empty array
      setResumes([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMyResumes();
  }, [onRefresh, fetchMyResumes]);

  const handleDelete = async (e, resumeId) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this resume?')) {
      try {
        await firebaseResumeService.deleteResume(resumeId, user.uid);
        fetchMyResumes();
      } catch (err) {
        console.error('Failed to delete resume:', err);
        alert('Failed to delete resume');
      }
    }
  };

  const handleSelectResume = async (resume) => {
    try {
      // Fetch the full resume data including structured data
      const fullResume = await firebaseResumeService.getResumeById(resume.id);
      const structuredData = fullResume.structuredData;
      
      onSelectResume({
        resumeId: resume.id,
        structuredData,
        filename: resume.fileName
      });
    } catch (err) {
      console.error('Failed to load resume:', err);
      alert('Failed to load resume');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatDate = (dateValue) => {
    // Handle undefined or null dates
    if (!dateValue) {
      return 'Unknown date';
    }
    
    let date;
    
    // Handle Firestore Timestamp objects
    if (dateValue?.toDate && typeof dateValue.toDate === 'function') {
      date = dateValue.toDate();
    } 
    // Handle JavaScript Date objects
    else if (dateValue instanceof Date) {
      date = dateValue;
    }
    // Handle string dates (legacy support)
    else if (typeof dateValue === 'string') {
      // Add 'Z' to indicate UTC time if not present
      const utcDateString = dateValue.includes('Z') || dateValue.includes('+') || dateValue.includes('-') 
        ? dateValue 
        : dateValue.replace(' ', 'T') + 'Z';
      date = new Date(utcDateString);
    }
    // Handle numeric timestamps
    else if (typeof dateValue === 'number') {
      date = new Date(dateValue);
    }
    else {
      return 'Unknown date';
    }
    
    // Check for invalid date
    if (isNaN(date.getTime())) {
      return 'Unknown date';
    }
    
    const now = new Date();
    const diffInMs = now - date;
    
    // Handle invalid or future dates
    if (diffInMs < 0) {
      return date.toLocaleDateString();
    }
    
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (error || resumes.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Uploads</h3>
      <div className="space-y-3">
        {resumes.map((resume) => (
          <div
            key={resume.id}
            className="group border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-primary-300 dark:hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all cursor-pointer"
            onClick={() => handleSelectResume(resume)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-primary-600 dark:group-hover:text-primary-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white group-hover:text-primary-700 dark:group-hover:text-primary-400">
                    {resume.fileName}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(resume.createdAt)}
                    </span>
                    <span className="text-gray-400 dark:text-gray-600">•</span>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(resume.processingStatus || 'completed')}
                      <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                        {resume.processingStatus || 'completed'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => handleDelete(e, resume.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-all"
                  title="Delete resume"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-primary-600 dark:group-hover:text-primary-400" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
        Click on a resume to use it for analysis with your selected job
      </p>
    </div>
  );
}

export default PreviousResumes;