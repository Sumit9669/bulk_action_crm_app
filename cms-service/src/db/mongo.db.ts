

import mongoose from "mongoose";
require("dotenv").config();

const dbUrl: string = process.env.DB_URL || "";
if (!dbUrl) {
  throw new Error("Database URL is not provided in the environment variables.");
}

const options = {
  minPoolSize: 5,             // Minimum number of connections in the pool
  maxPoolSize: 50,            // Maximum number of connections in the pool
  socketTimeoutMS: 45000,     // Timeout for a socket to wait for activity
  connectTimeoutMS: 10000,    // Timeout for initial connection
  serverSelectionTimeoutMS: 5000,  // Timeout for server selection
};

const MongoDBConnection = async () => {
  try {
    // Establish the MongoDB connection
    const data = await mongoose.connect(dbUrl, options);
    console.log(`Database connected with ${data.connection.host}`);
  } catch (error: any) {
    console.error(`Database connection failed: ${error.message}`);
    console.error("Retrying in 5 seconds...");

    // Retry connection after a delay (backoff strategy)
    setTimeout(MongoDBConnection, 5000);
  }
};

// Attempt to connect on startup
MongoDBConnection();

export default MongoDBConnection;
