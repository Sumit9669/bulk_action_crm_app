import { NextFunction, Request, Response } from 'express';
import { UploadFileOPerationService } from '../services/upload-file-operations.service';
import { statusCodes } from '../constants/common.constants';
import path from 'path';
import fs from 'fs';
import { DataOperationService } from '../services/data-operations.service';
import uploadPromise from '../middlewares/upload-file.middleware';
import ErrorHandler from '../utils/error-handler';
// import '../types/custom';
const uploadFileOpsSvc = new UploadFileOPerationService();
const dataOpsSvc = new DataOperationService();
class UploadFileController {
    // Upload file API
    async uploadFile(req: Request, res: Response): Promise<any> {
        try {
            const type = req.params.type; // File type passed in the route parameter
            
            // Check if file exists in request
            if (!req.file) {
                
                return res.status(400).send({ message: 'No file uploaded!' });
            }

            // Get the file buffer from request
            const fileBuffer = req.file.buffer;
            const fileName = req.file.originalname;
            const action = req.body.action;
            const scheduleTime = req.body.requestScheduleTime;
            const userId = req.user._id.toString();
            // Call the service to process the file
            uploadFileOpsSvc.uploadFile(fileBuffer, Number(type),fileName, Number(action), userId,scheduleTime);

            // Respond to the client
            res.status(statusCodes.OK).send({
                message: 'File saved successfully and being processed!',
            });
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ message: 'Error uploading file', error: error.message });
        }
    }

    
    async listBulkActions(req: Request, res: Response,next:NextFunction): Promise<any> {
        try {
            // get list of current bulk actions
            const accountId = req.user._id.toString();
            const result = await dataOpsSvc.getBulkOperationList(accountId);
            
            // Respond with the list
            res.status(statusCodes.OK).send({
                message: 'List of Bulk Actions',
                data: result,
                metaData: {
                    pageNumber: 1,
                    limit: 10,
                    TotalRecords: 100
                }
            }); // Return here to make sure no further code is executed after this
            return;
        } catch (error: any) {
            console.error(error);
            next(new ErrorHandler('Error in fetching list', 500)); // Return after error response to stop further execution
        }
    }

    async bulkActionDetailById(req: Request, res: Response): Promise<any> {
        try {
          // get list of current bulk actions
          const accountId = req.user._id.toString();
          const actionId = req.params.actionId;
          const page = parseInt(req.query.page as string, 10) || 1;
          const result = await dataOpsSvc.bulkOperationDetailById(actionId,accountId, page);
          res.status(statusCodes.OK).send({
            message: 'Action Detail By Id',
            data: result[0].data,
            metaData:{
                pageNumber:page,
                limit:10,
                TotalRecords: result[0].totalCount
            }
        });
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching action detail', error: error.message });
        }
    }

    async bulkActionStats(req: Request, res: Response): Promise<any> {
        try {
          // get list of current bulk actions
          const result = await dataOpsSvc.bulkOperationStatsDetailsById(req.params.actionId);
          res.status(statusCodes.OK).send({
            message: 'Action Stats by Id',
            data: result
        });
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching action Stats', error: error.message });
        }
    }
}

export default new UploadFileController();
