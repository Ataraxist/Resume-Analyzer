const { HttpsError } = require('firebase-functions/v2/https');
const { getStorage } = require('firebase-admin/storage');
const { parseResumeWithStreaming } = require('./core/parser');
const { extractFromStorage } = require('./core/extractor');
const { fetchGoogleDoc, extractDocumentId } = require('./core/googleDocs');

/**
 * Unified resume processing function with Firebase v2 streaming support
 * Uses response.sendChunk() for real-time streaming to clients
 * 
 * @param {Object} request - Firebase Functions v2 request object
 * @param {Object} response - Firebase Functions v2 response object for streaming
 * @param {Object} request.data - Request data containing:
 *   @param {string} inputType - Type of input: 'text', 'file', or 'google_docs'
 *   @param {string} [resumeText] - Direct text input (for inputType='text')
 *   @param {string} [filePath] - Storage path (for inputType='file')
 *   @param {string} [documentId] - Google Doc ID or URL (for inputType='google_docs')
 *   @param {string} [accessToken] - OAuth token for Google Docs (optional)
 *   @param {string} [fileName] - Optional file name for the resume
 */
async function resume(request, response) {
  // Extract data and auth from the v2 request object
  const { data, auth } = request;
  
  // Check authentication
  if (!auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = auth.uid;
  const { 
    inputType, 
    resumeText, 
    filePath, 
    documentId, 
    accessToken, 
    fileName 
  } = data;

  // Validate input type
  if (!inputType || !['text', 'file', 'google_docs'].includes(inputType)) {
    throw new HttpsError('invalid-argument', 'Invalid input type. Must be "text", "file", or "google_docs"');
  }

  let textToParse = '';
  let finalFileName = fileName;
  let metadata = { source: inputType };
  
  // Validate fileName is provided when needed
  if (inputType === 'text' && !fileName) {
    throw new HttpsError('invalid-argument', 'fileName is required for text input');
  }

  try {
    // Handle different input types
    switch (inputType) {
      case 'text':
        // Direct text input
        if (!resumeText) {
          throw new HttpsError('invalid-argument', 'Resume text is required for text input');
        }
        textToParse = resumeText;
        finalFileName = fileName;
        metadata.source = 'direct_parse';
        break;

      case 'file':
        // File from Firebase Storage
        if (!filePath) {
          throw new HttpsError('invalid-argument', 'File path is required for file input');
        }
        
        // Extract text from file in storage
        textToParse = await extractFromStorage(filePath);
        
        // Use filename from path if not provided
        if (!fileName) {
          finalFileName = filePath.split('/').pop();
        }
        
        // Add file metadata
        const storage = getStorage();
        const bucketName = storage.bucket().name;
        
        metadata = {
          source: 'file_upload',
          filePath,
          fileUrl: `https://storage.googleapis.com/${bucketName}/${filePath}`,
          fileType: 'application/octet-stream'
        };
        break;

      case 'google_docs':
        // Google Docs import
        if (!documentId) {
          throw new HttpsError('invalid-argument', 'Document ID or URL is required for Google Docs input');
        }
        
        const docId = extractDocumentId(documentId);
        const docData = await fetchGoogleDoc(docId, accessToken);
        
        textToParse = docData.text;
        finalFileName = fileName || docData.title || 'Google Doc';
        
        metadata = {
          source: 'google_docs',
          documentId: docId,
          originalUrl: documentId,
          documentTitle: docData.title
        };
        break;

      default:
        throw new HttpsError('invalid-argument', `Unsupported input type: ${inputType}`);
    }

    // Validate that we have text to parse
    if (!textToParse || textToParse.trim().length === 0) {
      throw new HttpsError('invalid-argument', 'No text content found to parse');
    }

    console.log('Starting resume parsing with streaming');

    // Define the streaming callback that always sends chunks to the client
    const streamCallback = (chunkData) => {
      // Pass through the entire chunk without modifying it
      response.sendChunk(chunkData);
      console.log(`Sent chunk: ${chunkData.type} - ${chunkData.field || chunkData.category || ''}`);
    };

    // Parse the resume with streaming support
    const result = await parseResumeWithStreaming(
      textToParse,
      userId,
      finalFileName,
      metadata,
      streamCallback
    );

    // Return the final complete result
    return {
      resumeId: result.resumeId,
      structuredData: result.structuredData,
      processingStatus: result.processingStatus,
      message: 'Resume processed successfully'
    };

  } catch (error) {
    console.error('Resume processing error:', error);
    
    // Handle specific error types
    if (error instanceof HttpsError) {
      throw error;
    }
    
    if (error.message?.includes('OPENAI_API_KEY')) {
      throw new HttpsError('failed-precondition', 'OpenAI API key not configured. Please add OPENAI_API_KEY to .env file');
    }
    
    if (error.message?.includes('Google Docs API') || error.message?.includes('Google Docs access')) {
      throw new HttpsError('failed-precondition', 'Google Docs access requires the document to be publicly accessible.');
    }
    
    if (error.message?.includes('No text')) {
      throw new HttpsError('invalid-argument', error.message);
    }
    
    if (error.message?.includes('Google Doc')) {
      throw new HttpsError('invalid-argument', error.message);
    }
    
    if (error.message?.includes('Unsupported file type')) {
      throw new HttpsError('invalid-argument', error.message);
    }
    
    // Generic error
    throw new HttpsError('internal', `Resume processing failed: ${error.message}`);
  }
}

module.exports = { resume };