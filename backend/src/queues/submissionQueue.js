// src/queues/submissionQueue.js
// Submission queue abstraction.
//
// If `REDIS_URL` is set, we use BullMQ (durable, multi-instance). Otherwise we
// fall back to an in-memory queue with bounded concurrency. Both paths expose
// the same `enqueue(job)` API and emit 'completed' / 'failed' events.
import { env } from '../config/env.js';
import { APP_NAME } from '../config/constants.js';

const CONCURRENCY = 2; // how many submissions we evaluate in parallel

// ---------------------------------------------------------------------------
// BullMQ-backed implementation (when REDIS_URL is set)
// ---------------------------------------------------------------------------
let bullQueue = null;
let inMemoryQueue = null;

if (env.REDIS_URL) {
  try {
    const { Queue } = await import('bullmq');
    const connection = {
      url: env.REDIS_URL,
      maxRetriesPerRequest: null, // BullMQ requires this on Redis Cluster / ioredis
    };
    bullQueue = new Queue('sanchivue-submissions', {
      connection,
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 200,
        removeOnFail: 100,
      },
    });
    // We DON'T start the Worker here — the submissionWorker.js does that.
    console.log(`[${APP_NAME}] Submission queue: BullMQ (Redis at ${env.REDIS_URL})`);
  } catch (err) {
    console.warn(
      `[${APP_NAME}] BullMQ unavailable (${err.message}); falling back to in-memory queue.`,
    );
    bullQueue = null;
  }
}

// ---------------------------------------------------------------------------
// In-memory queue implementation
// ---------------------------------------------------------------------------
class InMemoryQueue {
  constructor() {
    this.queue = [];
    this.running = 0;
    this.handlers = { completed: [], failed: [] };
    this.stopped = false;
    this.processQueue();
  }

  on(event, handler) {
    if (!this.handlers[event]) this.handlers[event] = [];
    this.handlers[event].push(handler);
  }

  emit(event, payload) {
    (this.handlers[event] || []).forEach((h) => {
      try {
        h(payload);
      } catch (err) {
        console.warn(`[${APP_NAME}] in-memory queue handler error:`, err.message);
      }
    });
  }

  async enqueue(data) {
    const job = {
      id: `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      data,
      attempts: 0,
    };
    this.queue.push(job);
    this.processQueue();
    return job;
  }

  async processQueue() {
    while (!this.stopped && this.queue.length > 0 && this.running < CONCURRENCY) {
      const job = this.queue.shift();
      this.running++;
      // Fire and forget — the worker subscribes via on('completed').
      // We call the processor lazily so this module stays decoupled.
      try {
        const processor = this.processor;
        if (!processor) {
          // No processor yet — requeue and wait.
          this.queue.unshift(job);
          this.running--;
          setTimeout(() => this.processQueue(), 50);
          return;
        }
        const result = await processor(job);
        this.emit('completed', { job, result });
      } catch (err) {
        job.attempts++;
        this.emit('failed', { job, error: err });
      } finally {
        this.running--;
      }
      // Kick the queue again in case more jobs arrived.
      setImmediate(() => this.processQueue());
    }
  }

  setProcessor(fn) {
    this.processor = fn;
    this.processQueue();
  }

  async close() {
    this.stopped = true;
  }
}

// Pick the right backend at import time.
let queue;
if (bullQueue) {
  queue = {
    type: 'bullmq',
    async enqueue(data) {
      const job = await bullQueue.add('submission', data);
      return job;
    },
    on(event, handler) {
      // BullMQ events live on the Worker, not the Queue. Worker module wires these.
      // We stash them so the worker can subscribe.
      if (!queue._handlers) queue._handlers = {};
      if (!queue._handlers[event]) queue._handlers[event] = [];
      queue._handlers[event].push(handler);
    },
    getQueue() {
      return bullQueue;
    },
  };
} else {
  inMemoryQueue = new InMemoryQueue();
  console.log(`[${APP_NAME}] Submission queue: in-memory (concurrency=${CONCURRENCY})`);
  queue = {
    type: 'in-memory',
    async enqueue(data) {
      return inMemoryQueue.enqueue(data);
    },
    on(event, handler) {
      inMemoryQueue.on(event, handler);
    },
    setProcessor(fn) {
      inMemoryQueue.setProcessor(fn);
    },
    async close() {
      return inMemoryQueue.close();
    },
    getQueue() {
      return inMemoryQueue;
    },
  };
}

export const submissionQueue = queue;
export default submissionQueue;
