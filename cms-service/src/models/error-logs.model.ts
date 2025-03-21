import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { IRawFile } from './raw-files.model';
import { FileActions } from '../interfaces/enums/common.enum';

// Define the interface for Contact Model
export interface IErrorLogs extends Document {
    name: string;
    rawFileId: Types.ObjectId | IRawFile;
    status: string;
    errorDetail: string;
    actionType: number;
    metaData: object;
    createdAt: Date;
    updatedAt: Date;
}

// Define the schema for the Contact model
const errorLogsSchema: Schema<IErrorLogs> = new Schema(
    {
        name: { type: String, required: true },
        rawFileId: {
            type: Schema.Types.ObjectId,
            ref: "raw_files",
            required: true,
        },
        status: { type: String, required: false },
        errorDetail: { type: String, required: false },
        actionType:{ type: Number, required: true, default:null,enum:FileActions },
        metaData: {
            type:Object,
            required:false,
            
        },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }, // Mongoose will automatically manage createdAt and updatedAt
    }
);

// Create and export the model
const ErrorLogsModel: Model<IErrorLogs> = mongoose.model<IErrorLogs>('Contact', errorLogsSchema);

export default ErrorLogsModel;
