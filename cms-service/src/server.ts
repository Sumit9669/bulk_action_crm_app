// server.ts

import app from './app';  // Import the Express app
import { config } from 'dotenv';  // To handle environment variables
import cron from 'node-cron';
import { CronBulkOperationsService } from './services/cron-bulk-operations.service';
// import './types/custom';
const cronOpsSvc =  new CronBulkOperationsService();
let cronJob;
// Load environment variables from a .env file
config();

// Set the port from environment variable 
// or default to 5000
const PORT = process.env.PORT || 3000;

async function initiateBulkActions():Promise<any>{
    console.log('execution started');
    await cronOpsSvc.initiateBulkActions();
    console.log('execution completed');
  }

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log('start cron');
    cronJob = cron.schedule('* * * * *', initiateBulkActions, {
      scheduled: true,  // Automatically start the job when server starts
  });
});

// Handle process termination signals
process.on('SIGINT', () => {
  console.log('Received SIGINT (Ctrl+C), shutting down server...');
  if (cronJob) {
      cronJob.stop(); // Stop the cron job gracefully
      console.log('Cron job stopped');
  }
  process.exit(0); // Exit the process
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down server...');
  if (cronJob) {
      cronJob.stop(); // Stop the cron job gracefully
      console.log('Cron job stopped');
  }
  process.exit(0); // Exit the process
});
