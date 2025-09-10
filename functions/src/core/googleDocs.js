const axios = require('axios');
const { extractFromBuffer } = require('./extractor');

/**
 * Fetch text content from a Google Doc using export URL (no API key needed!)
 * Tries PDF first to preserve headers/footers, falls back to TXT if needed
 * @param {string} documentId - Google Doc ID
 * @param {string} accessToken - OAuth2 access token (not used in this implementation)
 * @returns {Promise<{text: string, title: string}>} - Document text and title
 */
async function fetchGoogleDoc(documentId, _accessToken = null) {
  try {
    // Try PDF export first (preserves headers/footers)
    const pdfUrl = `https://docs.google.com/document/d/${documentId}/export?format=pdf`;
    
    
    try {
      const pdfResponse = await axios.get(pdfUrl, {
        timeout: 30000, // 30 second timeout
        maxContentLength: 500 * 1024, // 500KB max
        responseType: 'arraybuffer',
        headers: {
          // Mimic browser to avoid potential blocking
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      // Convert PDF buffer to text using existing extractor
      const buffer = Buffer.from(pdfResponse.data);
      const text = await extractFromBuffer(buffer, 'document.pdf');
      
      
      return {
        text: text,
        title: 'Google Doc' // Can't get title without API, but that's OK
      };
      
    } catch {
      // Fall back to TXT export if PDF fails
      const txtUrl = `https://docs.google.com/document/d/${documentId}/export?format=txt`;
      
      const txtResponse = await axios.get(txtUrl, {
        timeout: 30000,
        maxContentLength: 10 * 1024 * 1024,
        responseType: 'text',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      // Check if we got any content
      if (!txtResponse.data || txtResponse.data.trim().length === 0) {
        throw new Error('No text found in Google Doc');
      }
      
      
      return {
        text: txtResponse.data,
        title: 'Google Doc'
      };
    }
    
  } catch (error) {
    // Provide user-friendly error messages
    if (error.response?.status === 403) {
      throw new Error('Document is not publicly accessible. Please ensure the document is shared with "Anyone with the link can view".');
    }
    if (error.response?.status === 404) {
      throw new Error('Google Doc not found. Please check the document ID.');
    }
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      throw new Error('Request timed out. Please try again.');
    }
    if (error.response?.status === 429) {
      throw new Error('Too many requests. Please wait a moment and try again.');
    }
    
    // Re-throw the original error if it's already one of our custom messages
    if (error.message?.includes('No text found')) {
      throw error;
    }
    
    // Generic error
    throw new Error(`Failed to fetch Google Doc: ${error.message}`);
  }
}

/**
 * Extract document ID from various Google Docs URL formats
 * @param {string} input - Google Docs URL or document ID
 * @returns {string} - Document ID
 */
function extractDocumentId(input) {
  // If it's already just an ID, return it
  if (!input.includes('/')) {
    return input;
  }

  // Extract from URL patterns:
  // https://docs.google.com/document/d/{id}/edit
  // https://docs.google.com/document/d/{id}/view
  // https://docs.google.com/document/d/{id}
  // https://drive.google.com/file/d/{id}/view
  const patterns = [
    /\/d\/([a-zA-Z0-9-_]+)/,  // Matches /d/{id}
    /^([a-zA-Z0-9-_]+)$/      // Matches just the ID
  ];
  
  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) {
      return match[1] || match[0];
    }
  }

  // If no pattern matches, assume it's already an ID
  return input;
}

module.exports = {
  fetchGoogleDoc,
  extractDocumentId
};