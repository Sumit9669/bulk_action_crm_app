import { Router } from 'express';
import uploadFileController from '../controllers/bulk-actions.controller';
import upload from '../middlewares/upload-file.middleware';
import { isAuthenticated } from '../middlewares/auth.middleware';

const uploadFileRouter = Router();

// Define the routes and associate them with controller methods
uploadFileRouter.get('/bulk-actions', isAuthenticated,uploadFileController.listBulkActions);   
uploadFileRouter.post('/bulk-actions/:type',upload,isAuthenticated, uploadFileController.uploadFile);          // Create a new contact
uploadFileRouter.get('/bulk-actions/:actionId', isAuthenticated,uploadFileController.bulkActionDetailById);
uploadFileRouter.get('/bulk-actions/:actionId/stat',isAuthenticated, uploadFileController.bulkActionStats);
export default uploadFileRouter;
