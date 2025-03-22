// src/interfaces/express.d.ts
import { Request } from "express";

declare module "express" {
  interface Request {
    user?: Record<string, any>;  // Add user to request
  }
}
