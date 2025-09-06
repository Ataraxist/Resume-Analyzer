import database from '../db/database.js';

async function checkDatabase() {
    try {
        await database.initialize();
        
        // Check resumes in database
        const resumes = await database.query('SELECT id, user_id, session_id, filename, processing_status, created_at FROM resumes');
        console.log('Resumes in database:', resumes);
        
        // Check guest sessions
        const sessions = await database.query('SELECT * FROM guest_sessions');
        console.log('\nGuest sessions:', sessions);
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkDatabase();