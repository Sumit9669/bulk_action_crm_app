import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { IRawFile } from './raw-files.model';

// Define the interface for Contact Model
export interface IContactLogsError extends Document {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    rawFileId:Types.ObjectId | IRawFile;
    errorType: Number;
    actionType:Number;
    createdAt: Date;
    updatedAt: Date;
}

// Define the schema for the Contact model
const contactLogsErrorSchema: Schema<IContactLogsError> = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        phone: { type: String, required: false },
        address: { type: String, required: false },
        rawFileId:{
            type: Schema.Types.ObjectId,
            ref: "raw_files",
            required: true,
        },

        errorType: {
            type:Number,
            required:true
        },
        actionType:{
            type:Number,
            required:true
        },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }, // Mongoose will automatically manage createdAt and updatedAt
    }
);

// Create and export the model
const ContactLogsErrorModel: Model<IContactLogsError> = mongoose.model<IContactLogsError>('Contact_error_logs', contactLogsErrorSchema);

export default ContactLogsErrorModel;
