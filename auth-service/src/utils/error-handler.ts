
class ErrorHandler extends Error {
    public statusCode: number;
    public code?: string; // Optional custom error code
    public details?: any; // Optional details for debugging
  
    constructor(message: any, statusCode: number, code?: string, details?: any) {
      super(message);
      this.statusCode = statusCode;
      this.code = code;
      this.details = details;
  
      Error.captureStackTrace(this, this.constructor);
    }
  
    // Format the error for consistent output
    toJSON() {
      return {
        status: "error",
        statusCode: this.statusCode,
        code: this.code || "UNKNOWN_ERROR",
        message: this.message,
        details: this.details || null,
      };
    }
  }
  
  export default ErrorHandler;
  