import mongoose, { Model, Document } from 'mongoose';
import MongoDBConnection from '../db/mongo.db'; // Assuming this is the centralized DB connection file

export interface IBaseRepository<T extends Document> {
    add(item: T): Promise<void>;
    getById(itemId: string): Promise<T | null>;
    getAll(): Promise<T[]>;
    update(id: string, payload: T): Promise<void>;
    delete(id: string): Promise<void>;
    addBulk(items: T[]): Promise<void>;
    updateBulk(updates: { filter: Record<string, any>; payload: T }[]): Promise<void>;
    deleteBulk(ids: string[]): Promise<void>;
    count(): Promise<number>;
    aggregate(pipeline: object[]): Promise<any[]>;
    findOneAndUpdate(id: string, update: object): Promise<T | null>;
    findOneAndDelete(id: string): Promise<T | null>;
    createIndex(fields: object, options?: object): Promise<string>;
    dropIndex(indexName: string): Promise<void>;
    dropCollection(): Promise<void>;
    renameCollection(newName: string): Promise<void>;
}

export abstract class BaseRepository<T extends Document> implements IBaseRepository<T> {
    // private collectionName: string;
    private model: Model<T>; // Store Mongoose model

    constructor(model: Model<T>, dbName: string) {
        this.model = model; // Accept Mongoose model
        // MongoDBConnection.getDb(dbName); // Get DB connection from centralized utility
    }
//mongodb+srv://fullstackdevsumit68:iM7vI245LcWK4hoL@crm-app.16iis.mongodb.net/?retryWrites=true&w=majority&appName=crm-app';
    // Create

    private async checkConnection(): Promise<void> {
        try {
            if (mongoose.connection.readyState !== 1) { // 1 indicates connected
                console.log("Database is not connected, attempting to reconnect...");
                await MongoDBConnection(); // Reattempt connection if disconnected
            }
        } catch (error) {
            console.error("Error during DB connection check:", error);
        }
    }

    async add(item: T): Promise<void> {
        await this.checkConnection();
        try{
            await this.model.create(item);
        }catch(error){
            console.log('error detail',error);
        }
  
    }

    async addBulk(items: T[]): Promise<void> {
        await this.model.insertMany(items);
    }

    // Read
    async getById(itemId: string): Promise<T | null> {
        return this.model.findById(itemId).exec();
    }

    async getAll(
        filters: Record<string, any> = {},
        projection: Record<string, 1 | 0> = {},
        sort: Record<string, 1 | -1> = {},
        page: number = 1,
        limit: number = 10
    ): Promise<T[]> {
        const skip = (page - 1) * limit;
    
        const result = await this.model
            .find(filters, projection) // Apply filters and projection
            .sort(sort)                // Apply sorting
            .skip(skip)                // Apply pagination (skip)
            .limit(limit)              // Apply pagination (limit)
            .lean()                    // Make the result lean (plain JavaScript objects)
            .exec();
    
        return result as T[]; // Type assertion here
    }
    
    
    
    

    async count(): Promise<number> {
        return this.model.countDocuments().exec();
    }

    async aggregate(pipeline: mongoose.PipelineStage[]): Promise<any[]> {
        return this.model.aggregate(pipeline).exec();  
    }

    // Update
    async update(id: string, payload: Partial<T>): Promise<void> {
        const result = await this.model.updateOne({ _id: id }, { $set: payload }).exec();
        if (result.matchedCount === 0) {
            throw new Error('Id not found');
        }
    }

    async updateBulk(updates: { filter: Record<string, any>; payload: T }[]): Promise<void> {
        const bulkOps = updates.map(({ filter, payload }) => ({
            updateOne: {
                filter, // Use the dynamic filter passed in the update data
                update: { $set: payload },
             
            },
        }));
    
        // Perform the bulk update using the model's bulkWrite method
        await this.model.bulkWrite(bulkOps);
    }

    async findOneAndUpdate(id: string, update: object): Promise<T | null> {
        return this.model.findByIdAndUpdate(id, update, { new: true }).exec();
    }

    // Delete
    async delete(id: string): Promise<void> {
        const result = await this.model.deleteOne({ _id: id }).exec();
        if (result.deletedCount === 0) {
            throw new Error('Id not found');
        }
    }

    async deleteBulk(ids: string[]): Promise<void> {
        await this.model.deleteMany({ _id: { $in: ids } }).exec();
    }

    async findOneAndDelete(id: string): Promise<T | null> {
        return this.model.findByIdAndDelete(id).exec();
    }

    // Create index method
    async createIndex(fields: { [key: string]: 1 | -1 }, options: object = {}): Promise<string> {
        const indexName = await this.model.collection.createIndex(fields, options);
        return indexName;
    }

    async dropIndex(indexName: string): Promise<void> {
        await this.model.collection.dropIndex(indexName);
    }

    // Collection Management
    async dropCollection(): Promise<void> {
        await this.model.collection.drop();
    }

    async renameCollection(newName: string): Promise<void> {
        await this.model.collection.rename(newName);
    }
}
