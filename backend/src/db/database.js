import sqlite3 from 'sqlite3';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = process.env.DB_PATH || './data/onet_cache.db';

class Database {
    constructor() {
        this.db = null;
    }

    async initialize() {
        // If already initialized, return immediately
        if (this.db) {
            return Promise.resolve();
        }
        
        // Create data directory if it doesn't exist
        const dataDir = path.dirname(DB_PATH);
        await fs.mkdir(dataDir, { recursive: true });

        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(DB_PATH, async (err) => {
                if (err) {
                    console.error('Error opening database:', err);
                    reject(err);
                } else {
                    console.log('Connected to SQLite database');
                    await this.initializeSchema();
                    resolve();
                }
            });
        });
    }

    async initializeSchema() {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = await fs.readFile(schemaPath, 'utf-8');
        
        return new Promise((resolve, reject) => {
            this.db.exec(schema, (err) => {
                if (err) {
                    console.error('Error initializing schema:', err);
                    reject(err);
                } else {
                    console.log('Database schema initialized');
                    resolve();
                }
            });
        });
    }

    // Generic query method
    query(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Generic run method for INSERT, UPDATE, DELETE
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    // Get single row
    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    // Occupation-specific methods
    async saveOccupation(occupation) {
        const sql = `
            INSERT OR REPLACE INTO occupations (
                code, title, description, sample_titles,
                bright_outlook, rapid_growth, numerous_openings,
                updated_year, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `;
        
        const params = [
            occupation.code,
            occupation.title,
            occupation.description,
            JSON.stringify(occupation.sample_of_reported_titles || []),
            occupation.bright_outlook ? 1 : 0,
            occupation.rapid_growth ? 1 : 0,
            occupation.numerous_openings ? 1 : 0,
            occupation.updated_year || new Date().getFullYear()
        ];
        
        return this.run(sql, params);
    }

    async saveTasks(occupationCode, tasks) {
        const sql = `
            INSERT OR REPLACE INTO tasks (
                occupation_code, task_id, task_text,
                incumbents_responding, date_updated, domain_source
            ) VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        for (const task of tasks) {
            await this.run(sql, [
                occupationCode,
                task.id,
                task.title,
                task.importance,
                task.date_updated,
                task.category
            ]);
        }
    }

    async saveTechnologySkills(occupationCode, skills) {
        const sql = `
            INSERT OR REPLACE INTO technology_skills (
                occupation_code, skill_id, skill_name,
                skill_description, example, hot_technology
            ) VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        for (const skill of skills) {
            await this.run(sql, [
                occupationCode,
                skill.id,
                skill.title,
                skill.description,
                skill.example,
                skill.hot_technology ? 1 : 0
            ]);
        }
    }

    async saveToolsUsed(occupationCode, tools) {
        console.log(`Saving ${tools.length} tools for ${occupationCode}`);
        const sql = `
            INSERT OR REPLACE INTO tools_used (
                occupation_code, tool_id, tool_name, tool_description
            ) VALUES (?, ?, ?, ?)
        `;
        
        for (const tool of tools) {
            try {
                await this.run(sql, [
                    occupationCode,
                    tool.id,
                    tool.title,
                    tool.description
                ]);
            } catch (error) {
                console.error(`Error saving tool ${tool.id}:`, error.message);
                throw error;
            }
        }
        console.log(`Successfully saved ${tools.length} tools`);
    }

    async saveWorkActivities(occupationCode, activities) {
        const sql = `
            INSERT OR REPLACE INTO work_activities (
                occupation_code, activity_id, activity_name,
                activity_description, importance_score, level_score
            ) VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        for (const activity of activities) {
            await this.run(sql, [
                occupationCode,
                activity.id,
                activity.title,
                activity.description,
                activity.importance,
                activity.level
            ]);
        }
    }

    async saveKnowledge(occupationCode, knowledgeItems) {
        const sql = `
            INSERT OR REPLACE INTO knowledge (
                occupation_code, knowledge_id, knowledge_name,
                knowledge_description, importance_score, level_score
            ) VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        for (const item of knowledgeItems) {
            await this.run(sql, [
                occupationCode,
                item.id,
                item.title,
                item.description,
                item.importance,
                item.level
            ]);
        }
    }

    async saveSkills(occupationCode, skills) {
        const sql = `
            INSERT OR REPLACE INTO skills (
                occupation_code, skill_id, skill_name,
                skill_description, importance_score, level_score
            ) VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        for (const skill of skills) {
            await this.run(sql, [
                occupationCode,
                skill.id,
                skill.title,
                skill.description,
                skill.importance,
                skill.level
            ]);
        }
    }

    async saveAbilities(occupationCode, abilities) {
        const sql = `
            INSERT OR REPLACE INTO abilities (
                occupation_code, ability_id, ability_name,
                ability_description, importance_score, level_score
            ) VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        for (const ability of abilities) {
            await this.run(sql, [
                occupationCode,
                ability.id,
                ability.title,
                ability.description,
                ability.importance,
                ability.level
            ]);
        }
    }

    async saveEducation(occupationCode, educationData) {
        console.log(`Saving ${educationData.length} education items for ${occupationCode}`);
        const sql = `
            INSERT INTO education (
                occupation_code, category, percentage
            ) VALUES (?, ?, ?)
        `;
        
        // Clear existing education data
        await this.run('DELETE FROM education WHERE occupation_code = ?', [occupationCode]);
        
        for (const item of educationData) {
            // Map O*NET API v2 field names to our database schema
            // API returns 'title' and 'percentage_of_respondents'
            try {
                await this.run(sql, [
                    occupationCode,
                    item.title || item.category,  // API uses 'title'
                    item.percentage_of_respondents || item.percentage  // API uses 'percentage_of_respondents'
                ]);
            } catch (error) {
                console.error(`Error saving education item:`, item, error.message);
                throw error;
            }
        }
        console.log(`Successfully saved ${educationData.length} education items`);
    }

    async saveJobZone(occupationCode, jobZone) {
        const sql = `
            INSERT OR REPLACE INTO job_zones (
                occupation_code, job_zone, education_needed,
                related_experience, on_the_job_training
            ) VALUES (?, ?, ?, ?, ?)
        `;
        
        return this.run(sql, [
            occupationCode,
            jobZone.code,
            jobZone.education,
            jobZone.related_experience,
            jobZone.job_training
        ]);
    }

    // Fetch metadata methods
    async updateFetchStatus(occupationCode, status, errorMessage = null) {
        const sql = `
            INSERT OR REPLACE INTO fetch_metadata (
                occupation_code, fetch_status, fetch_started_at,
                fetch_completed_at, error_message, retry_count
            ) VALUES (
                ?,
                ?,
                CASE WHEN ? = 'in_progress' THEN CURRENT_TIMESTAMP ELSE 
                    (SELECT fetch_started_at FROM fetch_metadata WHERE occupation_code = ?)
                END,
                CASE WHEN ? IN ('completed', 'failed') THEN CURRENT_TIMESTAMP ELSE NULL END,
                ?,
                COALESCE((SELECT retry_count FROM fetch_metadata WHERE occupation_code = ?), 0) + 
                    CASE WHEN ? = 'failed' THEN 1 ELSE 0 END
            )
        `;
        
        return this.run(sql, [
            occupationCode, status, status, occupationCode,
            status, errorMessage, occupationCode, status
        ]);
    }

    async getFetchStatus() {
        const sql = `
            SELECT 
                fetch_status,
                COUNT(*) as count
            FROM fetch_metadata
            GROUP BY fetch_status
        `;
        
        return this.query(sql);
    }

    async getFailedFetches() {
        const sql = `
            SELECT 
                occupation_code,
                error_message,
                retry_count,
                fetch_started_at
            FROM fetch_metadata
            WHERE fetch_status = 'failed'
            ORDER BY retry_count ASC, fetch_started_at DESC
        `;
        
        return this.query(sql);
    }

    // Get all occupations
    async getAllOccupations() {
        const sql = `
            SELECT code, title, description, bright_outlook, updated_year
            FROM occupations
            ORDER BY title
        `;
        
        return this.query(sql);
    }

    // Get occupation details with all related data
    async hasDetailedData(code) {
        // Check if we have detailed data for this occupation
        const counts = await this.get(`
            SELECT 
                (SELECT COUNT(*) FROM tasks WHERE occupation_code = ?) as tasks_count,
                (SELECT COUNT(*) FROM skills WHERE occupation_code = ?) as skills_count,
                (SELECT COUNT(*) FROM work_activities WHERE occupation_code = ?) as activities_count
        `, [code, code, code]);
        
        // If we have at least some data in these core tables, consider it complete
        return counts && (counts.tasks_count > 0 || counts.skills_count > 0 || counts.activities_count > 0);
    }

    async getOccupationDetails(code) {
        const occupation = await this.get('SELECT * FROM occupations WHERE code = ?', [code]);
        
        if (!occupation) {
            return null;
        }
        
        // Parse sample_titles if it's a JSON string
        if (occupation.sample_titles) {
            try {
                occupation.sample_titles = JSON.parse(occupation.sample_titles);
            } catch (e) {
                occupation.sample_titles = [];
            }
        }
        
        // Fetch all related data
        const [tasks, technology_skills, tools_used, work_activities, 
               knowledge, skills, abilities, education, job_zone, cacheMetadata] = await Promise.all([
            this.query('SELECT * FROM tasks WHERE occupation_code = ?', [code]),
            this.query('SELECT * FROM technology_skills WHERE occupation_code = ? ORDER BY hot_technology DESC, skill_name ASC', [code]),
            this.query('SELECT * FROM tools_used WHERE occupation_code = ?', [code]),
            this.query('SELECT * FROM work_activities WHERE occupation_code = ? AND importance_score > 25 ORDER BY importance_score DESC', [code]),
            this.query('SELECT * FROM knowledge WHERE occupation_code = ? AND importance_score > 25 ORDER BY importance_score DESC', [code]),
            this.query('SELECT * FROM skills WHERE occupation_code = ? AND importance_score > 25 ORDER BY importance_score DESC', [code]),
            this.query('SELECT * FROM abilities WHERE occupation_code = ? AND importance_score > 25 ORDER BY importance_score DESC', [code]),
            this.query('SELECT * FROM education WHERE occupation_code = ? ORDER BY percentage DESC', [code]),
            this.get('SELECT * FROM job_zones WHERE occupation_code = ?', [code]),
            this.get('SELECT * FROM fetch_metadata WHERE occupation_code = ?', [code])
        ]);
        
        // Check which dimensions are missing
        const missingDimensions = [];
        if (tasks.length === 0) missingDimensions.push('tasks');
        if (technology_skills.length === 0 && tools_used.length === 0) missingDimensions.push('technology');
        if (skills.length === 0) missingDimensions.push('skills');
        if (knowledge.length === 0) missingDimensions.push('knowledge');
        if (abilities.length === 0) missingDimensions.push('abilities');
        if (education.length === 0) missingDimensions.push('education');
        if (!job_zone || !job_zone.job_zone) missingDimensions.push('job_zone');
        
        // Check if data is stale (older than 30 days)
        const isStale = cacheMetadata?.last_updated && 
            (Date.now() - new Date(cacheMetadata.last_updated).getTime() > 30 * 24 * 60 * 60 * 1000);
        
        // Check if we have detailed data
        const hasData = tasks.length > 0 || skills.length > 0 || work_activities.length > 0;
        
        return {
            occupation: {
                ...occupation
            },
            tasks,
            technologySkills: technology_skills,
            tools: tools_used,
            workActivities: work_activities,
            knowledge,
            skills,
            abilities,
            education,
            jobZone: job_zone,
            hasDetailedData: hasData,
            missingDimensions,
            isStale,
            lastUpdated: cacheMetadata?.last_updated
        };
    }

    // Update system metadata
    async updateSystemMetadata(key, value) {
        const sql = `
            INSERT OR REPLACE INTO system_metadata (key, value, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
        `;
        
        return this.run(sql, [key, value]);
    }

    async getSystemMetadata(key) {
        const sql = 'SELECT value FROM system_metadata WHERE key = ?';
        const row = await this.get(sql, [key]);
        return row ? row.value : null;
    }

    close() {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log('Database connection closed');
                    resolve();
                }
            });
        });
    }
}

// Create singleton instance
const database = new Database();

export default database;