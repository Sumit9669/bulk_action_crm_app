import { Request } from "express";
import {IUser} from './user.interface';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

// declare namespace Express {
//   export interface Request {
//     user?: any;
//   }
// }


// declare namespace Express {
//   export interface Request {
//       user: any;
//   }
//   export interface Response {
//       user: any;
//   }
// }