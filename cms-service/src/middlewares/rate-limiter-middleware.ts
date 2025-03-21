import { Request, Response, NextFunction } from 'express';
import { redis } from '../utils/redis'; // Your Redis connection utility

const RATE_LIMIT = 10000; // 10k requests per minute
const TTL = 60; // 60 seconds (1 minute)

export const rateLimiter = async (req: Request, res: Response, next: NextFunction) => {
  const accountId = req.body.accountId; // Assuming accountId comes in the body or headers

  if (!accountId) {
    return res.status(400).json({ message: 'AccountId is required' });
  }

  const redisKey = `rate-limit:${accountId}`;

  try {
    // Check the current request count from Redis
    const currentRequestCount = await redis.get(redisKey);

    if (currentRequestCount) {
      if (parseInt(currentRequestCount) >= RATE_LIMIT) {
        // Rate limit exceeded, reject the request
        return res.status(429).json({ message: 'Rate limit exceeded. Try again later.' });
      }

      // Increment the counter
      await redis.incr(redisKey);
    } else {
      // If no count exists, set it and add TTL (1 minute)
      await redis.set(redisKey, 1, { EX: TTL });
    }

    next();
  } catch (error) {
    console.error('Error with rate limiter:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
