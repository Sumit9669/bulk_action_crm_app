// AuthController.ts
import { Request, Response } from 'express';
import { LoginOperationService, SignUpOperationService } from '../services';
const signupOpsSvc = new SignUpOperationService();
const loginOpsSvc = new LoginOperationService();
class AuthController {
   

    async createUser(req: Request, res: Response): Promise<void> {
        try {
            const requestBody = req.body;
            const result = await signupOpsSvc.registerUser(requestBody);
            res.status(200).json({ message: 'User created successfully' });
        } catch (error: any) {
            console.log(error);
            res.status(500).json({ message: 'Error creating user', error: error.message });
        }
    }

    async loginUser(req: Request, res: Response): Promise<void> {
        try {
            const requestBody = req.body;
            const result = await loginOpsSvc.loginUser(requestBody);
            res.status(200).json({ message: 'User logged in successfully', data: result });
        } catch (error: any) {
            console.log(error);
            res.status(500).json({ message: 'Error logging in user', error: error.message });
        }
    }

    async logout(req: Request, res: Response): Promise<void> {
        try {
            await loginOpsSvc.logoutUser();
            res.status(200).json({ message: 'User logged out successfully' });
        } catch (error: any) {
            console.log(error);
            res.status(500).json({ message: 'Error logging out user', error: error.message });
        }
    }

    async refreshToken(req: Request, res: Response): Promise<void> {
        try {
            const refreshToken = req.body.refreshToken;
            const result = await loginOpsSvc.refreshToken(refreshToken);
            res.status(200).json({ message: 'Token refreshed successfully', data: result });
        } catch (error: any) {
            console.log(error);
            res.status(500).json({ message: 'Error refreshing token', error: error.message });
        }
    }
}

export default new AuthController();
