class JobAnalysisService {
  parseJobData(jobQueryData) {
    return {
      jobInformation: {
        code: jobQueryData.code,
        title: jobQueryData.main.title,
        description: jobQueryData.main.description,
        sampleTitles: jobQueryData.main.sample_of_reported_titles,
        brightOutlook: jobQueryData.main.bright_outlook,
        jobZone: jobQueryData.job_zone,
        apprenticeship: jobQueryData.apprenticeship,
      },
      workDetails: {
        tasks: jobQueryData.tasks.task.map((task) => task.title),
        activities: jobQueryData.detailed_work_activities.activity.map(
          (activity) => activity.title
        ),
      },
      skillsAndTools: {
        technologySkills: jobQueryData.technology_skills.category.flatMap(
          (category) => category.example.map((example) => example.title)
        ),
        toolsUsed: jobQueryData.tools_used.category.flatMap((tool) => tool.example),
      },
      professionalAssociations: jobQueryData.professional_associations.source.map(
        (association) => ({
          name: association.name,
          url: association.url,
        })
      ),
      interests: jobQueryData.interests.element.map((interest) => ({
        name: interest.name,
        description: interest.description,
      })),
    };
  }

  buildComparisonSections(resumeData, jobData) {
    const { personalInformation, educationDetails, experienceDetails, showcaseDetails } = resumeData;
    const { jobInformation, workDetails, skillsAndTools, professionalAssociations, interests } = jobData;

    return {
      experienceDetails: {
        yaml: experienceDetails,
        job: workDetails,
        prompt: "Compare the experience listed in this resume to the job's tasks and responsibilities. Highlight missing skills or qualifications.",
      },
      skillsAndTools: {
        yaml: experienceDetails,
        job: {
          technologySkills: skillsAndTools.technologySkills,
          sampleTitles: jobInformation.sampleTitles,
        },
        prompt: "Compare the candidate's skills to the required technologies for the job. What key skills are missing?",
      },
      professionalAssociations: {
        yaml: showcaseDetails.certifications,
        job: professionalAssociations,
        prompt: "Compare the candidate's certifications to the relevant professional associations in this job field. Highlight if additional certifications are recommended.",
      },
      interests: {
        yaml: showcaseDetails.interests,
        job: interests,
        prompt: "Compare the candidate's interests to the job's interests. How well does the candidate's passion align?",
      },
      jobZoneComparison: {
        yaml: {
          education: educationDetails,
          experience: experienceDetails,
        },
        job: jobInformation.jobZone,
        prompt: "Compare the candidate's education and experience to the job zone requirements. Identify any gaps in training or qualifications.",
      },
      relatedOccupations: {
        yaml: experienceDetails,
        job: jobData.main?.related_occupations || [],
        prompt: "If the candidate's experience does not fully align with the job requirements, suggest alternative related occupations they might be qualified for.",
      },
      inDemandTechnologies: {
        yaml: experienceDetails,
        job: skillsAndTools.technologySkills.filter(
          (skill) => skill.hot_technology === true
        ),
        prompt: "Compare the candidate's skills to the list of hot technologies in demand for this role. Identify key technologies they should learn to remain competitive.",
      },
      remainingInfo: {
        yaml: {
          personalInformation,
          selfIdentification: resumeData.selfIdentification,
          legalAuthorization: resumeData.legalAuthorization,
        },
        job: jobInformation,
        prompt: 'Review the remaining information for the candidate, compare their self identification, legal authorization, and personal information to the job description. Highlight any discrepancies that might exist.',
      },
    };
  }

  validateComparisonData(section, data) {
    if (!data.yaml || !data.job || data.yaml.length === 0 || data.job.length === 0) {
      console.warn(`Skipping ${section}: Missing relevant data`);
      return false;
    }
    return true;
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

export default new JobAnalysisService();