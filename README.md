# CareerCompass

An AI-powered career development advisor that bridges the gap between your current skills and career goals using O*NET occupational data to provide personalized guidance and actionable recommendations.

## Features

### Core Functionality
- **Experience Analysis**: AI-powered extraction of skills and experience from resumes and Google Docs
- **Career Path Mapping**: Compare your profile against 1,000+ O*NET occupation profiles
- **Real-time Assessment**: Watch your career readiness assessment with live updates
- **Multi-dimensional Evaluation**: Assess readiness across 6 professional dimensions:
  - Tasks & Responsibilities
  - Skills & Abilities
  - Educational Requirements
  - Work Activities
  - Knowledge Areas
  - Tools & Technology
- **Personalized Career Guidance**: Receive specific recommendations for skill development, certifications, and career advancement
- **Credit-based System**: Fair usage model with secure Stripe integration

### User Experience
- **Interactive Visualizations**: Dynamic radar charts showing dimensional strengths
- **Progressive Results**: View insights as they're generated in real-time
- **Smart Caching**: Instant results for repeated analyses
- **Mobile Responsive**: Full functionality across all devices
- **Session Management**: Secure authentication with JWT tokens

## Tech Stack

### Frontend
- **React 19** with Vite for blazing-fast development
- **TailwindCSS** for modern, responsive styling
- **Recharts** for interactive data visualizations
- **React Query** for efficient data fetching
- **React Hook Form** for form management
- **Framer Motion** for smooth animations

### Backend
- **Node.js** with Express.js
- **PostgreSQL** for robust data storage
- **Redis** for caching and session management
- **OpenAI GPT-4** for intelligent resume parsing
- **Server-Sent Events** for real-time streaming
- **Stripe** for payment processing
- **JWT** for secure authentication

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+
- Redis 6+
- OpenAI API key
- Stripe account (for payments)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/resume-analyzer.git
cd resume-analyzer
```

2. **Set up the backend**
```bash
cd backend
npm install

# Create .env file with required variables
cp .env.example .env
# Edit .env with your configuration

# Set up database
psql -U postgres -f src/db/schema.sql

# Start the server
npm run dev
```

3. **Set up the frontend**
```bash
cd frontend
npm install

# Create .env file
cp .env.example .env
# Edit .env with your API endpoint

# Start the development server
npm run dev
```

4. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Environment Variables

### Backend (.env)
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/resume_analyzer
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# APIs
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Server
PORT=3001
NODE_ENV=development
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001
```

## Usage

1. **Sign Up/Login**: Create an account or login to access the platform
2. **Upload Resume**: Upload your resume in PDF, DOCX, or import from Google Docs
3. **Select Occupation**: Search and select target job from O*NET database
4. **View Analysis**: Watch real-time analysis with progressive results
5. **Review Insights**: Explore dimensional scores and recommendations
6. **Take Action**: Follow personalized recommendations for improvement

## API Documentation

### Key Endpoints

#### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

#### Resumes
- `POST /api/resumes/upload` - Upload resume file
- `POST /api/resumes/parse` - Parse resume with AI
- `GET /api/resumes` - List user's resumes

#### Analysis
- `GET /api/analysis/stream/:resumeId/:occupationCode` - Stream analysis (SSE)
- `GET /api/analysis/:id` - Get completed analysis
- `GET /api/analysis/search` - Search analyses

#### Credits
- `GET /api/credits/balance` - Check credit balance
- `POST /api/credits/purchase` - Purchase credits

## Project Structure

```
resume-analyzer/
├── backend/
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Auth, validation
│   │   └── db/            # Database schema
│   └── server.js          # Entry point
│
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API clients
│   │   ├── contexts/      # React contexts
│   │   └── utils/         # Utilities
│   └── index.html         # Entry point
│
└── README.md
```

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## Deployment

### Production Considerations
- Use environment variables for all sensitive data
- Enable HTTPS with SSL certificates
- Set up proper CORS policies
- Configure rate limiting
- Implement error monitoring (e.g., Sentry)
- Set up database backups
- Use PM2 or similar for process management

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- O*NET for comprehensive occupation data
- OpenAI for powerful resume parsing capabilities
- The open-source community for amazing tools and libraries

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Contact: support@resumeanalyzer.com

---

Built with ❤️ by the Resume Analyzer Team