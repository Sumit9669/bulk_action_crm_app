import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';  // Cross-Origin Resource Sharing middleware
import contactRouter from './routes/contacts.route';
import MongoDBConnection from './db/mongo.db';  // Import the MongoDB connection handler
import uploadFileRouter from './routes/uploadfiles.route';
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
app.use('/cms-service', uploadFileRouter,contactRouter);

// Error Handling Middleware (for unhandled routes)
app.get("*", (req: Request, res: Response, next: NextFunction) => {
  const err = new Error(`Route ${req.originalUrl} not found`) as any;
  err.statusCode = 404;
  next(err);
});

// Global Error Handler (for unexpected errors)
app.use(ErrorMiddleware as express.ErrorRequestHandler);
process.on("uncaughtException", function (exception) {
    console.log("########## SERVER CRASHED WITH UNCAUGHT EXCEPTION ##########");
  
    const err = exception;
    if (typeof err === "object") {
      if (err.message) {
        console.log("\nMessage: " + err.message);
      }
      if (err.stack) {
        console.log("\nStacktrace:");
        console.log("====================");
        console.log(err.stack);
      }
    } else {
      console.log("dumpError :: argument is not an object");
    }
  });
  
  process.on("warning", function (warning) {
    console.log("########## APPLICATION WARNING START ##########");
    console.log(warning);
    console.log("########## APPLICATION WARNING END ##########");
  });
  
  // Or run project with : node --trace-warnings app.js
  process.on("unhandledRejection", (reason: any, p) => {
    console.log("Unhandled Rejection at: Promise", p, "reason:", reason.stack);
    console.dir(reason.stack);
    // application specific logging, throwing an error, or other logic here
  });
  
  /******************************** Application level handling : End *********************/
  
export default app;
