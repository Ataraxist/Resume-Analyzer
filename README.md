# Resume Analyzer

A modern, full-stack application that analyzes resumes against job requirements using AI-powered insights.

## 🚀 Features

- **Smart Resume Analysis**: Upload resumes in PDF, Word, or text format
- **Job Matching**: Compare resumes against O*NET job data
- **AI-Powered Insights**: Get detailed feedback on skills, experience, and job fit
- **Real-time Processing**: Instant analysis with progress indicators
- **Modern UI**: Responsive design with error handling and loading states
- **Secure & Scalable**: Built with security best practices and rate limiting

## 🏗️ Architecture

### Backend (Node.js/Express)
- **Services Layer**: Modular business logic separation
- **Error Handling**: Comprehensive error management with custom middleware
- **Validation**: Request sanitization and validation
- **Security**: Helmet, CORS, rate limiting
- **Configuration**: Environment-based config management

### Frontend (React)
- **Custom Hooks**: Reusable logic for file upload, job selection, and analysis
- **Context API**: Global state management
- **Error Boundaries**: Graceful error handling
- **Modern Components**: Responsive, accessible UI components

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- MongoDB
- OpenAI API Key

### Backend Setup

1. Navigate to the server directory:
```bash
cd Server
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure your `.env` file with:
```env
OPENAI_API_KEY=your_openai_api_key_here
MONGO_URI=mongodb://localhost:27017/resume-analyzer
JWT_SECRET=your_jwt_secret_here
```

5. Start the server:
```bash
npm start
```

### Frontend Setup

1. Navigate to the client directory:
```bash
cd Client
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure your `.env` file:
```env
VITE_API_BASE_URL=http://localhost:3000
```

5. Start the development server:
```bash
npm run dev
```

## 🔧 Configuration

### Server Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `OPENAI_API_KEY` | OpenAI API key | Required |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/resume-analyzer` |
| `JWT_SECRET` | JWT signing secret | Required |
| `MAX_FILE_SIZE` | Max upload size in bytes | `10485760` (10MB) |
| `RATE_LIMIT_MAX` | Max requests per window | `100` |

### Client Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:3000` |
| `VITE_NODE_ENV` | Environment | `development` |

## 🔌 API Endpoints

### Upload & Analysis
- `POST /api/upload` - Upload resume and analyze against job
- `POST /upload` - Legacy endpoint (backward compatibility)

### Job Data
- `GET /api/job/*` - O*NET job data endpoints
- `GET /job/*` - Legacy endpoints

### Health Check
- `GET /health` - Server health status

## 🧪 Development

### Code Structure

```
Resume-Analyzer/
├── Server/
│   ├── config/           # Configuration management
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Custom middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   └── utils/           # Utility functions
├── Client/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── context/     # React contexts
│   │   ├── hooks/       # Custom hooks
│   │   └── Pages/       # Page components
│   └── public/
└── README.md
```

### Key Improvements Made

1. **Server-Side Refactoring**:
   - Extracted business logic into services
   - Added comprehensive error handling
   - Implemented request validation and sanitization
   - Added security middleware (helmet, rate limiting)
   - Created centralized configuration management

2. **Client-Side Modernization**:
   - Created custom hooks for state management
   - Implemented Context API for global state
   - Added error boundaries and loading states
   - Improved component architecture
   - Enhanced user experience with better feedback

3. **Code Quality**:
   - Separation of concerns
   - Error handling at all levels
   - Input validation and sanitization
   - Responsive design patterns
   - Accessibility improvements

## 🚦 Usage

1. **Start the Application**: Run both backend and frontend servers
2. **Upload Resume**: Choose a PDF, Word document, or paste text
3. **Select Job**: Pick from available job listings or search
4. **Review Analysis**: Get detailed feedback on job fit
5. **Improve Resume**: Use insights to enhance your resume

## 🔒 Security Features

- Request rate limiting
- Input sanitization
- File type validation
- Size limits on uploads
- CORS configuration
- Error message sanitization
- Secure headers (Helmet.js)

## 🐛 Error Handling

The application includes comprehensive error handling:
- **Client-side**: Error boundaries, user-friendly messages, retry mechanisms
- **Server-side**: Global error handler, structured error responses, logging
- **Network**: Connection error handling, timeout management

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes following the existing patterns
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🤝 Support

For support, please open an issue in the repository or contact the development team.