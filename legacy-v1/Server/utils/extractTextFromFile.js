import { PDFDocument } from "pdf-lib";
import mammoth from 'mammoth'


export const extractTextFromFile = async (fileBuffer, mimeType) => {
  if (mimeType === "application/pdf") {
    try {
      const pdfDoc = await PDFDocument.load(fileBuffer);
      const pages = pdfDoc.getPages();
      const text = pages.map((page) => page.getTextContent?.() || "").join("\n");
      return text;
    } catch (error) {
      console.error("Error extracting text from PDF:", error);
      throw new Error("Failed to extract text from PDF.");
    }
  }

  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const doc = await mammoth.extractRawText({ buffer: fileBuffer });
    return doc.value
  }
  if (mimeType === "text/plain"){
    return fileBuffer.toString("utf8");
  }

  throw new Error("Unsupported file format");
};
