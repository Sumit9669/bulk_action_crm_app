import { Request, Response } from 'express';
import { UploadFileOPerationService } from '../services/upload-file-operations.service';
import { statusCodes } from '../constants/common.constants';
import path from 'path';
import fs from 'fs';
import { DataOperationService } from '../services/data-operations.service';

const uploadFileOpsSvc = new UploadFileOPerationService();
const dataOpsSvc = new DataOperationService();
class UploadFileController {
    // Upload file API
    async uploadFile(req: Request, res: Response): Promise<any> {
        try {
            const type = req.params.type; // File type passed in the route parameter
            const action = req.params.action;
            // Check if file exists in request
            if (!req.file) {
                
                return res.status(400).send({ message: 'No file uploaded!' });
            }

            // Get the file buffer from request
            const fileBuffer = req.file.buffer;
            const fileName = req.file.originalname;
            // Call the service to process the file
            await uploadFileOpsSvc.uploadFile(fileBuffer, Number(type),fileName, Number(action));

            // Respond to the client
            res.status(statusCodes.OK).send({
                message: 'File saved successfully and being processed!',
            });
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ message: 'Error uploading file', error: error.message });
        }
    }

    
    async listBulkActions(req: Request, res: Response): Promise<any> {
        try {
          // get list of current bulk actions
          const result = await dataOpsSvc.getBulkOperationList();
          res.status(statusCodes.OK).send({
            message: 'List of Bulk Actions',
            data: result,
            metaData:{
                pageNumber:1,
                limit:10,
                TotalRecords: 100
            }
        });
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ message: 'Error during bulk update', error: error.message });
        }
    }

    async bulkActionDetailById(req: Request, res: Response): Promise<any> {
        try {
          // get list of current bulk actions
          const result = await dataOpsSvc.bulkOperationDetailById(req.params.actionId);
          res.status(statusCodes.OK).send({
            message: 'List of Bulk Actions',
            data: result,
            metaData:{
                pageNumber:1,
                limit:10,
                TotalRecords: 100
            }
        });
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ message: 'Error during bulk update', error: error.message });
        }
    }

    async bulkActionStats(req: Request, res: Response): Promise<any> {
        try {
          // get list of current bulk actions
          const result = await dataOpsSvc.bulkOperationStatsDetailsById(req.params.actionId);
          res.status(statusCodes.OK).send({
            message: 'List of Bulk Actions',
            data: result,
            metaData:{
                pageNumber:1,
                limit:10,
                TotalRecords: 100
            }
        });
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ message: 'Error during bulk update', error: error.message });
        }
    }
}

export default new UploadFileController();
