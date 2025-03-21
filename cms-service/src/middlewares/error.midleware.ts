import { NextFunction, Request, Response } from "express";

export const ErrorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal server error";

  // If it's a Joi validation error
  if (err?.error?.isJoi) {
    return res.status(400).json({ error: "Validation Error", details: err.error });
  }

  return res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};
