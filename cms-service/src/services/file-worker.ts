import { Worker as WorkerThread, isMainThread, parentPort, workerData } from 'worker_threads';
import fs from 'fs';
import path from 'path';
import { BatchInsetionOperationService } from './batch-insertion-operation.service';
import { BatchUpdateOperationService } from './batch-update-operations.service';
import { CommonMethods } from '../utils/common-methods';

const batchInsertSvc = new BatchInsetionOperationService();
const batchUpdateOps = new BatchUpdateOperationService();
const commonMethods = new CommonMethods()

/**
 * The function `processFile` reads a file, parses its content as JSON, and performs different actions
 * based on the `actionType` provided in the input data.
 * @param {any} workerData - workerData is an object containing information about the file to be
 * processed. It includes the following properties:
 * @returns The `processFile` function is returning a Promise.
 */
async function processFile(workerData: any) {
  return new Promise((resolve, reject) => {
    fs.readFile(workerData.filePath, 'utf8', async (err, data) => {
      if (err) {
        return reject(`Error reading file at ${workerData.filePath}: ${err.message}`);
      }
      try {
        const jsonData = JSON.parse(data);
        if (workerData.actionType === 1) {
          await batchUpdateOps.updateBulkData(jsonData, 0, workerData.fileId, workerData.actionType, workerData.accountId);
        } else {
          await batchInsertSvc.insertDataInDb(jsonData, 0, workerData.fileId, workerData.actionType, workerData.accountId);
        }
        fs.unlinkSync(workerData.filePath);
        resolve(`Successfully processed ${workerData.filePath}`);
      } catch (parseError) {
        await commonMethods.errorLogger({
          rawFileId: workerData.fileId,
          actionType: workerData.actionType,
          accountId:workerData.accountId,
          status: 0 ,
          errorDetail: `${parseError}`,
     
      });
        reject(`Error parsing JSON in file ${workerData.filePath}: ${parseError.message}`);
        
      }
    });
  });
}


/**
 * The `initiateProcess` function asynchronously processes a file using worker data and sends the
 * result or error message back to the parent thread.
 */
async function initiateProcess() {
  const { filePath, fileId, actionType, currentProcessedIndex, accountId } = workerData;
  try {
     // Removed type annotations

    // Resolve the full path (this may be based on the system path or a specific directory)
    const fullPath = path.resolve(__dirname, filePath);

    const result = await processFile(workerData);

    // Send the result back to the parent thread
    parentPort?.postMessage(result);
  } catch (error) {
    await commonMethods.errorLogger({
      rawFileId:fileId,
      actionType,
      accountId,
      status: 0 ,
      errorDetail: `${error}`,
 
  });
    parentPort?.postMessage({ error: error.message });
  }
}

// Start the worker process
initiateProcess();
