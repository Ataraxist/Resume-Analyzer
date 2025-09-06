# Resume Analyzer Backend - Phase 1: O*NET Integration

## Overview
This backend service provides comprehensive O*NET occupation data caching and API access for the Resume Analyzer application.

## Features
- ✅ Complete O*NET data integration
- ✅ SQLite caching for 1000+ occupations
- ✅ Parallel fetching with rate limiting
- ✅ Progress tracking for data synchronization
- ✅ RESTful API for cached data access
- ✅ Advanced search with filters
- ✅ Automatic retry for failed fetches

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and add your O*NET credentials:
```bash
cp .env.example .env
```

Edit `.env`:
```env
# O*NET API v2 Key (required)
ONET_API_KEY=your_api_key_here

# Server Configuration
PORT=3000
NODE_ENV=development

# Database
DB_PATH=./data/onet_cache.db

# API Rate Limiting
MAX_CONCURRENT_REQUESTS=10
REQUEST_DELAY_MS=50

# CORS
CORS_ORIGIN=http://localhost:5173
```

**Get O*NET API Key:**
1. Visit https://services.onetcenter.org/reference
2. Register for a free account
3. Login to get your API key from the dashboard

### 3. Initial Data Fetch
Run the fetch script to populate the database:
```bash
npm run fetch-onet
```

This will:
- Fetch all ~1000 occupations from O*NET
- Download detailed data for each occupation (8 dimensions)
- Cache everything in SQLite
- Take approximately 1-2 hours to complete

### 4. Start the Server
```bash
npm run dev  # Development with auto-reload
# or
npm start    # Production
```

## API Endpoints

### Basic Endpoints

#### Health Check
```http
GET /api/health
```

#### List All Occupations
```http
GET /api/onet/occupations?limit=100&offset=0&search=software
```

Response:
```json
{
  "data": [
    {
      "code": "15-1252.00",
      "title": "Software Developers",
      "description": "Research, design, and develop...",
      "bright_outlook": true
    }
  ],
  "pagination": {
    "total": 1016,
    "limit": 100,
    "offset": 0,
    "hasMore": true
  }
}
```

#### Get Occupation Details
```http
GET /api/onet/occupations/15-1252.00
```

Returns complete occupation data including:
- Tasks
- Technology Skills
- Tools Used
- Work Activities
- Knowledge areas
- Skills
- Abilities
- Education requirements
- Job Zone information

#### Get Specific Dimension
```http
GET /api/onet/occupations/15-1252.00/skills
```

Valid dimensions:
- `tasks`
- `technology_skills`
- `tools_used`
- `work_activities`
- `knowledge`
- `skills`
- `abilities`
- `education`
- `job_zones`

### Advanced Search
```http
POST /api/onet/search
Content-Type: application/json

{
  "query": "software",
  "filters": {
    "brightOutlook": true,
    "skills": ["Programming"],
    "technology": ["Python", "JavaScript"]
  },
  "includeDetails": false,
  "limit": 20,
  "offset": 0
}
```

### Admin Endpoints

#### Check Fetch Status
```http
GET /api/onet/status
```

Response:
```json
{
  "stats": {
    "total": 1016,
    "completed": 1016,
    "pending": 0,
    "inProgress": 0,
    "failed": 0,
    "percentage": 100
  },
  "lastSync": "2025-01-06T10:30:00Z",
  "lastSyncDuration": "4320 seconds",
  "isComplete": true,
  "hasErrors": false
}
```

#### Trigger Full Data Fetch
```http
POST /api/onet/fetch-all
```

#### Retry Failed Fetches
```http
POST /api/onet/retry-failed
```

## Database Schema

The SQLite database contains the following tables:
- `occupations` - Basic occupation information
- `tasks` - Job tasks and responsibilities
- `technology_skills` - Required technology skills
- `tools_used` - Tools and technologies used
- `work_activities` - Daily work activities
- `knowledge` - Knowledge requirements
- `skills` - Required skills
- `abilities` - Required abilities
- `education` - Education level requirements
- `job_zones` - Job zone classifications
- `fetch_metadata` - Sync status tracking
- `system_metadata` - System configuration

## Development

### Project Structure
```
backend/
├── src/
│   ├── config/
│   │   └── onet.config.js       # O*NET API configuration
│   ├── db/
│   │   ├── schema.sql           # Database schema
│   │   └── database.js          # Database operations
│   ├── services/
│   │   └── onetService.js       # O*NET API service
│   ├── utils/
│   │   └── rateLimiter.js       # Rate limiting utility
│   └── scripts/
│       └── fetchOnetData.js     # Data fetch script
├── server.js                     # Express server
├── package.json
├── .env.example
└── README.md
```

### Rate Limiting
The service implements intelligent rate limiting:
- Maximum 10 concurrent requests (configurable)
- 50ms delay between requests (configurable)
- Automatic retry with exponential backoff
- Queue management for batch operations

### Error Handling
- Comprehensive error logging
- Automatic retry for failed fetches
- Graceful degradation for missing data
- Transaction rollback on database errors

## Testing

To test the implementation:

1. **Check Server Health:**
```bash
curl http://localhost:3000/api/health
```

2. **Search for Occupations:**
```bash
curl http://localhost:3000/api/onet/occupations?search=developer
```

3. **Get Specific Occupation:**
```bash
curl http://localhost:3000/api/onet/occupations/15-1252.00
```

4. **Check Fetch Status:**
```bash
curl http://localhost:3000/api/onet/status
```

## Troubleshooting

### Database Issues
If you encounter database errors:
```bash
# Remove existing database
rm -rf data/

# Restart server (will recreate database)
npm run dev
```

### Fetch Failures
If fetching fails:
1. Check your O*NET credentials in `.env`
2. Verify internet connection
3. Check rate limit settings
4. Use retry endpoint: `POST /api/onet/retry-failed`

### Memory Issues
For systems with limited memory:
- Reduce `MAX_CONCURRENT_REQUESTS` in `.env`
- Increase `REQUEST_DELAY_MS`
- Run fetch in smaller batches

## Next Steps

After Phase 1 is complete:
- **Phase 2:** Resume processing and text extraction
- **Phase 3:** AI-powered analysis engine
- **Phase 4:** Frontend interface

## License
Private - Internal Use Only