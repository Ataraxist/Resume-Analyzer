import yaml from 'js-yaml';
import { extractTextFromFile } from '../utils/extractTextFromFile.js';
import generateYAMLWithAI from '../utils/convertTextToYAML.js';
import YAMLModel from '../models/YAMLModel.js';

class ResumeProcessingService {
  constructor() {
    this.supportedFormats = [
      'application/pdf',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
  }

  validateFileFormat(mimetype) {
    if (!this.supportedFormats.includes(mimetype)) {
      throw new Error('Unsupported file format. Please upload a PDF, text, or Word document.');
    }
  }

  async processResumeFile(buffer, mimetype) {
    try {
      this.validateFileFormat(mimetype);
      
      const extractedText = await extractTextFromFile(buffer, mimetype);
      const yamlData = await generateYAMLWithAI(extractedText);
      
      console.log("✅ AI-Generated YAML:", yamlData);
      
      const yamlString = yaml.dump(yamlData);
      
      return {
        yamlData,
        yamlString,
        extractedText
      };
    } catch (error) {
      console.error("❌ Error in processResumeFile:", error);
      throw error;
    }
  }

  async processResumeText(resumeText) {
    try {
      const yamlData = await generateYAMLWithAI(resumeText);
      console.log("✅ AI-Generated YAML from text:", yamlData);
      return yamlData;
    } catch (error) {
      console.error("❌ Error processing resume text:", error);
      throw error;
    }
  }

  async saveResumeData(yamlData) {
    try {
      return await YAMLModel.create(yamlData);
    } catch (error) {
      console.error("❌ Error saving resume data:", error);
      throw error;
    }
  }

  parseResumeData(yamlResume) {
    return {
      personalInformation: {
        personalInformation: yamlResume.personal_information,
        availability: yamlResume.availability,
        salaryExpectations: yamlResume.salary_expectations,
        workPreferences: yamlResume.work_preferences,
      },
      educationDetails: yamlResume.education_details,
      experienceDetails: yamlResume.experience_details,
      showcaseDetails: {
        projects: yamlResume.projects,
        achievements: yamlResume.achievements,
        certifications: yamlResume.certifications,
        languages: yamlResume.languages,
        interests: yamlResume.interests,
      },
      selfIdentification: yamlResume.self_identification,
      legalAuthorization: yamlResume.legal_authorization,
    };
  }
}

export default new ResumeProcessingService();