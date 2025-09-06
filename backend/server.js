import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import crypto from 'crypto';
import dotenv from 'dotenv';
import database from './src/db/database.js';
import onetService from './src/services/onetService.js';
import authRoutes from './src/routes/authRoutes.js';
import resumeRoutes from './src/routes/resumeRoutes.js';
import analysisRoutes from './src/routes/analysisRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Session configuration
const sessionConfig = {
    secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: true, // Important: create session for guests
    cookie: {
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        httpOnly: true,
        maxAge: 48 * 60 * 60 * 1000, // 48 hours for guest sessions
        sameSite: 'lax'
    },
    name: 'resume.sid' // Custom session cookie name
};

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true, // Allow cookies to be sent
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204
}));
app.use(express.json());
app.use(cookieParser());
app.use(session(sessionConfig));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Initialize services
async function initializeServices() {
    try {
        await database.initialize();
        onetService.initialize();
        
        // Check and populate occupations list if needed
        await onetService.checkAndUpdateOccupationsList();
        
        console.log('Services initialized successfully');
    } catch (error) {
        console.error('Failed to initialize services:', error);
        process.exit(1);
    }
}

// === API Routes ===

// Authentication routes
app.use('/api/auth', authRoutes);

// Resume routes (Phase 2)
app.use('/api/resume', resumeRoutes);

// Analysis routes (Phase 3)
app.use('/api/analysis', analysisRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Get all occupations (cached)
app.get('/api/onet/occupations', async (req, res) => {
    try {
        const { search, limit = 100, offset = 0 } = req.query;
        
        let query = 'SELECT code, title, description, bright_outlook, sample_titles, rapid_growth, numerous_openings, updated_year FROM occupations';
        const params = [];
        
        if (search) {
            // Split search terms for flexible matching
            const searchTerms = search.trim().split(/\s+/);
            const conditions = [];
            
            // Add conditions for each search term
            searchTerms.forEach(term => {
                conditions.push('(title LIKE ? OR description LIKE ? OR code LIKE ? OR sample_titles LIKE ?)');
                params.push(`%${term}%`, `%${term}%`, `${term}%`, `%${term}%`);
            });
            
            // Also add a condition for the full search string
            conditions.push('(title LIKE ? OR description LIKE ? OR code LIKE ? OR sample_titles LIKE ?)');
            params.push(`%${search}%`, `%${search}%`, `${search}%`, `%${search}%`);
            
            query += ' WHERE ' + conditions.join(' OR ');
        }
        
        query += ' ORDER BY ' +
                 'CASE ' +
                 'WHEN code LIKE ? THEN 1 ' +  // Exact code match first
                 'WHEN title LIKE ? THEN 2 ' + // Exact title match second
                 'WHEN title LIKE ? THEN 3 ' + // Title starts with search
                 'ELSE 4 END, ' +
                 'title LIMIT ? OFFSET ?';
        
        // Add ordering parameters
        if (search) {
            params.push(`${search}%`, search, `${search}%`);
        } else {
            params.push('', '', '');
        }
        params.push(parseInt(limit), parseInt(offset));
        
        const occupations = await database.query(query, params);
        
        // Get total count for pagination
        let countQuery = 'SELECT COUNT(*) as total FROM occupations';
        const countParams = [];
        
        if (search) {
            const searchTerms = search.trim().split(/\s+/);
            const conditions = [];
            
            searchTerms.forEach(term => {
                conditions.push('(title LIKE ? OR description LIKE ? OR code LIKE ? OR sample_titles LIKE ?)');
                countParams.push(`%${term}%`, `%${term}%`, `${term}%`, `%${term}%`);
            });
            
            conditions.push('(title LIKE ? OR description LIKE ? OR code LIKE ? OR sample_titles LIKE ?)');
            countParams.push(`%${search}%`, `%${search}%`, `${search}%`, `%${search}%`);
            
            countQuery += ' WHERE ' + conditions.join(' OR ');
        }
        
        const countResult = await database.get(countQuery, countParams);
        
        res.json({
            data: occupations,
            pagination: {
                total: countResult.total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: parseInt(offset) + occupations.length < countResult.total
            }
        });
    } catch (error) {
        console.error('Error fetching occupations:', error);
        res.status(500).json({ error: 'Failed to fetch occupations' });
    }
});

// Force refresh occupation data
app.post('/api/onet/occupations/:code/refresh', async (req, res) => {
    try {
        const { code } = req.params;
        console.log(`Force refresh requested for occupation ${code}`);
        
        // Check if occupation exists
        const occupation = await database.get('SELECT * FROM occupations WHERE code = ?', [code]);
        if (!occupation) {
            return res.status(404).json({ error: 'Occupation not found' });
        }
        
        try {
            // Force fetch from O*NET API
            await onetService.fetchOccupationDetails(code);
            
            // Update the last_updated timestamp
            await database.run(`
                INSERT OR REPLACE INTO fetch_metadata 
                (occupation_code, fetch_status, fetch_completed_at, last_updated, expires_at)
                VALUES (?, 'completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, datetime('now', '+30 days'))
            `, [code]);
            
            // Get the refreshed data
            const details = await database.getOccupationDetails(code);
            console.log(`Successfully refreshed data for ${code}`);
            
            res.json({
                message: 'Data refreshed successfully',
                details
            });
        } catch (fetchError) {
            console.error(`Failed to refresh data for ${code}:`, fetchError);
            return res.status(500).json({ 
                error: 'Failed to refresh data from O*NET',
                message: fetchError.message 
            });
        }
    } catch (error) {
        console.error('Error refreshing occupation data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get specific occupation details (with on-demand fetching)
app.get('/api/onet/occupations/:code', async (req, res) => {
    try {
        const { code } = req.params;
        
        // First check if occupation exists
        let details = await database.getOccupationDetails(code);
        
        if (!details) {
            return res.status(404).json({ error: 'Occupation not found' });
        }
        
        // Check for missing dimensions or stale data
        if (details.missingDimensions.length > 0) {
            console.log(`Missing dimensions for ${code}: ${details.missingDimensions.join(', ')}`);
            console.log(`Fetching missing data from O*NET...`);
            
            try {
                // Fetch detailed data from O*NET API
                await onetService.fetchOccupationDetails(code);
                
                // Now get the complete data from database
                details = await database.getOccupationDetails(code);
                console.log(`Successfully fetched and cached missing data for ${code}`);
            } catch (fetchError) {
                console.error(`Failed to fetch missing data for ${code}:`, fetchError);
                // Return what we have with a warning about missing dimensions
                return res.json({
                    ...details,
                    warning: `Some data could not be fetched: ${details.missingDimensions.join(', ')}`
                });
            }
        } else if (details.isStale) {
            // Data is complete but stale - could trigger background refresh here
            console.log(`Data for ${code} is stale (last updated: ${details.lastUpdated})`);
            // For now, we'll serve stale data but log it
            // In production, you might want to trigger a background refresh here
        }
        
        res.json(details);
    } catch (error) {
        console.error('Error fetching occupation details:', error);
        res.status(500).json({ error: 'Failed to fetch occupation details' });
    }
});

// Get specific dimension for an occupation
app.get('/api/onet/occupations/:code/:dimension', async (req, res) => {
    try {
        const { code, dimension } = req.params;
        
        const validDimensions = [
            'tasks', 'technology_skills', 'tools_used', 'work_activities',
            'knowledge', 'skills', 'abilities', 'education', 'job_zones'
        ];
        
        if (!validDimensions.includes(dimension)) {
            return res.status(400).json({ 
                error: 'Invalid dimension',
                validDimensions 
            });
        }
        
        const tableName = dimension === 'job_zones' ? 'job_zones' : dimension;
        const data = await database.query(
            `SELECT * FROM ${tableName} WHERE occupation_code = ?`,
            [code]
        );
        
        res.json({ data });
    } catch (error) {
        console.error('Error fetching dimension data:', error);
        res.status(500).json({ error: 'Failed to fetch dimension data' });
    }
});

// Fetch specific occupation data on-demand (admin endpoint)
app.post('/api/onet/fetch-occupation/:code', async (req, res) => {
    try {
        const { code } = req.params;
        
        // Check if occupation exists
        const occupation = await database.get('SELECT * FROM occupations WHERE code = ?', [code]);
        
        if (!occupation) {
            return res.status(404).json({ error: 'Occupation not found' });
        }
        
        // Check if we already have detailed data
        const hasData = await database.hasDetailedData(code);
        
        if (hasData) {
            return res.json({ 
                message: 'Detailed data already exists for this occupation',
                code,
                cached: true
            });
        }
        
        // Fetch detailed data from O*NET
        console.log(`Fetching detailed data for ${code}...`);
        
        try {
            await onetService.fetchOccupationDetails(code);
            
            res.json({ 
                message: 'Successfully fetched detailed occupation data',
                code,
                cached: false
            });
        } catch (fetchError) {
            console.error(`Failed to fetch data for ${code}:`, fetchError);
            res.status(500).json({ 
                error: 'Failed to fetch occupation data from O*NET',
                details: fetchError.message 
            });
        }
        
    } catch (error) {
        console.error('Error in fetch-occupation:', error);
        res.status(500).json({ error: 'Failed to process request' });
    }
});

// Get fetch status
app.get('/api/onet/status', async (req, res) => {
    try {
        const status = await database.getFetchStatus();
        const lastSync = await database.getSystemMetadata('last_full_sync');
        const syncDuration = await database.getSystemMetadata('last_sync_duration_seconds');
        
        const totalOccupations = await database.get(
            'SELECT COUNT(*) as total FROM occupations'
        );
        
        // Calculate statistics
        const stats = {
            total: totalOccupations.total,
            byStatus: {}
        };
        
        status.forEach(s => {
            stats.byStatus[s.fetch_status] = s.count;
        });
        
        stats.completed = stats.byStatus.completed || 0;
        stats.pending = stats.byStatus.pending || 0;
        stats.inProgress = stats.byStatus['in_progress'] || 0;
        stats.failed = stats.byStatus.failed || 0;
        stats.percentage = Math.round((stats.completed / stats.total) * 100);
        
        res.json({
            stats,
            lastSync,
            lastSyncDuration: syncDuration ? `${syncDuration} seconds` : null,
            isComplete: stats.completed === stats.total,
            hasErrors: stats.failed > 0
        });
    } catch (error) {
        console.error('Error fetching status:', error);
        res.status(500).json({ error: 'Failed to fetch status' });
    }
});


// Search occupations with advanced filters
app.post('/api/onet/search', async (req, res) => {
    try {
        const { 
            query: searchQuery, 
            filters = {},
            includeDetails = false,
            limit = 20,
            offset = 0
        } = req.body;
        
        let sql = 'SELECT DISTINCT o.* FROM occupations o';
        const params = [];
        const conditions = [];
        
        // Add search condition
        if (searchQuery) {
            conditions.push('(o.title LIKE ? OR o.description LIKE ?)');
            params.push(`%${searchQuery}%`, `%${searchQuery}%`);
        }
        
        // Add filter for bright outlook
        if (filters.brightOutlook) {
            conditions.push('o.bright_outlook = 1');
        }
        
        // Add filter for specific skills
        if (filters.skills && filters.skills.length > 0) {
            sql += ' JOIN skills s ON o.code = s.occupation_code';
            const skillConditions = filters.skills.map(() => 's.skill_name LIKE ?');
            conditions.push(`(${skillConditions.join(' OR ')})`);
            filters.skills.forEach(skill => params.push(`%${skill}%`));
        }
        
        // Add filter for technology
        if (filters.technology && filters.technology.length > 0) {
            sql += ' JOIN technology_skills ts ON o.code = ts.occupation_code';
            const techConditions = filters.technology.map(() => 'ts.skill_name LIKE ?');
            conditions.push(`(${techConditions.join(' OR ')})`);
            filters.technology.forEach(tech => params.push(`%${tech}%`));
        }
        
        // Build WHERE clause
        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }
        
        sql += ' ORDER BY o.title LIMIT ? OFFSET ?';
        params.push(limit, offset);
        
        const results = await database.query(sql, params);
        
        // Optionally include details
        if (includeDetails) {
            for (let i = 0; i < results.length; i++) {
                results[i] = await database.getOccupationDetails(results[i].code);
            }
        }
        
        res.json({ 
            data: results,
            query: searchQuery,
            filters,
            pagination: {
                limit,
                offset,
                count: results.length
            }
        });
        
    } catch (error) {
        console.error('Error searching occupations:', error);
        res.status(500).json({ error: 'Failed to search occupations' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
async function startServer() {
    await initializeServices();
    
    app.listen(PORT, () => {
        console.log(`\n🚀 Server running on http://localhost:${PORT}`);
        console.log(`📚 API Documentation:`);
        console.log(`\n📄 Resume Endpoints (Phase 2):`);
        console.log(`   POST /api/resume/upload                 - Upload and process resume`);
        console.log(`   POST /api/resume/parse-text             - Parse raw text input`);
        console.log(`   GET  /api/resume                        - List all resumes`);
        console.log(`   GET  /api/resume/search                 - Search resumes`);
        console.log(`   GET  /api/resume/:id                    - Get resume details`);
        console.log(`   GET  /api/resume/:id/status             - Get processing status`);
        console.log(`   GET  /api/resume/:id/structured         - Get structured data`);
        console.log(`   GET  /api/resume/:id/key-elements       - Extract key elements`);
        console.log(`   DELETE /api/resume/:id                  - Delete resume`);
        console.log(`\n🎯 Analysis Endpoints (Phase 3):`);
        console.log(`   POST /api/analysis/analyze              - Analyze resume vs occupation`);
        console.log(`   POST /api/analysis/compare-dimension    - Compare specific dimension`);
        console.log(`   GET  /api/analysis/search               - Search analyses`);
        console.log(`   GET  /api/analysis/statistics           - Get statistics`);
        console.log(`   GET  /api/analysis/:id                  - Get analysis details`);
        console.log(`   GET  /api/analysis/:id/recommendations  - Get recommendations`);
        console.log(`   GET  /api/analysis/resume/:id           - Get analyses for resume`);
        console.log(`   GET  /api/analysis/resume/:id/top-matches - Get top matches`);
        console.log(`   DELETE /api/analysis/:id                - Delete analysis`);
        console.log(`\n🔍 O*NET Endpoints (Phase 1):`);
        console.log(`   GET  /api/health                        - Health check`);
        console.log(`   GET  /api/onet/occupations              - List all occupations`);
        console.log(`   GET  /api/onet/occupations/:code        - Get occupation details (fetches on-demand)`);
        console.log(`   GET  /api/onet/occupations/:code/:dim   - Get specific dimension`);
        console.log(`   POST /api/onet/search                   - Search with filters`);
        console.log(`   GET  /api/onet/status                   - Fetch status`);
        console.log(`   POST /api/onet/fetch-occupation/:code   - Manually fetch occupation data\n`);
    });
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    await database.close();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('\nSIGINT received. Shutting down gracefully...');
    await database.close();
    process.exit(0);
});

// Start the server
startServer().catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
});