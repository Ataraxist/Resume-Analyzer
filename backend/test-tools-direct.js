import onetService from './src/services/onetService.js';
import database from './src/db/database.js';

async function testToolsFetch() {
    try {
        console.log('Initializing...');
        await database.initialize();
        onetService.initialize();
        
        const occupationCode = '11-1011.00';
        console.log(`\nTesting tools fetch for ${occupationCode}`);
        
        // Clear existing data
        await database.query('DELETE FROM tools_used WHERE occupation_code = ?', [occupationCode]);
        console.log('Cleared existing tools data');
        
        // Try to fetch tools
        console.log('\nCalling fetchToolsUsed directly...');
        const tools = await onetService.fetchToolsUsed(occupationCode);
        
        console.log(`\nResult: Got ${tools.length} tools`);
        if (tools.length > 0) {
            console.log('\nFirst few tools:');
            tools.slice(0, 3).forEach(tool => {
                console.log(`  - ${tool.title} (${tool.id})`);
            });
        }
        
        // Check database
        const dbTools = await database.query(
            'SELECT * FROM tools_used WHERE occupation_code = ?',
            [occupationCode]
        );
        console.log(`\nDatabase has ${dbTools.length} tools saved`);
        
    } catch (error) {
        console.error('\nError:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        process.exit(0);
    }
}

testToolsFetch();