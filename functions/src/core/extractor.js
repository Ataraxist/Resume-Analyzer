const { getStorage } = require('firebase-admin/storage');
const pdf = require('pdf-parse/lib/pdf-parse.js');
const mammoth = require('mammoth');

const storage = getStorage();

/**
 * Extract text from a file in Firebase Storage
 * @param {string} filePath - Path to file in Storage (e.g., "resumes/userId/filename.pdf")
 * @returns {Promise<string>} - Extracted text
 */
async function extractFromStorage(filePath) {
  const bucket = storage.bucket();
  const file = bucket.file(filePath);
  
  // Download file from storage
  const [buffer] = await file.download();
  
  // Determine file type from path
  const fileName = filePath.split('/').pop();
  
  return extractFromBuffer(buffer, fileName);
}

/**
 * Extract text from a buffer based on file type
 * @param {Buffer} buffer - File buffer
 * @param {string} fileName - File name with extension
 * @returns {Promise<string>} - Extracted text
 */
async function extractFromBuffer(buffer, fileName) {
  let extractedText = '';
  
  if (fileName.toLowerCase().endsWith('.pdf')) {
    const pdfData = await pdf(buffer);
    extractedText = pdfData.text;
  } else if (fileName.toLowerCase().endsWith('.docx')) {
    const result = await mammoth.extractRawText({ buffer });
    extractedText = result.value;
  } else if (fileName.toLowerCase().endsWith('.txt')) {
    extractedText = buffer.toString('utf8');
  } else {
    throw new Error(`Unsupported file type: ${fileName}`);
  }
  
  if (!extractedText || extractedText.trim().length === 0) {
    throw new Error('No text could be extracted from file');
  }
  
  return extractedText;
}

module.exports = {
  extractFromStorage,
  extractFromBuffer
};