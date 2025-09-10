import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  deleteDoc,
  updateDoc,
  serverTimestamp, 
  query, 
  where, 
  orderBy, 
  limit
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import FirebaseFunctionsFactory from './firebaseFunctionsFactory';

class FirebaseResumeService {
  constructor() {
    this.collectionName = 'resumes';
    this.storageFolder = 'resumes';
  }

  // Process resume with streaming support
  async processResumeWithStream(inputType, data, onChunk) {
    try {
      // Get the callable function from the factory
      const resumeFunction = FirebaseFunctionsFactory.getCallable('resumeFunction');
      
      // Build request based on input type
      const requestData = {
        inputType,
        ...data
      };
      
      
      // Try to use streaming if available
      if (resumeFunction.stream) {
        try {
          // Call the function with streaming support
          const { stream, data: dataPromise } = await resumeFunction.stream(requestData);
          
          // Process stream chunks
          if (stream) {
            for await (const chunk of stream) {
              if (onChunk) {
                onChunk(chunk);
              }
            }
          }
          
          // Wait for and return final data
          const finalResult = await dataPromise;
          
          return {
            success: true,
            resumeId: finalResult.resumeId,
            structuredData: finalResult.structuredData
          };
        } catch (streamError) {
          console.warn('Streaming not supported, falling back to regular call:', streamError.message);
          // Fall through to regular call if streaming not supported
        }
      }
      
      // Fallback to regular call if streaming not available
      const response = await resumeFunction(requestData);
      const result = response.data;
      
      return {
        success: true,
        resumeId: result.resumeId,
        structuredData: result.structuredData
      };
    } catch (error) {
      // Enhance error message for better user feedback
      if (error.code === 'functions/deadline-exceeded') {
        error.message = 'Resume processing is taking longer than expected. Please try again.';
      } else if (error.code === 'functions/unavailable') {
        error.message = 'Resume service is temporarily unavailable. Please try again in a few moments.';
      } else if (error.code === 'functions/internal') {
        error.message = 'An error occurred while processing your resume. Please try again.';
      }
      throw error;
    }
  }


  // Upload resume file to Storage then process with streaming
  async uploadResume(file, userId, onChunk) {
    try {
      // Create a reference to the file in Storage
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `${this.storageFolder}/${userId}/${fileName}`;
      const storageRef = ref(storage, filePath);
      
      // Upload the file
      const snapshot = await uploadBytes(storageRef, file);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Process with streaming
      const result = await this.processResumeWithStream('file', {
        filePath,
        fileName
      }, onChunk);
      
      return {
        ...result,
        downloadURL,
        message: 'Resume uploaded and processed successfully'
      };
    } catch (error) {
      // Enhance error message for better user feedback
      if (error.code === 'functions/deadline-exceeded') {
        error.message = 'Resume processing is taking longer than expected. Please try again.';
      } else if (error.code === 'functions/unavailable') {
        error.message = 'Resume service is temporarily unavailable. Please try again in a few moments.';
      } else if (error.code === 'functions/internal') {
        error.message = 'An error occurred while processing your resume. Please try again.';
      }
      throw error;
    }
  }

  // Parse resume text directly with streaming
  async parseResumeText(resumeText, fileName = 'Direct Input', onChunk) {
    try {
      const result = await this.processResumeWithStream('text', {
        resumeText,
        fileName
      }, onChunk);
      
      return result;
    } catch (error) {
      // Enhance error message for better user feedback
      if (error.code === 'functions/deadline-exceeded') {
        error.message = 'Resume processing is taking longer than expected. Please try again.';
      } else if (error.code === 'functions/unavailable') {
        error.message = 'Resume service is temporarily unavailable. Please try again in a few moments.';
      } else if (error.code === 'functions/internal') {
        error.message = 'An error occurred while processing your resume. Please try again.';
      }
      throw error;
    }
  }

  // Import from Google Docs with streaming
  async importFromGoogleDocs(documentId, accessToken, onChunk) {
    try {
      const result = await this.processResumeWithStream('google_docs', {
        documentId,
        accessToken
      }, onChunk);
      
      return result;
    } catch (error) {
      // Enhance error message for better user feedback
      if (error.code === 'functions/deadline-exceeded') {
        error.message = 'Resume processing is taking longer than expected. Please try again.';
      } else if (error.code === 'functions/unavailable') {
        error.message = 'Resume service is temporarily unavailable. Please try again in a few moments.';
      } else if (error.code === 'functions/internal') {
        error.message = 'An error occurred while processing your resume. Please try again.';
      }
      throw error;
    }
  }

  // Get user's resumes
  async getUserResumes(userId) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const resumes = [];
      
      snapshot.forEach((doc) => {
        resumes.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return resumes;
    } catch (error) {
      // Enhance error message for better user feedback
      if (error.code === 'functions/deadline-exceeded') {
        error.message = 'Resume processing is taking longer than expected. Please try again.';
      } else if (error.code === 'functions/unavailable') {
        error.message = 'Resume service is temporarily unavailable. Please try again in a few moments.';
      } else if (error.code === 'functions/internal') {
        error.message = 'An error occurred while processing your resume. Please try again.';
      }
      throw error;
    }
  }

  // Get single resume by ID
  async getResumeById(resumeId) {
    try {
      const docRef = doc(db, this.collectionName, resumeId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      } else {
        throw new Error('Resume not found');
      }
    } catch (error) {
      // Enhance error message for better user feedback
      if (error.code === 'functions/deadline-exceeded') {
        error.message = 'Resume processing is taking longer than expected. Please try again.';
      } else if (error.code === 'functions/unavailable') {
        error.message = 'Resume service is temporarily unavailable. Please try again in a few moments.';
      } else if (error.code === 'functions/internal') {
        error.message = 'An error occurred while processing your resume. Please try again.';
      }
      throw error;
    }
  }

  // Update resume structured data
  async updateResume(resumeId, userId, structuredData) {
    try {
      // Get the resume to check ownership
      const resumeDoc = await this.getResumeById(resumeId);
      
      // Check ownership
      if (resumeDoc.userId !== userId) {
        throw new Error('Unauthorized to update this resume');
      }
      
      // Update the resume with new structured data
      const docRef = doc(db, this.collectionName, resumeId);
      await updateDoc(docRef, {
        structuredData,
        updatedAt: serverTimestamp()
      });
      
      return { success: true, message: 'Resume updated successfully' };
    } catch (error) {
      // Enhance error message for better user feedback
      if (error.code === 'functions/deadline-exceeded') {
        error.message = 'Resume processing is taking longer than expected. Please try again.';
      } else if (error.code === 'functions/unavailable') {
        error.message = 'Resume service is temporarily unavailable. Please try again in a few moments.';
      } else if (error.code === 'functions/internal') {
        error.message = 'An error occurred while processing your resume. Please try again.';
      }
      throw error;
    }
  }

  // Delete resume
  async deleteResume(resumeId, userId) {
    try {
      // Get the resume to check ownership and get file path
      const resumeDoc = await this.getResumeById(resumeId);
      
      // Check ownership
      if (resumeDoc.userId !== userId) {
        throw new Error('Unauthorized to delete this resume');
      }
      
      // Delete from Firestore
      await deleteDoc(doc(db, this.collectionName, resumeId));
      
      // If there's a file in storage, delete it
      if (resumeDoc.filePath) {
        const storageRef = ref(storage, resumeDoc.filePath);
        try {
          await deleteObject(storageRef);
        } catch (storageError) {
          console.error('Could not delete file from storage:', storageError);
        }
      }
      
      return { success: true, message: 'Resume deleted successfully' };
    } catch (error) {
      // Enhance error message for better user feedback
      if (error.code === 'functions/deadline-exceeded') {
        error.message = 'Resume processing is taking longer than expected. Please try again.';
      } else if (error.code === 'functions/unavailable') {
        error.message = 'Resume service is temporarily unavailable. Please try again in a few moments.';
      } else if (error.code === 'functions/internal') {
        error.message = 'An error occurred while processing your resume. Please try again.';
      }
      throw error;
    }
  }

  // Search resumes
  async searchResumes(userId, searchTerm) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const resumes = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Simple client-side filtering
        if (searchTerm) {
          const search = searchTerm.toLowerCase();
          const matches = 
            data.fileName?.toLowerCase().includes(search) ||
            data.structuredData?.personal?.name?.toLowerCase().includes(search) ||
            data.structuredData?.summary?.toLowerCase().includes(search);
          
          if (matches) {
            resumes.push({
              id: doc.id,
              ...data
            });
          }
        } else {
          resumes.push({
            id: doc.id,
            ...data
          });
        }
      });
      
      return resumes;
    } catch (error) {
      // Enhance error message for better user feedback
      if (error.code === 'functions/deadline-exceeded') {
        error.message = 'Resume processing is taking longer than expected. Please try again.';
      } else if (error.code === 'functions/unavailable') {
        error.message = 'Resume service is temporarily unavailable. Please try again in a few moments.';
      } else if (error.code === 'functions/internal') {
        error.message = 'An error occurred while processing your resume. Please try again.';
      }
      throw error;
    }
  }

  // Get recent resumes
  async getRecentResumes(userId, limitCount = 5) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      const resumes = [];
      
      snapshot.forEach((doc) => {
        resumes.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return resumes;
    } catch (error) {
      // Enhance error message for better user feedback
      if (error.code === 'functions/deadline-exceeded') {
        error.message = 'Resume processing is taking longer than expected. Please try again.';
      } else if (error.code === 'functions/unavailable') {
        error.message = 'Resume service is temporarily unavailable. Please try again in a few moments.';
      } else if (error.code === 'functions/internal') {
        error.message = 'An error occurred while processing your resume. Please try again.';
      }
      throw error;
    }
  }
}

export default new FirebaseResumeService();