import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Define custom storage logic
const storage = multer.memoryStorage(); // Keep the file in memory for buffer

// Define the disk storage logic for saving the file to disk
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Specify the destination folder for saving files
    const uploadDir = 'uploads';
    
    // Ensure the upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir); // Set the folder for file upload
  },
  filename: (req, file, cb) => {
    // Use original filename and append timestamp and UUID
    const uniqueFilename = `${Date.now()}_${file.originalname}`;
    cb(null, uniqueFilename); // Set the unique file name
  }
});

// Combine both memory storage and disk storage logic
const upload = multer({
  storage: storage,
  fileFilter: (req: any, file: any, cb: any) => {
    const allowedTypes = ['.csv', '.json']; // Allowed file extensions
    const fileExtension = path.extname(file.originalname);

    if (!allowedTypes.includes(fileExtension)) {
      return cb(new Error('Only CSV or JSON files are allowed'), false); // Reject file if not allowed type
    }

    cb(null, true); // Accept file
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // Max file size of 10MB
}).single('csvFile'); // Expect a file under field name 'csvFile'
export default upload;
