#!/usr/bin/env node

import database from '../db/database.js';
import onetService from '../services/onetService.js';

// Progress tracking
let progressInterval;

function startProgressDisplay() {
    progressInterval = setInterval(() => {
        // Progress is displayed through callbacks
    }, 1000);
}

function stopProgressDisplay() {
    if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
    }
}

async function main() {
    console.log('===========================================');
    console.log('O*NET Data Fetch Script');
    console.log('===========================================\n');
    
    try {
        // Initialize database
        console.log('Initializing database...');
        await database.initialize();
        
        // Initialize O*NET service
        console.log('Initializing O*NET service...');
        onetService.initialize();
        
        // Check if we need to fetch the occupation list first
        const occupationCount = await database.get('SELECT COUNT(*) as count FROM occupations');
        
        if (occupationCount.count === 0) {
            console.log('\nNo occupations found. Fetching occupation list...');
            await onetService.fetchOccupationsList();
            const newCount = await database.get('SELECT COUNT(*) as count FROM occupations');
            console.log(`✓ Fetched ${newCount.count} occupations\n`);
        } else {
            console.log(`✓ Found ${occupationCount.count} occupations in database\n`);
        }
        
        // Check fetch status
        const fetchStatus = await database.getFetchStatus();
        console.log('Current fetch status:');
        fetchStatus.forEach(status => {
            console.log(`  ${status.fetch_status}: ${status.count} occupations`);
        });
        console.log('');
        
        // Start full fetch with progress tracking
        startProgressDisplay();
        
        const startTime = Date.now();
        console.log('Starting full data fetch (this may take 1-2 hours)...\n');
        
        const result = await onetService.fetchAllOccupations((progress) => {
            // Clear line and show progress
            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);
            
            const progressBar = generateProgressBar(progress.percentage);
            process.stdout.write(
                `Progress: ${progressBar} ${progress.percentage}% ` +
                `(${progress.current}/${progress.total}) ` +
                `[✓ ${progress.completed} | ✗ ${progress.failed}] ` +
                `Current: ${progress.currentOccupation || 'N/A'}`
            );
            
            if (progress.error) {
                console.log(`\n⚠ Error fetching ${progress.currentOccupation}: ${progress.error}`);
            }
        });
        
        stopProgressDisplay();
        console.log('\n');
        
        // Show summary
        console.log('===========================================');
        console.log('Fetch Complete!');
        console.log('===========================================');
        console.log(`Total occupations: ${result.totalOccupations}`);
        console.log(`Successfully fetched: ${result.completed}`);
        console.log(`Failed: ${result.failed}`);
        console.log(`Duration: ${result.duration}`);
        
        // If there were failures, offer to retry
        if (result.failed > 0) {
            console.log('\n⚠ Some occupations failed to fetch.');
            console.log('Attempting to retry failed fetches...\n');
            
            const retryResult = await onetService.retryFailedFetches();
            console.log(`Retry complete: ${retryResult.successful} successful, ${retryResult.failed} failed`);
        }
        
        // Final status
        const finalStatus = await database.getFetchStatus();
        console.log('\nFinal fetch status:');
        finalStatus.forEach(status => {
            console.log(`  ${status.fetch_status}: ${status.count} occupations`);
        });
        
    } catch (error) {
        console.error('\n❌ Fatal error:', error.message);
        process.exit(1);
    } finally {
        stopProgressDisplay();
        await database.close();
    }
}

function generateProgressBar(percentage) {
    const width = 30;
    const completed = Math.floor((percentage / 100) * width);
    const remaining = width - completed;
    return '[' + '█'.repeat(completed) + '░'.repeat(remaining) + ']';
}

// Handle process termination
process.on('SIGINT', async () => {
    console.log('\n\nFetch interrupted by user. Cleaning up...');
    stopProgressDisplay();
    await database.close();
    process.exit(0);
});

// Run the script
main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
});