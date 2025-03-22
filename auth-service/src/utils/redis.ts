import { createClient, RedisClientOptions } from "redis";
require("dotenv").config();
// import { createPool, Pool } from "generic-pool";

const REDIS_URL =  process.env.REDIS_URL || "redis://localhost:6379";

if (!REDIS_URL) {
  throw new Error("REDIS_URL environment variable is not defined");
}

// Custom retry strategy
const retryStrategy = (attempt: number): number | Error => {
  const maxRetries = 5; // Maximum retry attempts
  if (attempt > maxRetries) {
    console.error("Exceeded maximum retries. Failing...");
    return new Error("Could not connect to Redis after maximum retries.");
  }
  const retryDelay = attempt * 1000; // Exponential backoff (e.g., 1000ms, 2000ms, etc.)
  console.log(`Retrying connection... Attempt: ${attempt}, Delay: ${retryDelay} ms`);
  return retryDelay; // Return delay in milliseconds
};

// Redis client options
const redisOptions: RedisClientOptions = {
  url: REDIS_URL,
  socket: {
    // connectTimeout: 5000, // Connection timeout in milliseconds
    reconnectStrategy: retryStrategy, // Retry strategy for reconnection
  },
};

export const redis = createClient(redisOptions);


(async () => {
  try {

    await handleRedisConnection(redis, "basic");

    console.log("Redis connected.");

  } catch (error) {
    console.error("Error during Redis connection or Pub/Sub:", error);
  }
})();

/**
 * Handles Redis connection with error and retry monitoring.
 */
async function handleRedisConnection(client: ReturnType<typeof createClient>, connectionFor: string = "") {
  client.on("error", (err) => {
    console.error(`Redis client - ${connectionFor} error:`, err.message);
  });

  // client.on('reconnecting', (delay) => {
  //   console.log(`Redis reconnecting in ${delay} ms...`);
  // });

  client.on("ready", () => {
    console.log(`Redis client - ${connectionFor} is ready.`);
  });

  try {
    await client.connect();
  } catch (err) {
    console.error("Initial connection failed, retrying if applicable...");
    throw err; // Let the retry mechanism handle this
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down...");

  await redis.quit();

  process.exit(0);
});