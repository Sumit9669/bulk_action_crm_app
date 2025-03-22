import mongoose, { Schema, Document, Model } from 'mongoose';
import { FileActions, FileStatus, FileType } from '../interfaces/enums/common.enum';

// Define the interface for Contact Model
export interface IRawFile extends Document {
    fileName: string;
    filePath: string;
    status: Number;
    actionType: Number;
    createdAt: Date;
    updatedAt: Date;
    fileType: number,
    currentDataIndex:number,
    totalRecirds:number,
    scheduleTime:Date,
    isScheduled:boolean,
    accountId:string
}

// Define the schema for the Contact model
const RawFileSchema: Schema<IRawFile> = new Schema(
    {
        fileName: { type: String, required: true },
        filePath: { type: String, required: true, unique: true },
        status: { type: Number, required: true, default:FileStatus.PENDING, enum:FileStatus },
        actionType:{ type: Number, required: true, default:null,enum:FileActions },
        fileType:{
            type:Number ,
            default:0,
            required:true,
            enum: FileType
        },
        currentDataIndex:{
            type:Number,
            required:true,
            default: 0
        },
        totalRecirds:{
            type:Number,
            required:true,
            default: 0
        },
        scheduleTime: { type: Date, default: Date.now },
        isScheduled:{
            type:Boolean,
            default:false
        },
        accountId:{ type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }, // Mongoose will automatically manage createdAt and updatedAt
    }
);

// Create and export the model
const RawFileModel: Model<IRawFile> = mongoose.model<IRawFile>('raw_files', RawFileSchema);

export default RawFileModel;
