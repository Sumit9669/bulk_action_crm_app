// server.ts

import app from './app';  // Import the Express app
import { config } from 'dotenv';  // To handle environment variables

// Load environment variables from a .env file
config();

// Set the port from environment variable or default to 5000
const PORT = process.env.PORT || 3001;

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
