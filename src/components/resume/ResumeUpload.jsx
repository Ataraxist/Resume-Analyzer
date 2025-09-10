import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, Link, Globe } from 'lucide-react';
import toastService from '../../services/toastService';

function ResumeUpload({ onUpload, onGoogleDocsImport }) {
  const [activeTab, setActiveTab] = useState('file');
  const [googleDocsUrl, setGoogleDocsUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const onDrop = useCallback((acceptedFiles, fileRejections) => {
    if (fileRejections.length > 0) {
      const rejection = fileRejections[0];
      if (rejection.errors[0]?.code === 'file-too-large') {
        toastService.error('File size exceeds 500KB limit. Please use a smaller file.');
      } else if (rejection.errors[0]?.code === 'file-invalid-type') {
        toastService.error('Please upload a PDF, DOCX, or TXT file.');
      } else {
        toastService.error('Invalid file. Please try a different file.');
      }
      return;
    }
    
    if (acceptedFiles.length > 0) {
      onUpload(acceptedFiles[0]);
    }
  }, [onUpload]);
  
  const { getRootProps, getInputProps, isDragActive, acceptedFiles, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxSize: 500 * 1024, // 500KB
    maxFiles: 1
  });
  
  const validateGoogleDocsUrl = (url) => {
    const patterns = [
      /^https:\/\/docs\.google\.com\/document\/d\/[a-zA-Z0-9-_]+/,
      /^https:\/\/drive\.google\.com\/file\/d\/[a-zA-Z0-9-_]+/
    ];
    return patterns.some(pattern => pattern.test(url));
  };
  
  const handleGoogleDocsImport = async () => {
    setUrlError('');
    
    if (!googleDocsUrl.trim()) {
      toastService.warning('Please enter a Google Docs URL');
      setUrlError('Please enter a Google Docs URL');
      return;
    }
    
    if (!validateGoogleDocsUrl(googleDocsUrl)) {
      toastService.error('Please enter a valid Google Docs URL');
      setUrlError('Please enter a valid Google Docs URL');
      return;
    }
    
    setIsImporting(true);
    try {
      await onGoogleDocsImport(googleDocsUrl);
      setGoogleDocsUrl('');
      toastService.success('Google Doc imported successfully');
    } catch (error) {
      // Error is already handled by UploadPage with toast
      setUrlError(error.message);
    } finally {
      setIsImporting(false);
    }
  };
  
  return (
    <div>
      {/* Tab Selector */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          onClick={() => setActiveTab('file')}
          className={`flex items-center px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'file'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload File
        </button>
        <button
          onClick={() => setActiveTab('googledocs')}
          className={`flex items-center px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'googledocs'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Globe className="h-4 w-4 mr-2" />
          Import from Google Docs
        </button>
      </div>
      
      {/* File Upload Tab */}
      {activeTab === 'file' && (
        <div>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <input {...getInputProps()} />
            
            <div className="flex flex-col items-center">
              <div className={`p-4 rounded-full mb-4 ${
                isDragActive ? 'bg-primary-100 dark:bg-primary-900/30' : 'bg-gray-100 dark:bg-gray-800'
              }`}>
                <Upload className={`h-8 w-8 ${
                  isDragActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'
                }`} />
              </div>
              
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {isDragActive ? 'Drop your resume here' : 'Drag & drop your resume'}
              </p>
              
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                or <span className="text-primary-600 dark:text-primary-400 font-medium">browse files</span>
              </p>
              
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Supported formats: PDF, DOCX, TXT (Max 500KB)
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Google Docs Import Tab */}
      {activeTab === 'googledocs' && (
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">How to import from Google Docs:</h3>
            <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1 ml-4">
              <li>1. Open your resume in Google Docs</li>
              <li>2. Click Share → Get link</li>
              <li>3. Set to "Anyone with the link can view"</li>
              <li>4. Copy and paste the link below</li>
            </ol>
          </div>
          
          <div>
            <label htmlFor="googledocs-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Google Docs URL
            </label>
            <div className="flex space-x-2">
              <div className="flex-1">
                <input
                  id="googledocs-url"
                  type="url"
                  value={googleDocsUrl}
                  onChange={(e) => {
                    setGoogleDocsUrl(e.target.value);
                    setUrlError('');
                  }}
                  placeholder="https://docs.google.com/document/d/..."
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white ${
                    urlError ? 'border-danger-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  disabled={isImporting}
                />
                {urlError && (
                  <p className="mt-1 text-sm text-danger-600">{urlError}</p>
                )}
              </div>
              <button
                onClick={handleGoogleDocsImport}
                disabled={isImporting || !googleDocsUrl.trim()}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {isImporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Importing...
                  </>
                ) : (
                  <>
                    <Link className="h-4 w-4 mr-2" />
                    Import
                  </>
                )}
              </button>
            </div>
          </div>
          
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-start">
            <Globe className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
            <span>Make sure your document is set to "Anyone with the link can view" for import to work</span>
          </div>
        </div>
      )}
      
      {acceptedFiles.length > 0 && (
        <div className="mt-4 p-4 bg-success-50 border border-success-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-success-600 mr-2" />
              <span className="text-sm font-medium text-success-800">
                {acceptedFiles[0].name}
              </span>
              <span className="ml-2 text-xs text-success-600">
                ({(acceptedFiles[0].size / 1024).toFixed(1)} KB)
              </span>
            </div>
          </div>
        </div>
      )}
      
      {fileRejections.length > 0 && (
        <div className="mt-4 p-4 bg-danger-50 border border-danger-200 rounded-lg">
          <div className="flex items-start">
            <X className="h-5 w-5 text-danger-600 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-danger-800">File rejected</p>
              <p className="text-xs text-danger-600 mt-1">
                {fileRejections[0].errors[0].message}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResumeUpload;