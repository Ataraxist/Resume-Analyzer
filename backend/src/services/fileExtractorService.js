import pdfParse from 'pdf-parse-fork';
import mammoth from 'mammoth';

class FileExtractorService {
    constructor() {
        this.supportedFormats = {
            'application/pdf': this.extractFromPDF,
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': this.extractFromDOCX,
            'text/plain': this.extractFromText
        };
    }

    async extractText(buffer, mimeType) {
        const extractor = this.supportedFormats[mimeType];
        
        if (!extractor) {
            throw new Error(`Unsupported file format: ${mimeType}`);
        }

        try {
            const text = await extractor.call(this, buffer);
            return this.cleanText(text);
        } catch (error) {
            console.error(`Error extracting text from ${mimeType}:`, error);
            throw new Error(`Failed to extract text: ${error.message}`);
        }
    }

    async extractFromPDF(buffer) {
        try {
            const data = await pdfParse(buffer);
            return data.text;
        } catch (error) {
            console.error('PDF extraction error:', error);
            throw new Error('Failed to extract text from PDF');
        }
    }

    async extractFromDOCX(buffer) {
        try {
            const result = await mammoth.extractRawText({ buffer });
            return result.value;
        } catch (error) {
            console.error('DOCX extraction error:', error);
            throw new Error('Failed to extract text from DOCX');
        }
    }

    async extractFromText(buffer) {
        return buffer.toString('utf-8');
    }

    cleanText(text) {
        // Remove excessive whitespace and clean up the text
        return text
            .replace(/\r\n/g, '\n')  // Normalize line endings
            .replace(/\n{3,}/g, '\n\n')  // Remove excessive line breaks
            .replace(/\t+/g, ' ')  // Replace tabs with spaces
            .replace(/ {2,}/g, ' ')  // Remove excessive spaces
            .trim();
    }

    getSupportedFormats() {
        return Object.keys(this.supportedFormats);
    }

    isFormatSupported(mimeType) {
        return mimeType in this.supportedFormats;
    }
}

// Create singleton instance
const fileExtractorService = new FileExtractorService();
export default fileExtractorService;