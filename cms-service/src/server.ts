// server.ts

import app from './app';  // Import the Express app
import { config } from 'dotenv';  // To handle environment variables
import cron from 'node-cron';
import { CronBulkOperationsService } from './services/cron-bulk-operations.service';
const cronOpsSvc =  new CronBulkOperationsService();
// Load environment variables from a .env file
config();

// Set the port from environment variable 
// or default to 5000
const PORT = process.env.PORT || 3002;

async function initiateBulkActions():Promise<any>{
    console.log('execution started');
    await cronOpsSvc.initiateBulkActions();
    console.log('execution completed');
  }

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log('start cron');
    cron.schedule('* * * * *', initiateBulkActions)
});
