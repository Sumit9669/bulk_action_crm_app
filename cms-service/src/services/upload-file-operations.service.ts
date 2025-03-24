import fs from 'fs';
import path from 'path';
import { IContact } from '../models/contacts.model';
import { ContactsRepository } from '../repositories/contacts.repository';
import csvParser from 'csv-parser';
import { v4 as uuidv4 } from 'uuid';
import { BatchInsetionOperationService } from './batch-insertion-operation.service';
import { RawFileRepository } from '../repositories/rawFile.repository'
import RawFileModel from '../models/raw-files.model';
import { FileActions } from '../interfaces/enums/common.enum';
import { BatchUpdateOperationService } from './batch-update-operations.service';
import { redis } from '../utils/redis';
const bactchInsertSvc = new BatchInsetionOperationService();
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
    /**
     * The function `uploadFile` asynchronously uploads a file, saves it to disk, converts it to JSON,
     * processes the JSON data, and then cleans up the temporary files.
     * @param {Buffer} fileBuffer - The `fileBuffer` parameter is a Buffer containing the data of the file
     * to be uploaded. It represents the content of the file in binary format.
     * @param {number} fileType - The `fileType` parameter in the `uploadFile` function represents the type
     * of the file being uploaded. It is a number that can be used to categorize or identify different
     * types of files. This parameter can be used within the function to determine how to process or handle
     * the uploaded file based on
     * @param {string} originalFileName - The `originalFileName` parameter in the `uploadFile` function
     * represents the name of the file being uploaded. It is a string that typically includes the original
     * name of the file before any modifications or processing.
     * @param {FileActions} action - The `action` parameter in the `uploadFile` function represents the
     * type of action to be performed on the file. It is of type `FileActions`, which likely is an enum or
     * a set of predefined constants that define different actions that can be taken on the file. Examples
     * of actions could include
     * @param {string} accountId - The `accountId` parameter in the `uploadFile` function represents the
     * unique identifier associated with the account to which the file upload operation is related. This
     * identifier is used to associate the uploaded file with a specific account for further processing or
     * storage.
     * @param {string} scheduleTime - The `scheduleTime` parameter in the `uploadFile` function is a string
     * representing the time at which the file should be scheduled for processing. It is optional and can
     * be provided in a specific format, such as a date and time string. If `scheduleTime` is provided, it
     * will be
     * @returns The `uploadFile` function returns a Promise that resolves to a boolean value (`true`)
     * indicating whether the file upload and processing were successful.
     */
    async uploadFile(fileBuffer: Buffer, fileType: number, originalFileName: string, action: FileActions, accountId: string, scheduleTime: string): Promise<boolean> {
        try {
            // Generate a unique file name using timestamp and extension
            const fileName = `${originalFileName}.${Date.now()}.csv`;
            const filePath = path.join(this.uploadsDir, fileName);

            // Save the buffer (file data) to the disk
            fs.writeFileSync(filePath, fileBuffer);

            console.log('File saved successfully:', filePath);
            const requestScheduleTime = scheduleTime ? new Date(scheduleTime) : undefined;
            // Convert CSV to JSON and save it in the temporary location
            const jsonFilePath = await this.convertCsvToJson(filePath, originalFileName, accountId,);

            // Process the JSON file (e.g., insert into database)
            this.processJsonFile(jsonFilePath, fileType, originalFileName, action, accountId, requestScheduleTime);

            // Clean up the temporary file
            fs.unlinkSync(filePath);  // Optionally delete the original file after processing
            return true;
        } catch (error: any) {
            console.error('Error uploading file:', error);
            throw error;
        }
    }


    /**
     * The function `convertCsvToJson` asynchronously converts a CSV file to JSON format and returns the
     * path to the saved JSON file.
     * @param {string} csvFilePath - The `csvFilePath` parameter in the `convertCsvToJson` function is the
     * file path to the CSV file that you want to convert to JSON.
     * @param {string} originalFileName - The `originalFileName` parameter in the `convertCsvToJson`
     * function represents the name of the original CSV file that is being converted to JSON. It is used to
     * generate a unique JSON file name by appending a UUID to it.
     * @param {string} accountId - The `accountId` parameter in the `convertCsvToJson` function represents
     * the unique identifier associated with a specific account. This identifier is used to associate the
     * account with the data being processed from the CSV file.
     * @returns The `convertCsvToJson` function returns a Promise that resolves with the path to the saved
     * JSON file after converting a CSV file to JSON format.
     */
    private async convertCsvToJson(csvFilePath: string, originalFileName: string, accountId: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const results: any[] = [];
            const jsonFileName = `${originalFileName}_${uuidv4()}.json`; // Create a unique JSON file name
            const jsonFilePath = path.join(this.tempDir, jsonFileName);

            // Create a readable stream for the uploaded CSV file
            fs.createReadStream(csvFilePath)
                .pipe(csvParser()) // Parse the CSV content
                .on('data', (data) => results.push({
                    accountId,
                    ...data
                })) // Push parsed rows to results
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

    /**
     * This TypeScript function processes a JSON file by reading its data, saving its path in a database,
     * and performing batch operations based on specified parameters.
     * @param {string} jsonFilePath - The `jsonFilePath` parameter is the file path to the JSON file that
     * you want to process.
     * @param {number} fileType - The `fileType` parameter in the `processJsonFile` function represents the
     * type of the file being processed. It is a number that indicates the type of the file, such as 1 for
     * text files, 2 for image files, etc. This parameter helps in identifying the type of file
     * @param {string} originalFileName - The `originalFileName` parameter in the `processJsonFile`
     * function represents the name of the original file that is being processed. It is used to store the
     * original file name in the database for reference and logging purposes.
     * @param {FileActions} action - The `action` parameter in the `processJsonFile` function represents
     * the type of action to be performed on the JSON file. It is of type `FileActions`, which is an enum
     * or constant that likely defines different actions such as `UPDATE` or `INSERT`. Depending on the
     * value of `
     * @param {string} accountId - The `accountId` parameter in the `processJsonFile` function represents
     * the unique identifier of the account for which the JSON file is being processed. It is used to
     * associate the file processing with a specific account in the system.
     * @param {Date} [scheduleTime] - The `scheduleTime` parameter in the `processJsonFile` function is a
     * optional parameter of type `Date`. It represents the time at which the file processing is scheduled
     * to occur. If a `scheduleTime` is provided, the file processing will be scheduled for that specific
     * time. If `schedule
     */

    private async processJsonFile(jsonFilePath: string, fileType: number, originalFileName: string, action: FileActions, accountId: string, scheduleTime?: Date): Promise<void> {
        try {
            // Read the JSON file
            const fileData = fs.readFileSync(jsonFilePath, 'utf8');
            const jsonData = JSON.parse(fileData); // Parse the JSON data

            // save json file path in db
            const rawFile = new RawFileModel({
                fileName: originalFileName,
                filePath: jsonFilePath,
                fileType,
                actionType: action,
                accountId,
                scheduleTime: scheduleTime ?? Date.now(),
                isScheduled: scheduleTime ? true : false
            });
            await this.rawFileRepository.add(rawFile);
            // update event rate limit for user
            const currentLimit = await redis.get(`rate-limit:${accountId}`);
            redis.set(`rate-limit:${accountId}`, currentLimit+Number(jsonData.length >0?jsonData.length :1),{EX:60});
            // call batch insert method to initiate insertion
            if (!rawFile.isScheduled) {
                if (action === FileActions.UPDATE) {
                    await batchUpdateOps.updateBulkData(jsonData, 0, rawFile._id.toString(), action, accountId);
                } else {
                    await bactchInsertSvc.insertDataInDb(jsonData, 0, rawFile._id.toString(), action, accountId);
                }
            }
            fs.unlinkSync(jsonFilePath);
        } catch (error: any) {
            console.error('Error processing JSON file:', error);
            throw error;
        }
    }
}
