import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { IRawFile } from './raw-files.model';

// Define the interface for Contact Model
export interface IContact extends Document {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    rawFileId:Types.ObjectId | IRawFile;
    accountId:string;
    createdAt: Date;
    updatedAt: Date;
}

// Define the schema for the Contact model
const contactSchema: Schema<IContact> = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        phone: { type: String, required: false },
        address: { type: String, required: false },
        accountId:{ type: String, required: true },
        rawFileId:{
            type: Schema.Types.ObjectId,
            ref: "raw_files",
            required: true,
        },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }, // Mongoose will automatically manage createdAt and updatedAt
    }
);

// Create and export the model
const ContactModel: Model<IContact> = mongoose.model<IContact>('Contact', contactSchema);

export default ContactModel;
