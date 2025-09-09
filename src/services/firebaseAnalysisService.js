import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit
} from 'firebase/firestore';
import { db } from '../config/firebase';
import FirebaseFunctionsFactory from './firebaseFunctionsFactory';

class FirebaseAnalysisService {
  constructor() {
    this.collectionName = 'analyses';
  }

  // Analyze resume against occupation with real-time streaming
  async analyzeResumeWithStream(resumeId, occupationCode, onUpdate) {
    try {
      // Get the callable function from the factory
      const analyzeResumeFunction = FirebaseFunctionsFactory.getCallable('analyzeResumeFunction');
      
      
      // Generate a unique request ID for idempotency
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      
      
      // Use streaming directly - no fallbacks
      const { stream, data: dataPromise } = await analyzeResumeFunction.stream({ 
        resumeId, 
        occupationCode,
        requestId // Include request ID for idempotency
      });
      
      let analysisId = null;
      
      // Process stream chunks
      for await (const chunk of stream) {
        // Extract analysisId from the first chunk
        if (chunk.analysisId && !analysisId) {
          analysisId = chunk.analysisId;
        }
        
        // Pass chunk to callback
        if (onUpdate) {
          onUpdate(chunk);
        }
      }
      
      // Wait for final result
      const finalResult = await dataPromise;
      
      
      return {
        success: true,
        analysisId: analysisId || finalResult.analysisId,
        analysis: finalResult
      };
    } catch (error) {
      // Handle specific error codes
      if (error.code === 'functions/resource-exhausted') {
        throw new Error('Insufficient credits. Please purchase more credits to continue.');
      } else if (error.code === 'functions/not-found') {
        throw new Error('Resume or occupation not found.');
      } else if (error.code === 'functions/unauthenticated') {
        throw new Error('Please log in to analyze resumes.');
      }
      
      throw error;
    }
  }

  // Single analyze method using streaming
  async analyzeResume(resumeId, occupationCode, onUpdate) {
    return this.analyzeResumeWithStream(resumeId, occupationCode, onUpdate);
  }

  // Get all analyses for current user
  async getUserAnalyses(userId) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const analyses = [];
      
      snapshot.forEach((doc) => {
        analyses.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return analyses;
    } catch (error) {
      throw error;
    }
  }

  // Get analyses for a specific resume
  async getResumeAnalyses(resumeId) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('resumeId', '==', resumeId),
        orderBy('overallFitScore', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const analyses = [];
      
      snapshot.forEach((doc) => {
        analyses.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return analyses;
    } catch (error) {
      throw error;
    }
  }

  // Get single analysis by ID
  async getAnalysisById(analysisId) {
    try {
      const docRef = doc(db, this.collectionName, analysisId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      } else {
        throw new Error('Analysis not found');
      }
    } catch (error) {
      throw error;
    }
  }

  // Get top matches for a resume
  async getTopMatches(resumeId, limitCount = 5) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('resumeId', '==', resumeId),
        orderBy('overallFitScore', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      const matches = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        matches.push({
          id: doc.id,
          occupationCode: data.occupationCode,
          occupationTitle: data.occupationTitle,
          score: data.overallFitScore,
          fitCategory: data.fitCategory,
          ...data
        });
      });
      
      return matches;
    } catch (error) {
      throw error;
    }
  }

  // Delete analysis
  async deleteAnalysis(analysisId, userId) {
    try {
      // Get analysis to check ownership
      const analysisDoc = await this.getAnalysisById(analysisId);
      
      if (analysisDoc.userId !== userId) {
        throw new Error('Unauthorized to delete this analysis');
      }
      
      // Delete from Firestore
      await deleteDoc(doc(db, this.collectionName, analysisId));
      
      return { success: true, message: 'Analysis deleted successfully' };
    } catch (error) {
      throw error;
    }
  }

  // Get recent analyses
  async getRecentAnalyses(userId, limitCount = 10) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      const analyses = [];
      
      snapshot.forEach((doc) => {
        analyses.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return analyses;
    } catch (error) {
      throw error;
    }
  }


  // Get analysis statistics for user
  async getUserStatistics(userId) {
    try {
      const analyses = await this.getUserAnalyses(userId);
      
      if (analyses.length === 0) {
        return {
          totalAnalyses: 0,
          averageScore: 0,
          topOccupation: null,
          scoreDistribution: {}
        };
      }
      
      // Calculate statistics
      const totalScore = analyses.reduce((sum, a) => sum + (a.overallFitScore || 0), 0);
      const averageScore = Math.round(totalScore / analyses.length);
      
      // Find top occupation
      const occupationCounts = {};
      analyses.forEach(a => {
        if (a.occupationTitle) {
          occupationCounts[a.occupationTitle] = (occupationCounts[a.occupationTitle] || 0) + 1;
        }
      });
      
      const topOccupation = Object.entries(occupationCounts)
        .sort((a, b) => b[1] - a[1])[0];
      
      // Score distribution
      const scoreDistribution = {
        excellent: analyses.filter(a => a.overallFitScore >= 85).length,
        strong: analyses.filter(a => a.overallFitScore >= 70 && a.overallFitScore < 85).length,
        good: analyses.filter(a => a.overallFitScore >= 55 && a.overallFitScore < 70).length,
        moderate: analyses.filter(a => a.overallFitScore >= 40 && a.overallFitScore < 55).length,
        developing: analyses.filter(a => a.overallFitScore < 40).length
      };
      
      return {
        totalAnalyses: analyses.length,
        averageScore,
        topOccupation: topOccupation ? topOccupation[0] : null,
        scoreDistribution
      };
    } catch (error) {
      throw error;
    }
  }
}

export default new FirebaseAnalysisService();