import userModel, { IUser } from "../models/users.model";
import ErrorHandler from "../utils/error-handler";


export class SignUpOperationService{
    constructor(){

    }

   async registerUser(requestBody:any){

    try {
        const {
            name,
            username,
            email,
            password,
        } = requestBody;

        const isEmailExist=  await userModel.findOne({ email });
        if (password) {
            const passwordRegex =
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,20}$/;
            if (!password.match(passwordRegex)) {
                throw new Error('Password must contain at least one uppercase letter, one lowercase letter, one number, one symbol, and be between 6 and 20 characters long'
                );
            }
        }
        if (isEmailExist) {
            throw new Error('Email already exist');
        }


        const user = {
            name,
            username,
            email,
            password,
            role: 'user',
        } as IUser;


        const userDetail = await this.saveUserDetail(user);

        return true;

        
    } catch (error: any) {
        throw new Error(error.message);
    }
   }
    async saveUserDetail(user: IUser) {
        await userModel.insertOne(user);
        return true
    }

}