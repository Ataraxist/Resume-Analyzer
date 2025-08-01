import { useState, useCallback } from 'react';

const useFileUpload = () => {
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const resetUpload = useCallback(() => {
    setFile(null);
    setFileType(null);
    setFileUrl(null);
    setResumeText('');
    setUploadError(null);
    setIsUploading(false);
  }, []);

  const handleFileUpload = useCallback((uploadedFile) => {
    if (!uploadedFile) {
      setUploadError('No file selected');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    
    try {
      console.log(`Uploading file: ${uploadedFile.name}`);
      
      // Reset previous data
      setFile(uploadedFile);
      setFileUrl(null);
      setResumeText('');

      if (uploadedFile.type === 'application/pdf') {
        const url = URL.createObjectURL(uploadedFile);
        setFileUrl(url);
        setFileType('pdf');
      } else if (uploadedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        setFileType('docx');
      } else if (uploadedFile.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = (e) => {
          setResumeText(e.target.result);
          setFileType('text');
          setIsUploading(false);
        };
        reader.onerror = () => {
          setUploadError('Failed to read file');
          setIsUploading(false);
        };
        reader.readAsText(uploadedFile);
        return; // Early return for text files
      } else {
        throw new Error('Unsupported file type. Please upload a PDF, Word document, or text file.');
      }

      setIsUploading(false);
    } catch (error) {
      setUploadError(error.message);
      setIsUploading(false);
    }
  }, []);

  const handleTextInput = useCallback((text) => {
    if (!text || text.trim().length === 0) {
      setUploadError('Resume text cannot be empty');
      return;
    }

    if (text.length < 50) {
      setUploadError('Resume text is too short. Please provide more detailed information.');
      return;
    }

    setResumeText(text);
    setFile(null);
    setFileUrl(null);
    setFileType('text');
    setUploadError(null);
  }, []);

  // Cleanup file URL when component unmounts or file changes
  const cleanupFileUrl = useCallback(() => {
    if (fileUrl) {
      URL.revokeObjectURL(fileUrl);
    }
  }, [fileUrl]);

  return {
    file,
    fileType,
    fileUrl,
    resumeText,
    isUploading,
    uploadError,
    handleFileUpload,
    handleTextInput,
    resetUpload,
    cleanupFileUrl,
    hasFile: !!(file || resumeText),
  };
};

export default useFileUpload;