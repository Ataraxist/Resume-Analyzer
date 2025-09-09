// Test script for ONET API retry logic
const RateLimiter = require('./functions/src/utils/rateLimiter');

async function testRetryLogic() {
    console.log('Testing ONET API retry logic...\n');
    
    // Test 1: Successful request (no retry needed)
    console.log('Test 1: Successful request');
    const successTask = async () => {
        console.log('  Executing task...');
        return { success: true, data: 'Test data' };
    };
    
    // Test 2: Network error (should retry)
    console.log('\nTest 2: Network error (should retry)');
    let networkAttempt = 0;
    const networkErrorTask = async () => {
        networkAttempt++;
        console.log(`  Attempt ${networkAttempt}`);
        if (networkAttempt < 3) {
            const error = new Error('ECONNRESET: Connection reset');
            error.code = 'ECONNRESET';
            throw error;
        }
        return { success: true, data: 'Recovered after network error' };
    };
    
    // Test 3: 404 error (should not retry)
    console.log('\nTest 3: 404 error (should not retry)');
    const notFoundTask = async () => {
        console.log('  Executing task...');
        const error = new Error('Not Found');
        error.status = 404;
        throw error;
    };
    
    // Test 4: Rate limit error (should retry with backoff)
    console.log('\nTest 4: Rate limit error (should retry with backoff)');
    let rateLimitAttempt = 0;
    const rateLimitTask = async () => {
        rateLimitAttempt++;
        console.log(`  Attempt ${rateLimitAttempt} at ${new Date().toISOString()}`);
        if (rateLimitAttempt < 2) {
            const error = new Error('Too Many Requests');
            error.status = 429;
            throw error;
        }
        return { success: true, data: 'Recovered after rate limit' };
    };
    
    // Test 5: Server error (should retry)
    console.log('\nTest 5: Server error (should retry)');
    let serverErrorAttempt = 0;
    const serverErrorTask = async () => {
        serverErrorAttempt++;
        console.log(`  Attempt ${serverErrorAttempt}`);
        if (serverErrorAttempt < 2) {
            const error = new Error('Internal Server Error');
            error.status = 500;
            throw error;
        }
        return { success: true, data: 'Recovered after server error' };
    };
    
    // Create rate limiter with retry configuration
    const rateLimiter = new RateLimiter(
        5,  // maxConcurrent
        100, // delayMs
        {
            maxRetries: 3,
            initialDelay: 100,
            maxDelay: 2000,
            backoffMultiplier: 2
        }
    );
    
    // Execute all tests
    const tasks = [
        successTask,
        networkErrorTask,
        notFoundTask,
        rateLimitTask,
        serverErrorTask
    ];
    
    const results = await rateLimiter.executeMany(
        tasks,
        (progress) => {
            console.log(`\nProgress: ${progress.completed}/${progress.total} (${progress.percentage}%)${progress.failedCount ? `, ${progress.failedCount} failed` : ''}`);
        }
    );
    
    // Display results
    console.log('\n=== Test Results ===\n');
    console.log(`Total tasks: ${tasks.length}`);
    console.log(`Successful: ${results.successCount}`);
    console.log(`Failed: ${results.errorCount}`);
    console.log(`Retryable errors: ${results.retryableErrors}`);
    
    console.log('\nDetailed results:');
    results.results.forEach((result, index) => {
        console.log(`\nTask ${index + 1}:`);
        console.log(`  Success: ${result.success}`);
        console.log(`  Attempts: ${result.attempts || 1}`);
        if (result.success) {
            console.log(`  Data: ${JSON.stringify(result.data)}`);
        } else {
            console.log(`  Error: ${result.error}`);
            console.log(`  Retryable: ${result.retryable}`);
        }
    });
    
    // Test batch configuration
    console.log('\n\n=== Testing Batch Configuration ===\n');
    
    const criticalTask = async () => {
        console.log('  Critical task executing...');
        return { success: true, data: 'Critical data' };
    };
    
    const nonCriticalTask = async () => {
        console.log('  Non-critical task executing...');
        const error = new Error('Temporary failure');
        error.status = 503;
        throw error;
    };
    
    const batchTasks = [criticalTask, nonCriticalTask];
    const batchConfigs = [
        { maxRetries: 5, initialDelay: 200, maxDelay: 10000 }, // Critical
        { maxRetries: 2, initialDelay: 100, maxDelay: 5000 }   // Non-critical
    ];
    
    const batchResults = await rateLimiter.executeMany(
        batchTasks,
        null,
        batchConfigs
    );
    
    console.log('\nBatch results:');
    console.log(`Successful: ${batchResults.successCount}`);
    console.log(`Failed: ${batchResults.errorCount}`);
}

// Run the tests
testRetryLogic().catch(console.error);