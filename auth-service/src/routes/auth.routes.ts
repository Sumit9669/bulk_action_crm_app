import { Router } from 'express';
import AuthController from '../controllers/auth.controller';
import { isAuthenticated } from '../middlewares/auth.middleware';
const authRouter = Router();

// Define the routes and associate them with controller methods
authRouter.post('/register', AuthController.createUser);          // Create a new contact
authRouter.post('/login', AuthController.loginUser);           // Get all contacts
authRouter.post('/refresh-token', AuthController.refreshToken);      // Get a contact by ID
authRouter.get('/logout', isAuthenticated,AuthController.logout);      // Get a contact by ID
export default authRouter;
