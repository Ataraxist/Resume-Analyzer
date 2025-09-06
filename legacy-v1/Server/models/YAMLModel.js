import mongoose from "mongoose";
import dotenv from 'dotenv'
dotenv.config()


mongoose.connect('mongodb+srv://hayashi3386:analyzer@cluster33.xhn1r.mongodb.net/?retryWrites=true&w=majority&appName=Cluster33', {})

const yamlSchema = new mongoose.Schema(
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
  { timestamps: true }
);

const YAMLModel = mongoose.model("YAMLData", yamlSchema);

export default YAMLModel;
