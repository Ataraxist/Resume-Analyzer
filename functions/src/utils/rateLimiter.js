class RateLimiter {
    constructor(maxConcurrent = 10, delayMs = 200, retryConfig = {}) {
        this.maxConcurrent = maxConcurrent;
        this.delayMs = delayMs;
        this.queue = [];
        this.activeTasks = 0;
        this.lastRequestTime = 0;
        
        // Retry configuration
        this.retryConfig = {
            maxRetries: retryConfig.maxRetries || 3,
            initialDelay: retryConfig.initialDelay || 100,
            maxDelay: retryConfig.maxDelay || 5000,
            backoffMultiplier: retryConfig.backoffMultiplier || 2,
            retryableErrors: retryConfig.retryableErrors || ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND']
        };
    }

    async execute(task, taskConfig = {}) {
        return new Promise((resolve, reject) => {
            const config = { ...this.retryConfig, ...taskConfig };
            this.queue.push({ task, resolve, reject, config, attempts: 0 });
            this.processQueue();
        });
    }

    async executeMany(tasks, progressCallback = null, taskConfigs = []) {
        const results = [];
        const errors = [];
        let completed = 0;

        const promises = tasks.map((task, index) => {
            const config = taskConfigs[index] || {};
            return this.execute(task, config)
                .then(data => {
                    results[index] = { 
                        success: true, 
                        data,
                        attempts: 1 // Will be updated by retry logic
                    };
                    completed++;
                    if (progressCallback) {
                        progressCallback({
                            completed,
                            total: tasks.length,
                            percentage: Math.round((completed / tasks.length) * 100)
                        });
                    }
                })
                .catch(error => {
                    results[index] = { 
                        success: false, 
                        error: error.message,
                        fullError: error,
                        retryable: this.isRetryableError(error),
                        attempts: error.attempts || 1
                    };
                    errors.push({ index, error });
                    completed++;
                    if (progressCallback) {
                        progressCallback({
                            completed,
                            total: tasks.length,
                            percentage: Math.round((completed / tasks.length) * 100),
                            failedCount: errors.length
                        });
                    }
                });
        });

        await Promise.allSettled(promises);

        return {
            results,
            errors,
            successCount: results.filter(r => r.success).length,
            errorCount: errors.length,
            retryableErrors: errors.filter(e => this.isRetryableError(e.error)).length
        };
    }

    async processQueue() {
        while (this.queue.length > 0 && this.activeTasks < this.maxConcurrent) {
            const now = Date.now();
            const timeSinceLastRequest = now - this.lastRequestTime;

            if (timeSinceLastRequest < this.delayMs) {
                await this.delay(this.delayMs - timeSinceLastRequest);
            }

            // Double-check queue isn't empty (might have changed during delay)
            if (this.queue.length === 0) {
                break;
            }

            const item = this.queue.shift();
            this.activeTasks++;
            this.lastRequestTime = Date.now();

            this.executeWithRetry(item)
                .finally(() => {
                    this.activeTasks--;
                    this.processQueue();
                });
        }
    }

    async executeWithRetry(item) {
        const { task, resolve, reject, config, attempts } = item;
        
        try {
            const result = await task();
            resolve(result);
        } catch (error) {
            item.attempts = attempts + 1;
            
            // Check if we should retry
            if (this.shouldRetry(error, item.attempts, config)) {
                const delay = this.calculateRetryDelay(item.attempts, config);
                
                await this.delay(delay);
                
                // Re-queue the task with updated attempt count
                this.queue.unshift({
                    ...item,
                    attempts: item.attempts
                });
                this.processQueue();
            } else {
                // Add attempts count to error for tracking
                error.attempts = item.attempts;
                reject(error);
            }
        }
    }

    shouldRetry(error, attempts, config) {
        // Don't retry if max attempts reached
        if (attempts >= config.maxRetries) {
            return false;
        }

        // Check status code for HTTP errors
        if (error.status) {
            // Don't retry client errors (except 429 - rate limit)
            if (error.status >= 400 && error.status < 500 && error.status !== 429) {
                return false;
            }
            // Retry server errors and rate limits
            if (error.status >= 500 || error.status === 429) {
                return true;
            }
        }

        // Check error code/message for network errors
        if (error.code) {
            return config.retryableErrors.includes(error.code);
        }

        // Check for specific error messages
        if (error.message) {
            const retryableMessages = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'network', 'fetch failed'];
            return retryableMessages.some(msg => 
                error.message.toLowerCase().includes(msg.toLowerCase())
            );
        }

        // Default to retry for unknown errors
        return true;
    }

    calculateRetryDelay(attempts, config) {
        // Exponential backoff with jitter
        const baseDelay = config.initialDelay * Math.pow(config.backoffMultiplier, attempts - 1);
        const jitter = Math.random() * 0.3 * baseDelay; // Add up to 30% jitter
        return Math.min(baseDelay + jitter, config.maxDelay);
    }

    isRetryableError(error) {
        // Check if error could be retried (for reporting purposes)
        if (error.status && error.status >= 400 && error.status < 500 && error.status !== 429) {
            return false;
        }
        return true;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Get current queue status
    getStatus() {
        return {
            queueLength: this.queue.length,
            activeTasks: this.activeTasks,
            maxConcurrent: this.maxConcurrent
        };
    }

    // Clear the queue
    clear() {
        this.queue = [];
    }
}

module.exports = RateLimiter;