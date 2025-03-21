
import { ContactsRepository } from '../repositories/contacts.repository';
import ContactModel from '../models/contacts.model';
import { RawFileRepository } from '../repositories/rawFile.repository';
import { IRawFile } from '../models/raw-files.model';
import { FileStatus } from '../interfaces/enums/common.enum';

const contactsRepository = new ContactsRepository();

export class BatchInsetionOperationService {
    private rawFileRepository = new RawFileRepository();
  
    async insertDataInDb(jsonData: any, startIndex: number = 0, rawFileId:string) {
        let batchIndex = startIndex;
        const totalContacts = jsonData.length;
        const batchSize = 20;
        try {
            for (batchIndex; batchIndex < totalContacts; batchIndex += batchSize) {
                // Slice the data into a batch of 'batchSize'
                const batchData = jsonData.slice(batchIndex, batchIndex + batchSize);
                for(let item of batchData){
                    item['rawFileId'] = rawFileId;
                }
                let currentSize = batchData.length;
                // Process the batch (this is the actual insertion logic)
                await contactsRepository.addBulk(batchData);  // Replace with your bulk update method

                // Log success after processing the batch
                console.log(`Batch ${Math.floor(batchIndex / batchSize) + 1} processed successfully.`);

                // Update the batch index in the database or file (e.g., mark status as processed)
                await this.updateBatchStatus(batchIndex + currentSize, rawFileId, FileStatus.IN_PROGRESS);  // You can update the index after the batch is fully processed

            }

            console.log('All data processed successfully.');
            // Optionally update the final status of the file in the database (indicating processing completion)
            await this.updateFinalStatus(rawFileId,batchIndex); 

        } catch (err) {
            // If an error occurs, log and update the last processed batch index
            console.error('Error during batch processing:', err);
            
            // Update the batch index where the process failed
            await this.updateBatchStatus(batchIndex, rawFileId,FileStatus.PENDING );  // Update last successful batch index to resume from there
            throw new Error(`Error occurred at batch index: ${batchIndex}`);
        }
    }

    // Function to update the batch processing status (e.g., to mark the last successful index)
    private async updateBatchStatus(lastProcessedIndex: number, id:string, status: FileStatus): Promise<void> {
        // You could save the last processed index in the database or update a status field to track progress
        try {
            // Update the status of the processing, e.g., in the database or status tracker
            // Assume there's a 'processingStatus' table where we store the last processed batch index
            const rawFilePayload = {
                currentDataIndex:lastProcessedIndex,
                status
            }
             await this.rawFileRepository.update(id,rawFilePayload);
            console.log(`Batch status updated: Last processed index is ${lastProcessedIndex}`);
        } catch (err) {
            console.error('Error updating batch status:', err);
        }
    }

    // Function to update final processing status in the database (e.g., marking the file as fully processed)
    private async updateFinalStatus(rawFileId:string, processedIndex:number ): Promise<void> {
        try {
            // Update final processing status (e.g., mark the file processing as completed)
            const rawFilePayload:Partial<IRawFile> = {
                currentDataIndex:processedIndex,
                status: FileStatus.COMPELTED
            }
             await this.rawFileRepository.update(rawFileId,rawFilePayload);
            console.log('File processing completed successfully.');
        } catch (err) {
            console.error('Error updating final status:', err);
        }
    }
}


