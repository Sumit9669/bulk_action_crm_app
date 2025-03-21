import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';  // Cross-Origin Resource Sharing middleware

import MongoDBConnection from './db/mongo.db';  // Import the MongoDB connection handler
import authRouter from './routes/auth.routes';
import { ErrorMiddleware } from './middlewares/error.midleware';

// Initialize Express
const app = express();

// Middleware
app.use(bodyParser.json());  // Parse JSON request bodies
app.use(cors());  // Enable CORS for all routes

// Initialize MongoDB connection during app startup
(async () => {
  try {
    await  MongoDBConnection(); // Ensure the connection is established
    console.log('MongoDB connection initialized');
  } catch (error) {
    console.error('Error initializing MongoDB connection:', error);
    process.exit(1); // Exit the process if DB connection fails
  }
})();

// Routes
app.use('/auth-service', authRouter);

// Error Handling Middleware (for unhandled routes)
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global Error Handler (for unexpected errors)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);  // log error stack for debugging
  res.status(500).json({ message: 'Something went wrong', error: err.message });
});
app.use(ErrorMiddleware as express.ErrorRequestHandler);
// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Graceful shutdown initiated');
    // await MongoDBConnection.close();  // Close the DB connection
    process.exit(0);  // Exit the process
  });
  
  process.on('SIGTERM', async () => {
    console.log('Graceful shutdown initiated');
    // await MongoDBConnection.close();  // Close the DB connection
    process.exit(0);  // Exit the process
  });
  
export default app;
