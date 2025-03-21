import { parentPort, workerData } from 'worker_threads';
import fs from 'fs';
import path from 'path';
import { FileActions } from '../interfaces/enums/common.enum';

// Define the interface for worker data to provide type safety
interface WorkerData {
  filePath: string;
  fileId: string; // Assuming fileId is a string, adjust the type based on your data model
  actionType:FileActions,
  currenrProcessedIndex:number
}

// This function simulates file processing (e.g., reading or writing files)
async function processFile(workerData: WorkerData): Promise<string> {
  return new Promise((resolve, reject) => {
    // Using fs.promises.readFile instead of the callback-based fs.readFile
    fs.readFile(workerData.filePath, 'utf8', (err, data) => {
      if (err) {
        return reject(`Error reading file at ${workerData.filePath}: ${err.message}`);
      }
      try {
        // Parse the file content (assuming it's JSON)
        const jsonData = JSON.parse(data);
      //  check actionType and based on that either start update request or insert request 

        // Here, add the logic to process the JSON data (e.g., import contacts or other business logic)
        resolve(`Successfully processed ${workerData.filePath}`);
      } catch (parseError) {
        reject(`Error parsing JSON in file ${workerData.filePath}: ${parseError.message}`);
      }
    });
  });
}

// Process the file
async function process(): Promise<void> {
  try {
    const { filePath, fileId, actionType, currenrProcessedIndex }: WorkerData = workerData;

    // Resolve the full path (this may be based on the system path or a specific directory)
    const fullPath = path.resolve(__dirname, filePath);

    const result = await processFile(workerData);

    // Send the result back to the parent thread
    parentPort?.postMessage(result);
  } catch (error: any) {
    // Send error message back to the parent thread
    parentPort?.postMessage({ error: error.message });
  }
}

// Start the worker process
process();
