# Resume Analyzer

AI-powered resume analysis against O*NET job requirements.

## What It Does

Upload a resume → Select a job → Get AI-powered feedback across O*NET job dimensions.

## O*NET-Centric MVP Implementation Plan

### Core Architecture
- **Backend**: Node.js/Express (simple, no TypeScript needed)
- **Caching**: SQLite for O*NET data (simple, file-based)
- **Frontend**: React with clean UI for results display

### Implementation Phases

**Phase 1: O*NET Integration (Day 1-2)**
- Set up O*NET API client with credentials
- Fetch occupation list (~1000 jobs)
- Implement parallel fetching for job details:
  - Tasks, Technology Skills, Tools Used
  - Work Activities, Knowledge, Skills
  - Abilities, Education requirements
- Cache everything in SQLite after fetch

**Phase 2: Resume Processing & Structured Extraction (Day 2-3)**
- File upload (PDF, DOCX, TXT)
- Text extraction from documents
- AI-powered parsing to structured format:
  - Personal information (contact details)
  - Work experiences (companies, roles, responsibilities, achievements)
  - Skills (technical, soft skills, tools, languages)
  - Education (degrees, institutions, dates, GPA)
  - Projects (descriptions, technologies used)
  - Certifications & awards
- Store structured data mapped to O*NET dimensions:
  - Experience → Tasks, Work Activities
  - Skills → Skills, Technology Skills, Tools Used
  - Education → Education Requirements, Job Zone
  - Projects → Technology Skills, Tasks

**Phase 3: Dimension-by-Dimension Analysis Engine (Day 3-4)**
- User selects specific O*NET occupation (e.g., Software Developer)
- Fetch complete O*NET data for occupation (150+ data points)
- Run focused AI comparisons per dimension:
  - Compare resume.experience → onet.tasks (20+ tasks)
  - Compare resume.skills → onet.skills (50+ skills)
  - Compare resume.education → onet.education_requirements
  - Compare resume.skills → onet.technology_skills (10-20 tools)
  - Compare resume.experience → onet.work_activities (20+ activities)
  - Compare resume.knowledge → onet.knowledge (30+ areas)
  - Compare resume.abilities → onet.abilities (20+ abilities)
- Generate specific feedback per dimension:
  - Individual scores for each O*NET data point
  - Specific gaps identified (e.g., "Missing: AWS, Docker, Kubernetes")
  - Actionable recommendations per category
  - Overall fit percentage
- Return structured analysis with 1 score per O*NET dimension

**Phase 4: Frontend (Day 4-5)**
- O*NET job search/selection
- Resume upload
- Results display with:
  - Score for each O*NET dimension
  - Specific feedback per category
  - Overall fit assessment
  - Recommendations for improvement

### What Makes This Valuable
- Uses real O*NET job taxonomy (1000+ real jobs)
- Provides structured feedback across 7-8 professional dimensions
- Gives actionable insights based on actual job requirements
- Creates standardized assessments that mirror government job data

## Environment Variables

```env
OPENAI_API_KEY=your_key_here
ONET_USERNAME=your_username
ONET_PASSWORD=your_password
PORT=3000
```

## Quick Start

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```