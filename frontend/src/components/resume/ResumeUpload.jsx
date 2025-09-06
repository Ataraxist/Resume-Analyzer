import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X } from 'lucide-react';

function ResumeUpload({ onUpload }) {
  const onDrop = useCallback((acceptedFiles) => {
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
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 1
  });
  
  return (
    <div>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive 
            ? 'border-primary-500 bg-primary-50' 
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center">
          <div className={`p-4 rounded-full mb-4 ${
            isDragActive ? 'bg-primary-100' : 'bg-gray-100'
          }`}>
            <Upload className={`h-8 w-8 ${
              isDragActive ? 'text-primary-600' : 'text-gray-400'
            }`} />
          </div>
          
          <p className="text-lg font-medium text-gray-900 mb-2">
            {isDragActive ? 'Drop your resume here' : 'Drag & drop your resume'}
          </p>
          
          <p className="text-sm text-gray-600 mb-4">
            or <span className="text-primary-600 font-medium">browse files</span>
          </p>
          
          <p className="text-xs text-gray-500">
            Supported formats: PDF, DOCX, TXT (Max 10MB)
          </p>
        </div>
      </div>
      
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