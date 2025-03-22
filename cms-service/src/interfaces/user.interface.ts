import {Document} from 'mongoose';
export interface IUser extends Document {
  _id:string
  name: string;
  username?: string;
  email: string;
  password: string;

  role: string;
}