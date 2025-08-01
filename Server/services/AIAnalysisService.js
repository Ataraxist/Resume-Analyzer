import OpenAI from 'openai';
import config from '../config/config.js';

class AIAnalysisService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey,
    });
  }

  async analyzeSingleSection(section, _, prompt) {
    console.log(`🔵 Sending request to OpenAI for section: ${section}`);

    try {
      const response = await this.openai.chat.completions.create({
        model: config.openai.model,
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant that compares resumes to job postings and provides structured feedback in JSON format.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: config.openai.temperature,
      });

      const rawResponse = response.choices?.[0]?.message?.content;
      console.log(`🟢 OpenAI Response for ${section}:`, rawResponse);

      let structuredFeedback;
      try {
        structuredFeedback = JSON.parse(rawResponse);
      } catch (jsonError) {
        console.error(`❌ Error parsing JSON response for ${section}:`, jsonError);
        structuredFeedback = {
          score: 0,
          body: 'Invalid JSON response from AI.',
        };
      }

      return { section, feedback: structuredFeedback };
    } catch (apiError) {
      console.error(`❌ OpenAI API error for section ${section}:`, apiError);
      return {
        section,
        feedback: { 
          score: 0, 
          body: 'OpenAI request failed. Please try again later.' 
        },
      };
    }
  }

  async analyzeAllSections(comparisonSections) {
    const apiCalls = Object.entries(comparisonSections).map(
      async ([section, data]) => {
        if (!data.yaml || !data.job || data.yaml.length === 0 || data.job.length === 0) {
          console.warn(`Skipping ${section}: Missing relevant data`);
          return {
            section,
            feedback: { score: 0, body: 'Skipped due to missing data.' },
          };
        }

        const prompt = this.buildAnalysisPrompt(section, data);
        return this.analyzeSingleSection(section, data, prompt);
      }
    );

    const results = await Promise.all(apiCalls);
    return Object.fromEntries(
      results.map(({ section, feedback }) => [section, feedback])
    );
  }

  buildAnalysisPrompt(section, data) {
    return `
      You are an AI resume evaluator. Your task is to compare the resume information to the job posting and provide **constructive feedback**.
      \n**Category: ${section.replace(/([A-Z])/g, ' $1').trim()}**
      \n**Resume Data:** ${JSON.stringify(data.yaml, null, 2)}
      \n**Job Data:** ${JSON.stringify(data.job, null, 2)}
      \n${data.prompt}
      \nReturn your response **strictly in the following JSON format**:
      {
        "score": 0-100,
        "body": "Detailed feedback here."
      }
    `;
  }
}

export default new AIAnalysisService();