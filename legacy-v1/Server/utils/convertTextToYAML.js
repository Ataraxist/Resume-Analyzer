import OpenAI from 'openai';
import dotenv from 'dotenv';
import YAMLModel from '../models/YAMLModel.js';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.YAML_KEY,
});


export const generateYAMLWithAI = async (resumeText) => {
  // console.log(resumeText)

  const systemMessage = `
You are an expert at structuring resumes into YAML format. Given the following resume text, extract structured data and return it in JSON format.

### **Output Format:**
The JSON must strictly follow this schema:
personal_information:
{
    personal_information: {
      name: String,
      surname: String,
      date_of_birth: String,
      country: String,
      city: String,
      address: String,
      zip_code: String,
      phone_prefix: String,
      phone: String,
      email: String,
      github: String,
      linkedin: String,
    },
    education_details: [
      {
        education_level: String,
        institution: String,
        field_of_study: String,
        final_evaluation_grade: String,
        start_date: String,
        year_of_completion: String,
      },
    ],
    experience_details: [
      {
        position: String,
        company: String,
        employment_period: String,
        location: String,
        industry: String,
        key_responsibilities: [String],
        skills_acquired: [String],
      },
    ],
    projects: [
      {
        name: String,
        description: String,
        link: String,
      },
    ],
    achievements: [
      {
        name: String,
        description: String,
      },
    ],
    certifications: [
      {
        name: String,
        description: String,
      },
    ],
    languages: [
      {
        language: String,
        proficiency: String,
      },
    ],
    interests: [String],
    availability: {
      notice_period: String,
    },
    salary_expectations: {
      salary_range_usd: String,
    },
    self_identification: {
      gender: String,
      pronouns: String,
      veteran: String,
      disability: String,
      ethnicity: String,
    },
    legal_authorization: {
      eu_work_authorization: String,
      us_work_authorization: String,
      requires_us_visa: String,
      requires_us_sponsorship: String,
      requires_eu_visa: String,
      legally_allowed_to_work_in_eu: String,
      legally_allowed_to_work_in_us: String,
      requires_eu_sponsorship: String,
      canada_work_authorization: String,
      requires_canada_visa: String,
      legally_allowed_to_work_in_canada: String,
      requires_canada_sponsorship: String,
      uk_work_authorization: String,
      requires_uk_visa: String,
      legally_allowed_to_work_in_uk: String,
      requires_uk_sponsorship: String,
    },
    work_preferences: { 
      remote_work: String,
      in_person_work: String,
      open_to_relocation: String,
      willing_to_complete_assessments: String,
      willing_to_undergo_drug_tests: String,
      willing_to_undergo_background_checks: String,
    },
  },
## **Rules:**
1. **Arrays of objects must not be strings.** 
   - Wrong → "achievements": "BSA Eagle Scout"
   - Correct → "achievements": [{ "name": "BSA Eagle Scout", "description": "" }]

2. **All fields must conform to the expected data types.**
3. **Remove any markdown formatting (\`\`\`, JSON, \`\`\`) from the response.**
4. **Return only valid JSON. Do not include explanations.**
  `;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo', // ✅ Latest model with tool calling support
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: resumeText },
      ],
      // tools: [
      //   {
      //     type: 'function',
      //     function: {
      //       name: 'enforce_yaml_schema',
      //       description:
      //         'Validates and ensures schema constraints on the extracted resume data.',
      //       parameters: {
      //         type: 'object',
      //         properties: {
      //           yamlData: {
      //             type: 'object',
      //             description:
      //               'Structured resume data following the predefined schema.',
      //           },
      //         },
      //         required: ['yamlData'],
      //       },
      //     },
      //   },
      // ],
      // tool_choice: 'required',
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    // Debugging: Log the full API response
    console.log('📝 Full API Response:', response.choices[0].message.content);

    // Ensure AI response is in JSON format
    const parsedResponse = response.choices[0].message.content;

    // console.log('✅ AI Generated YAML Data:', parsedResponse);

    return parsedResponse;
  } catch (error) {
    console.error('❌ Error generating YAML with AI:', error);
    throw new Error('Failed to generate YAML from AI.');
  }
};

export default generateYAMLWithAI;
