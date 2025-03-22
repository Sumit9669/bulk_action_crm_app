
import { ContactsRepository } from '../repositories/contacts.repository';
import ContactModel from '../models/contacts.model';
import { RawFileRepository } from '../repositories/rawFile.repository';
import { IRawFile } from '../models/raw-files.model';
import { Worker } from 'worker_threads';
import { FileStatus } from '../interfaces/enums/common.enum';

export class CronBulkOperationsService {
    private rawFileRepository = new RawFileRepository();


    /**
     * The `initiateBulkActions` function asynchronously processes pending files in parallel using worker
     * threads based on their schedule time.
     */
    async initiateBulkActions() {
        const currentTime = new Date();  // Get the current date and time

        // Fetch raw files that are pending and their scheduleTime is now or in the past
        const pendingFiles = await this.rawFileRepository.getAll({
            status: FileStatus.PENDING,
            scheduleTime: { $lte: currentTime },  // Use the native Date object here
        });

        // Iterate over each of the pending files and process them in parallel with worker threads
        const workerPromises = pendingFiles.map((rawFile: IRawFile) => this.processFileInWorkerThread(rawFile));

        // Wait for all worker threads to finish
        try {
            const results = await Promise.all(workerPromises);
            console.log('All files processed successfully:', results);
        } catch (err) {
            console.error('Error processing files:', err);
        }
    }
    /**
     * The function `processFileInWorkerThread` processes a file in a separate worker thread and returns a
     * promise that resolves when the processing is completed.
     * @param {IRawFile} rawFile - The `rawFile` parameter in the `processFileInWorkerThread` function is
     * an object of type `IRawFile`. It contains the following properties:
     * @returns The `processFileInWorkerThread` function is returning a `Promise<any>`.
     */

    private processFileInWorkerThread(rawFile: IRawFile): Promise<any> {
        return new Promise((resolve, reject) => {
            const worker = new Worker('./dist/services/file-worker.js', {
                workerData: { filePath: rawFile.filePath, fileId: rawFile._id.toString(), actionType: rawFile.actionType, currenrProcessedIndex: rawFile.currentDataIndex, accountId: rawFile.accountId }
            });

            // Listen for message from worker
            worker.on('message', (message) => {
                console.log(`Processed file: ${rawFile.filePath}`);
                resolve(message);
            });

            // Handle worker errors
            worker.on('error', (error) => {
                console.error(`Error in worker: ${error}`);
                reject(error);
            });

            // Handle worker exit
            worker.on('exit', (code) => {
                if (code !== 0) {
                    reject(new Error(`Worker stopped with exit code ${code}`));
                }
            });
        });
    }





}


