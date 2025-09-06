class RateLimiter {
    constructor(maxConcurrent = 10, delayMs = 50) {
        this.maxConcurrent = maxConcurrent;
        this.delayMs = delayMs;
        this.activeRequests = 0;
        this.queue = [];
        this.lastRequestTime = 0;
    }

    async throttle() {
        // Wait if we've hit the concurrent limit
        while (this.activeRequests >= this.maxConcurrent) {
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        // Ensure minimum delay between requests
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.delayMs) {
            await new Promise(resolve => setTimeout(resolve, this.delayMs - timeSinceLastRequest));
        }

        this.activeRequests++;
        this.lastRequestTime = Date.now();
    }

    release() {
        this.activeRequests--;
    }

    async execute(fn) {
        await this.throttle();
        try {
            const result = await fn();
            return result;
        } finally {
            this.release();
        }
    }

    // Execute multiple functions with rate limiting
    async executeMany(fns, onProgress = null) {
        const results = [];
        const errors = [];
        const total = fns.length;
        let completed = 0;

        const promises = fns.map(async (fn, index) => {
            try {
                const result = await this.execute(fn);
                results[index] = { success: true, data: result };
                completed++;
                
                if (onProgress) {
                    onProgress({
                        completed,
                        total,
                        percentage: Math.round((completed / total) * 100)
                    });
                }
            } catch (error) {
                results[index] = { success: false, error: error.message, fullError: error };
                errors.push({ index, error });
                completed++;
                
                if (onProgress) {
                    onProgress({
                        completed,
                        total,
                        percentage: Math.round((completed / total) * 100),
                        error: true
                    });
                }
            }
        });

        await Promise.all(promises);

        return {
            results,
            errors,
            stats: {
                total,
                successful: results.filter(r => r.success).length,
                failed: errors.length
            }
        };
    }

    // Retry failed requests with exponential backoff
    async retryWithBackoff(fn, maxRetries = 3, initialDelay = 1000) {
        let lastError;
        
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                return await this.execute(fn);
            } catch (error) {
                lastError = error;
                
                if (attempt < maxRetries - 1) {
                    const delay = initialDelay * Math.pow(2, attempt);
                    console.log(`Retry attempt ${attempt + 1} after ${delay}ms delay`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        throw lastError;
    }
}

export default RateLimiter;