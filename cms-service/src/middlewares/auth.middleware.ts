import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { errorMessages, statusCodes } from '../constants/common.constants';
import ErrorHandler from '../utils/error-handler';
import { CatchAsyncError } from './catch-async-error.midleware';
import { redis } from '../utils/redis';
import { rateLimiter } from './rate-limiter-middleware';

// authenticated user
export const isAuthenticated = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const access_token = req?.cookies?.access_token || req?.headers?.authorization?.split(' ')[1];

      if (!access_token) {
        return next(new ErrorHandler(errorMessages.AUTH_ACCESS_ERROR, statusCodes.UNAUTHORIZED));
      }

      // Check if the access token is expired
      const decoded = jwt.verify(access_token, process.env.ACCESS_TOKEN as string) as JwtPayload;

      if (!decoded) {
        return next(new ErrorHandler(errorMessages.AUTH_TOKEN_MISSING, statusCodes.UNAUTHORIZED));
      }

      const user = await getUser(decoded.id);
      if (!user) {
        return next(new ErrorHandler(errorMessages.AUTH_ACCESS_ERROR, statusCodes.UNAUTHORIZED));
      }

      (req as any).user = user;  // Assign the user to req.user
      await rateLimiter(req, res, next);

    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        // Token has expired
        return next(new ErrorHandler(errorMessages.AUTH_TOKEN_EXPIRED, statusCodes.UNAUTHORIZED));
      }

      console.log("Error in authentication: ", error);
      return next(new ErrorHandler(error.message, statusCodes.UNAUTHORIZED));
    }
  }
);


// Fetch user from Redis based on the userId
async function getUser(userId: string) {
  const cacheKey = `user-${userId}`;
  try {
    let user: string | null = await redis.get(cacheKey);
    if (!user) {
      return null;
    }

    return JSON.parse(user); // Parse and return the user object
  } catch (Ex) {
    console.error(Ex); // Log the error
    return null;
  }
}
