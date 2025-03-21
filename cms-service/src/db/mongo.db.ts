// import { MongoClient, Db } from 'mongodb';

// class MongoDBConnection {
//   private static client: MongoClient | null = null;
//   private static db: Db | null = null;

//   private constructor() {} // Prevent instantiation

//   /**
//    * Get the MongoDB client instance (Singleton Pattern)
//    * @returns {MongoClient} The MongoDB client instance
//    */
//   public static async getClient(): Promise<MongoClient> {
//     if (this.client === null) {
//       try {
//         console.log('Establishing new MongoDB connection...');

//         // MongoDB Atlas connection string (replace with your credentials)
//         const url = 'mongodb+srv://fullstackdevsumit68:iM7vI245LcWK4hoL@crm-app.16iis.mongodb.net/?retryWrites=true&w=majority';

//         // Create a new MongoClient instance with connection options
//         const options = {
//           useNewUrlParser: true,
//           useUnifiedTopology: true,
//           connectTimeoutMS: 30000,  // 30 seconds connection timeout
//           socketTimeoutMS: 30000,   // 30 seconds socket timeout
//           maxPoolSize: 50,          // Max pool size (optional, adjust as needed)
//           serverSelectionTimeoutMS: 30000,  // Server selection timeout
//         };

//         // Initialize MongoDB client with the connection URL and options
//         this.client = new MongoClient(url, options);
//         await this.client.connect();

//         console.log('MongoDB connected successfully');
//       } catch (err) {
//         console.error('Error establishing MongoDB connection:', err);
//         throw err; // Propagate error
//       }
//     }
//     return this.client;
//   }

//   /**
//    * Get the MongoDB database instance
//    * @param {string} dbName - The name of the database to access
//    * @returns {Db} The MongoDB database instance
//    */
//   public static async getDb(dbName: string): Promise<Db> {
//     if (!this.db) {
//       const client = await this.getClient(); // Ensure the client is initialized
//       this.db = client.db(dbName);  // Select the database
//       console.log(`Connected to database: ${this.db.databaseName}`);
//     }
//     return this.db;
//   }

//   /**
//    * Close the MongoDB connection
//    */
//   public static async close(): Promise<void> {
//     if (this.client) {
//       await this.client.close();
//       this.client = null;
//       this.db = null;
//       console.log('MongoDB connection closed');
//     }
//   }
// }

// export default MongoDBConnection;


import mongoose from "mongoose";
require("dotenv").config();

const dbUrl: string = 'mongodb+srv://fullstackdevsumit68:iM7vI245LcWK4hoL@crm-app.16iis.mongodb.net/?retryWrites=true&w=majority';//process.env.DB_URL || "";
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
