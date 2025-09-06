import axios from 'axios';

class GoogleDocsService {
    /**
     * Validates if the URL is a valid Google Docs or Google Drive URL
     */
    validateUrl(url) {
        const patterns = [
            /^https:\/\/docs\.google\.com\/document\/d\/([a-zA-Z0-9-_]+)/,
            /^https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9-_]+)/
        ];
        
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) {
                return { valid: true, documentId: match[1] };
            }
        }
        
        return { valid: false, documentId: null };
    }
    
    /**
     * Converts a Google Docs sharing URL to an export URL
     */
    getExportUrl(documentId, format = 'pdf') {
        // We can export as txt, pdf, docx, etc.
        // pdf preserves headers/footers, txt does not
        return `https://docs.google.com/document/d/${documentId}/export?format=${format}`;
    }
    
    /**
     * Fetches the document content from Google Docs
     */
    async fetchDocument(url) {
        try {
            // Validate the URL
            const validation = this.validateUrl(url);
            if (!validation.valid) {
                throw new Error('Invalid Google Docs URL. Please provide a valid Google Docs or Google Drive link.');
            }
            
            // Try to fetch as PDF first (preserves headers/footers)
            const pdfUrl = this.getExportUrl(validation.documentId, 'pdf');
            
            try {
                const pdfResponse = await axios.get(pdfUrl, {
                    timeout: 30000, // 30 second timeout
                    maxContentLength: 10 * 1024 * 1024, // 10MB max
                    responseType: 'arraybuffer',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                
                return {
                    success: true,
                    buffer: Buffer.from(pdfResponse.data),
                    documentId: validation.documentId,
                    format: 'pdf',
                    mimeType: 'application/pdf'
                };
                
            } catch (error) {
                // If PDF export fails, check if document is accessible
                if (error.response?.status === 403 || error.response?.status === 404) {
                    throw new Error('Document is not publicly accessible. Please ensure the document is shared with "Anyone with the link can view".');
                }
                
                // Try alternative approach with text format (won't have headers/footers)
                const textUrl = this.getExportUrl(validation.documentId, 'txt');
                const textResponse = await axios.get(textUrl, {
                    timeout: 30000,
                    maxContentLength: 10 * 1024 * 1024,
                    responseType: 'text',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                
                if (textResponse.data && typeof textResponse.data === 'string') {
                    console.warn('Using TXT export fallback - headers/footers may be missing');
                    return {
                        success: true,
                        text: textResponse.data,
                        documentId: validation.documentId,
                        format: 'txt'
                    };
                }
                
                throw new Error('Document content is empty');
            }
            
        } catch (error) {
            console.error('Error fetching Google Docs document:', error);
            
            // Provide user-friendly error messages
            if (error.message.includes('not publicly accessible')) {
                throw error;
            } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
                throw new Error('Request timed out. Please check your internet connection and try again.');
            } else if (error.response?.status === 404) {
                throw new Error('Document not found. Please check the URL and try again.');
            } else if (error.response?.status === 403) {
                throw new Error('Access denied. Please make sure the document is set to "Anyone with the link can view".');
            } else if (error.response?.status === 429) {
                throw new Error('Too many requests. Please wait a moment and try again.');
            } else {
                throw new Error(`Failed to fetch document: ${error.message}`);
            }
        }
    }
    
    /**
     * Extracts document metadata from the URL (optional enhancement)
     */
    async getDocumentMetadata(url) {
        const validation = this.validateUrl(url);
        if (!validation.valid) {
            return null;
        }
        
        return {
            documentId: validation.documentId,
            type: url.includes('docs.google.com') ? 'google-docs' : 'google-drive',
            url: url
        };
    }
}

// Create singleton instance
const googleDocsService = new GoogleDocsService();
export default googleDocsService;