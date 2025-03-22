import userModel, { IUser } from "../models/users.model";
import ErrorHandler from "../utils/error-handler";
import { redis } from "../utils/redis";
import jwt from "jsonwebtoken";


export class LoginOperationService {
    constructor() {

    }

    async loginUser(requestBody: any) {
        const { emailOrUsername, password } = requestBody as {
            emailOrUsername: string;
            password: string;
        };

        if (!emailOrUsername || !password) {
            throw new ErrorHandler('Please enter email (or username) and password', 400)
        }

        let user: IUser | null;
        if (emailOrUsername.includes('@')) {
            user = (await userModel.findOne({ email: emailOrUsername }).select('+password')) as IUser;
        } else {
            user = (await userModel.findOne({ username: emailOrUsername }).select('+password')) as IUser;
        }

        if (!user) {
            throw new ErrorHandler('Invalid email (or username) or password', 401)
        }

        const isPasswordMatch = await user.comparePassword(password);

        if (!isPasswordMatch) {
            throw new ErrorHandler('Invalid email (or username) or password', 401)
        }

        // Password is correct, generate and send authentication tokens
        const tokenDetail = await this.createToken(user);
        return tokenDetail;

    }


    async logoutUser(refreshToken:string, userId:string) {
        redis.del(userId);
        redis.del(refreshToken);
        return true;
    }

    async refreshToken(refreshToken: string) {

    }

    createToken(user: IUser) {
        const accessToken = jwt.sign(
            { 
              id: user._id,
            },
            process.env.ACCESS_TOKEN as string,
            { expiresIn: "15d", algorithm: "HS256", issuer: process.env.JWT_ISSUER },
          );
        
          const refreshToken = jwt.sign(
            {   id: user._id},
            process.env.REFRESH_TOKEN as string,
            { expiresIn: "30d", issuer: process.env.JWT_ISSUER, algorithm: "HS256" },
          );
          redis.set(`user-${user._id.toString()}`,JSON.stringify(user), {EX:10000});
          redis.set(refreshToken,JSON.stringify(user), {EX:10000});
          return {accessToken, refreshToken}
    }
}