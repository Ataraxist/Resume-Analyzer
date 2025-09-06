# Resume Analyzer Frontend

A modern React dashboard for AI-powered resume analysis against O*NET job requirements.

## Features

### 📄 Resume Processing
- Drag-and-drop file upload (PDF, DOCX, TXT)
- Real-time processing status
- Structured data extraction and preview
- Automatic parsing of skills, experience, and education

### 🔍 Occupation Selection  
- Search from 1000+ O*NET occupations
- Popular occupations quick-select
- Detailed occupation information with tasks, skills, and requirements
- Smart autocomplete with debounced search

### 📊 Analysis Dashboard
- **Overall Fit Score**: Visual gauge showing 0-100% match score
- **Dimension Analysis**: Spider chart across 6 professional dimensions
- **Detailed Breakdowns**: Individual cards for each dimension with matches/gaps
- **Gap Analysis**: Prioritized gaps (Critical, Important, Nice-to-have)
- **Recommendations**: Actionable steps with resources and timeframes

## Getting Started

### Prerequisites
- Node.js 16+ 
- Backend API running on http://localhost:3000

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Environment Variables

Create a `.env` file:

```env
VITE_API_URL=http://localhost:3000/api
```

## Tech Stack

- **React 18** with Vite
- **TailwindCSS** for styling
- **Recharts** for data visualization
- **React Router** for navigation
- **React Query** for server state
- **Axios** for API calls
