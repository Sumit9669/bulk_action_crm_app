
import { ContactsRepository } from '../repositories/contacts.repository';
import ContactModel from '../models/contacts.model';
import { RawFileRepository } from '../repositories/rawFile.repository';
import { IRawFile } from '../models/raw-files.model';
import { FileStatus, ValidationErrorType } from '../interfaces/enums/common.enum';
import { CommonMethods } from '../utils/common-methods';
import { ContactLogsRepository } from '../repositories/contact-logs.repository';

const contactsErrorLogsRepository = new ContactLogsRepository();
const contactsRepository = new ContactsRepository();
const commonMethods = new CommonMethods();
export class BatchInsetionOperationService {
    private rawFileRepository = new RawFileRepository();
    private skippedEntries: any[] = [];

    /**
     * The function `insertDataInDb` processes and inserts data into a database in batches, handling
     * validation, duplicates, and error logging.
     * @param {any} jsonData - The `jsonData` parameter in the `insertDataInDb` function represents the
     * array of data that needs to be inserted into the database. This data typically consists of contact
     * information such as name, email, phone number, etc. The function processes this data in batches to
     * optimize performance and handle any validation
     * @param {number} [startIndex=0] - The `startIndex` parameter in the `insertDataInDb` function is used
     * to specify the index from which the data processing should start within the provided JSON data
     * array. By default, it is set to 0, meaning that processing will start from the beginning of the
     * array unless a different starting index
     * @param {string} rawFileId - The `rawFileId` parameter in the `insertDataInDb` function represents
     * the unique identifier associated with the raw file being processed. This identifier is used to track
     * and manage the data imported from the file within the database. It helps in distinguishing different
     * sets of data and associating them with the
     * @param {number} actionType - The `actionType` parameter in the `insertDataInDb` function represents
     * the type of action being performed on the data. It is used to determine the specific operation or
     * action that needs to be taken for each item in the batch of data being processed. This could include
     * actions such as insertion,
     */
    async insertDataInDb(jsonData: any, startIndex: number = 0, rawFileId: string, actionType: number, accountId:string) {
        let batchIndex = startIndex;
        const totalContacts = jsonData.length;
        const batchSize = 20;
        let duplicateEnteries: any[] = [];
        try {
            for (batchIndex; batchIndex < totalContacts; batchIndex += batchSize) {
                // Slice the data into a batch of 'batchSize'
                const checkDuplicate = [];
                let batchData = jsonData.slice(batchIndex, batchIndex + batchSize);
                for (let i = 0; i < batchData.length; i++) {
                    const item = batchData[i];
                    item['rawFileId'] = rawFileId;

                    // Validate email and phone before processing
                    const validationResult = commonMethods.validateEmailAndPhone(item);
                    if (!validationResult.isValid) {
                        // If the entry is invalid, store it in skippedEntries
                        this.skippedEntries.push({
                            ...item,
                            actionType,
                            errorType: ValidationErrorType.VALDIATION_ERROR,
                            errorMetaData: validationResult.message
                        });
                        // Remove invalid item from the batch
                        batchData.splice(i, 1);
                        i--; // Adjust index after removal

                        continue; // Skip to the next item
                    }
                    checkDuplicate.push(item.email);
                    duplicateEnteries.push({
                        ...item,
                        actionType,
                        errorType: ValidationErrorType.DUPLICATE_DATA,
                        errorMetaData: validationResult.message
                    });
                }
                let currentSize = batchData.length;
                if (batchData.length) {
                    const duplicateData = await contactsRepository.getAll({ email: { $in: checkDuplicate } });
                    const duplicateEmails = [];
                    for (let item of duplicateData) {
                        duplicateEmails.push(item.email);
                    }
                    batchData = batchData.filter((item: any) => {
                        if (!duplicateEmails.includes(item.email)) {
                            return item;
                        }
                    })
                    batchData.forEach(item => {
                        const index = duplicateEmails.indexOf(item.email);
                        if (index !== -1) {
                            duplicateEmails.splice(index, 1);  // Remove item.email from duplicateEmails
                        }
                    });
                    duplicateEnteries = duplicateEnteries.filter((item: any) => {
                        if (duplicateEmails.includes(item.email)) {
                            return item;
                        }
                    })
                    if (batchData) {
                        await contactsRepository.addBulk(batchData);
                    }

                }


                // Update the batch index in the database or file (e.g., mark status as processed)
                await this.updateBatchStatus(batchIndex + currentSize, rawFileId, FileStatus.IN_PROGRESS, actionType,accountId);  // You can update the index after the batch is fully processed

            }
            await this.addSkippedData(rawFileId,actionType,accountId);
            await this.addDuplicateEnteries(duplicateEnteries,rawFileId,actionType,accountId);
            console.log('All data processed successfully.');
            // Optionally update the final status of the file in the database (indicating processing completion)
            await this.updateFinalStatus(rawFileId, batchIndex,actionType,accountId);

        } catch (err) {
            // If an error occurs, log and update the last processed batch index
            console.error('Error during batch processing:', err);
            await this.addSkippedData(rawFileId,actionType,accountId);
            // Update the batch index where the process failed
            await this.updateBatchStatus(batchIndex, rawFileId, FileStatus.PENDING, actionType,accountId);  // Update last successful batch index to resume from there
            await commonMethods.errorLogger({
                rawFileId,
                actionType,
                accountId,
                status: 0 ,
                errorDetail: `${err}`,
           
            });
            throw new Error(`Error occurred at batch index: ${batchIndex}`);

        }
    }


    // Function to update the batch processing status (e.g., to mark the last successful index)
    /**
     * The function `updateBatchStatus` updates the status of a batch process in a database or status
     * tracker.
     * @param {number} lastProcessedIndex - The `lastProcessedIndex` parameter is a number that represents
     * the index of the last processed batch in a sequence of batches. It is used to track the progress of
     * processing batches of data.
     * @param {string} id - The `id` parameter in the `updateBatchStatus` function is a unique identifier
     * for the batch or file being processed. It is used to locate the specific record in the database or
     * repository where the status information needs to be updated.
     * @param {FileStatus} status - The `status` parameter in the `updateBatchStatus` function represents
     * the status of a file processing batch. It is of type `FileStatus`, which could be an enum or a
     * custom type indicating different states such as "processing", "completed", "failed", etc. This
     * status is used to
     */
     async updateBatchStatus(lastProcessedIndex: number, id: string, status: FileStatus, actionType:number, accountId:string): Promise<void> {
        // You could save the last processed index in the database or update a status field to track progress
        try {
            // Update the status of the processing, e.g., in the database or status tracker
            // Assume there's a 'processingStatus' table where we store the last processed batch index
            const rawFilePayload = {
                currentDataIndex: lastProcessedIndex,
                status
            }
            await this.rawFileRepository.findOneAndUpdate(id, rawFilePayload);
            console.log(`Batch status updated: Last processed index is ${lastProcessedIndex}`);
        } catch (err) {
            console.error('Error updating batch status:', err);
            await commonMethods.errorLogger({
                rawFileId:id,
                actionType,
                accountId,
                status: 0 ,
                errorDetail: `${err}`,
           
            });
        }
    }

    /* The `updateFinalStatus` function is responsible for updating the final processing status of a file
    in the database. It takes two parameters: `rawFileId` which is the identifier of the raw file being
    processed, and `processedIndex` which represents the index up to which the processing has been
    completed. */
    // Function to update final processing status in the database (e.g., marking the file as fully processed)
     async updateFinalStatus(rawFileId: string, processedIndex: number,actionType:number,accountId:string): Promise<void> {
        try {
            // Update final processing status (e.g., mark the file processing as completed)
            const rawFilePayload: Partial<IRawFile> = {
                currentDataIndex: processedIndex,
                status: FileStatus.COMPELTED
            }
            await this.rawFileRepository.findOneAndUpdate(rawFileId, rawFilePayload);
            console.log('File processing completed successfully.');
        } catch (err) {
            console.error('Error updating final status:', err);
            await commonMethods.errorLogger({
                rawFileId,
                actionType,
                accountId,
                status: 0 ,
                errorDetail: `${err}`,
           
            });
        }
    }

 
   /**
    * The function `addSkippedData` asynchronously saves skipped entries to a repository and logs any
    * errors encountered.
    * @param {string} rawFileId - The `rawFileId` parameter is a string that represents the unique
    * identifier of a raw file. It is used to identify a specific raw file within the system.
    * @param {number} actionType - The `actionType` parameter in the `addSkippedData` function is a
    * number that represents the type of action being performed. It could be used to differentiate
    * between different types of actions or operations within the function.
    * @param {string} accountId - The `accountId` parameter in the `addSkippedData` function is a
    * string that represents the unique identifier of an account. It is used as a reference to
    * associate the skipped data with a specific account.
    */
    async addSkippedData(rawFileId:string,actionType:number,accountId:string) {
        try {
            console.log("++++++++++++++++skipped data++++++++++", this.skippedEntries[0]);
            await contactsErrorLogsRepository.addBulk(this.skippedEntries);
            console.log(`skiped enteries saved$`);
        } catch (err) {
            console.error('Error saving skipped batch:', err);
            await commonMethods.errorLogger({
                rawFileId,
                actionType,
                accountId,
                status: 0 ,
                errorDetail: `${err}`,
           
            });
        }
    }

    /**
     * This async function adds duplicate entries to a contact error logs repository in TypeScript.
     * @param {any[]} duplicateEnteries - The `duplicateEnteries` parameter is an array containing the
     * duplicate entries that need to be added to the contact error logs. The `addDuplicateEnteries`
     * function is an asynchronous function that attempts to add these duplicate entries to the contact
     * error logs using the `addBulk` method from the `contacts
     */

    async addDuplicateEnteries(duplicateEnteries: any[],rawFileId:string,actionType:number,accountId:string) {
        try {
            console.log("++++++++++++++++duplicate  data insertion ++++++++++");
            await contactsErrorLogsRepository.addBulk(duplicateEnteries);
            console.log(`duplicate enteries saved in contact error logs$`);
        } catch (err) {
            console.error('Error saving duplicate data batch:', err);
            await commonMethods.errorLogger({
                rawFileId,
                actionType,
                accountId,
                status: 0 ,
                errorDetail: `${err}`,
           
            });
        }
    }
}


