import { Request } from "express";
import IUser from '../interfaces/user.interface';  // Import your IUser interface

declare global {
  namespace Express {
    interface Request {
      user?: IUser;  // Optionally allow `user` to be undefined
    }
  }
}
