import fs from 'fs';
import path from 'path';
import { IContact } from '../models/contacts.model';
import { ContactsRepository } from '../repositories/contacts.repository';
import csvParser from 'csv-parser';
import { v4 as uuidv4 } from 'uuid';
import { BatchInsetionOperationService } from './batch-insertion-operation.service';
import {RawFileRepository} from '../repositories/rawFile.repository'
import RawFileModel from '../models/raw-files.model';
import { FileActions } from '../interfaces/enums/common.enum';
import { BatchUpdateOperationService } from './batch-update-operations.service';
const bactchInsertSvc = new  BatchInsetionOperationService();
const batchUpdateOps = new BatchUpdateOperationService();
export class UploadFileOPerationService {
   
    private rawFileRepository = new RawFileRepository();
    private uploadsDir: string;
    private tempDir: string;

    constructor() {
        // Define the uploads and temporary directories
        this.uploadsDir = path.join(__dirname, '..', 'uploads');
        this.tempDir = path.join(__dirname, '..', 'temp');

        // Create the uploads and temporary directories if they don't exist
        if (!fs.existsSync(this.uploadsDir)) {
            fs.mkdirSync(this.uploadsDir, { recursive: true });
        }
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }

    // File upload service method
    async uploadFile(fileBuffer: Buffer, fileType: number, originalFileName:string, action:FileActions  ): Promise<boolean > {
        try {
            // Generate a unique file name using timestamp and extension
            const fileName = `${originalFileName}.${Date.now()}.csv`;
            const filePath = path.join(this.uploadsDir, fileName);

            // Save the buffer (file data) to the disk
            fs.writeFileSync(filePath, fileBuffer);

            console.log('File saved successfully:', filePath);

            // Convert CSV to JSON and save it in the temporary location
            const jsonFilePath = await this.convertCsvToJson(filePath, originalFileName);

            // Process the JSON file (e.g., insert into database)
            this.processJsonFile(jsonFilePath, fileType, originalFileName, action);

            // Clean up the temporary file
            fs.unlinkSync(filePath);  // Optionally delete the original file after processing
            return true;
        } catch (error: any) {
            console.error('Error uploading file:', error);
            throw error;
        }
    }

    // Function to convert CSV file to JSON and save it in a temporary location
    private async convertCsvToJson(csvFilePath: string, originalFileName:string): Promise<string> {
        return new Promise((resolve, reject) => {
            const results: any[] = [];
            const jsonFileName = `${originalFileName}_${uuidv4()}.json`; // Create a unique JSON file name
            const jsonFilePath = path.join(this.tempDir, jsonFileName);

            // Create a readable stream for the uploaded CSV file
            fs.createReadStream(csvFilePath)
                .pipe(csvParser()) // Parse the CSV content
                .on('data', (data) => results.push(data)) // Push parsed rows to results
                .on('end', () => {
                    // Write the JSON data to a temporary file
                    fs.writeFileSync(jsonFilePath, JSON.stringify(results, null, 2));
                    console.log(`CSV converted to JSON: ${jsonFilePath}`);
                    resolve(jsonFilePath); // Return the path to the saved JSON file
                })
                .on('error', (error) => {
                    console.error('Error converting CSV to JSON:', error);
                    reject(error); // Reject the promise if there's an error
                });
        });
    }

    // Function to process the JSON file and store data in the database
    private async processJsonFile(jsonFilePath: string, fileType: number, originalFileName:string, action:FileActions, scheduleTime?:Date): Promise<void> {
        try {
            // Read the JSON file
            const fileData = fs.readFileSync(jsonFilePath, 'utf8');
            const jsonData = JSON.parse(fileData); // Parse the JSON data

            // save json file path in db
            const rawFile = new RawFileModel({
                fileName: originalFileName,
                filePath: jsonFilePath,
                fileType,
                actionType: FileActions.INSERT,
                scheduleTime: scheduleTime ?? Date.now(),
                isScheduled: scheduleTime ? true: false
            });
            await this.rawFileRepository.add(rawFile);
            // call batch insert method to initiate insertion
            if(!rawFile.isScheduled){
                if(action === FileActions.UPDATE){
                    await batchUpdateOps.updateBulkData(jsonData, 0, rawFile._id.toString());
                 } else {
                     await bactchInsertSvc.insertDataInDb(jsonData, 0, rawFile._id.toString());
                 }
            }

        } catch (error: any) {
            console.error('Error processing JSON file:', error);
            throw error;
        }
    }
}
