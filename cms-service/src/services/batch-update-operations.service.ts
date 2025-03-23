
import { ContactsRepository } from '../repositories/contacts.repository';
import ContactModel from '../models/contacts.model';
import { RawFileRepository } from '../repositories/rawFile.repository';
import { IRawFile } from '../models/raw-files.model';
import { FileStatus } from '../interfaces/enums/common.enum';
import { ContactLogsRepository } from '../repositories/contact-logs.repository';
import { CommonMethods } from '../utils/common-methods';
import { BatchInsetionOperationService } from './batch-insertion-operation.service';

const contactsRepository = new ContactsRepository();
const contactsErrorLogsRepository = new ContactLogsRepository();
const commonMethods = new CommonMethods();
const insertionOpsSvc = new BatchInsetionOperationService();
export class BatchUpdateOperationService {
    private rawFileRepository = new RawFileRepository();
    private skippedEntries: any[] = [];
    /**
     * The function `updateBulkData` processes and updates bulk data entries, handling validation,
     * duplicates, and batch processing.
     * @param {any} jsonData - The `jsonData` parameter in the `updateBulkData` function represents the
     * data that needs to be processed in bulk. It contains an array of objects, where each object
     * likely represents a contact or entity with various properties like email, phone number, etc.
     * This data will be processed in batches to perform
     * @param {number} [startIndex=0] - The `startIndex` parameter in the `updateBulkData` function is
     * used to specify the index from which the batch processing should start within the provided data.
     * If not explicitly provided, the default value is set to 0, indicating that the processing should
     * start from the beginning of the data.
     * @param {string} rawFileId - The `rawFileId` parameter in the `updateBulkData` function
     * represents the unique identifier of the raw file being processed. It is used to track and manage
     * the data associated with a specific file throughout the bulk data update operation. This
     * identifier helps in identifying and distinguishing different files or data sources within
     * @param {number} actionType - The `actionType` parameter in the `updateBulkData` function
     * represents the type of action to be performed on the data. It is a number that specifies the
     * type of operation or action that needs to be taken during the bulk data update process. This
     * could be used to differentiate between different types of
     * @param {string} accountId - The `accountId` parameter in the `updateBulkData` function
     * represents the unique identifier associated with a specific account. This identifier is used to
     * filter and process data specific to that account within the function's logic. It helps in
     * ensuring that the data operations are performed within the context of the correct account,
     */
    async updateBulkData(jsonData: any, startIndex: number = 0, rawFileId: string, actionType: number, accountId: string) {
        let batchIndex = startIndex;
        const totalContacts = jsonData.length;
        const batchSize = 20;
        let newDataEnteries = [];
        try {
            for (batchIndex; batchIndex < totalContacts; batchIndex += batchSize) {
                let updatePayloadArray = [];
                const newDataCheck = [];
                // Slice the data into a batch of 'batchSize'
                const batchData = jsonData.slice(batchIndex, batchIndex + batchSize);
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
                            errorType: 1,
                            errorMetaData: validationResult.message
                        });
                       
                        // Remove invalid item from the batch
                        batchData.splice(i, 1);
                        i--; // Adjust index after removal
                        continue; // Skip to the next item
                    }
                    newDataCheck.push(item.email);
                    newDataEnteries.push(item);
                    updatePayloadArray.push({
                        filter: {
                            accountId,
                            email: item.email
                        },
                        payload: item
                    })

                }
                if (updatePayloadArray.length > 0) {
                    const duplicateData = await contactsRepository.getAll({ email: { $in: newDataCheck } });
                    const duplicateEmails = [];
                    for (let item of duplicateData) {
                        duplicateEmails.push(item.email);
                    }
                    updatePayloadArray = updatePayloadArray.filter((item: any) => {
                        if (duplicateEmails.includes(item.payload.email)) {
                            return item;
                        }
                    })
                    updatePayloadArray.forEach(item => {
                        let index = -1;
                        if (duplicateEmails.includes(item.payload.email)) { index = duplicateEmails.indexOf(item.payload.email) };
                        if (index !== -1) {
                            duplicateEmails.splice(index, 1);  // Remove item.email from duplicateEmails
                        }
                    });
                    newDataEnteries = newDataEnteries.filter((item: any) => {
                        if (duplicateEmails.includes(item.email)) {
                            return item;
                        }
                    })
                    if (updatePayloadArray.length > 0) {

                        await contactsRepository.updateBulk(updatePayloadArray);
                    }

                }


                let currentSize = batchData.length;
                // insert new data if newEnteries found

                if (newDataEnteries.length > 0) {
                    await contactsRepository.addBulk(newDataEnteries);
                }

                // Log success after processing the batch
                console.log(`Batch ${Math.floor(batchIndex / batchSize) + 1} processed successfully.`);

                // Update the batch index in the database or file (e.g., mark status as processed)
                await insertionOpsSvc.updateBatchStatus(batchIndex + currentSize,rawFileId,FileStatus.IN_PROGRESS,actionType,accountId);  // You can update the index after the batch is fully processed

            }
            await insertionOpsSvc.addSkippedData(rawFileId,actionType,accountId);
            console.log('All data processed successfully.');
            // Optionally update the final status of the file in the database (indicating processing completion)
            await insertionOpsSvc.updateFinalStatus(rawFileId, batchIndex,actionType,accountId);

        } catch (err) {
            await insertionOpsSvc.addSkippedData(rawFileId,actionType,accountId);
            // If an error occurs, log and update the last processed batch index
            console.error('Error during batch processing:', err);

            // Update the batch index where the process failed
            await insertionOpsSvc.updateBatchStatus(batchIndex, rawFileId,FileStatus.PENDING,actionType,accountId);  // Update last successful batch index to resume from there
            throw new Error(`Error occurred at batch index: ${batchIndex}`);
        }
    }

}


