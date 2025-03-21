
import { ContactsRepository } from '../repositories/contacts.repository';
import ContactModel from '../models/contacts.model';
import { RawFileRepository } from '../repositories/rawFile.repository';
import { IRawFile } from '../models/raw-files.model';
import { FileActions, FileStatusConst, FileType } from '../constants/bulk-actoins.constants';
import mongoose, { Types } from 'mongoose';
import { FileStatus } from '../interfaces/enums/common.enum';
import ContactLogsErrorModel from '../models/contact-logs-error.model';


export class DataOperationService {
    private rawFileRepository = new RawFileRepository();
    private contactsRepository = new ContactsRepository();
    async getBulkOperationList(){

        const data = await this.rawFileRepository.getAll({},{currentDataIndex:0,filePath:0});

        return this.parseActionData(data);
    }

    async bulkOperationDetailById(actionId: string){
        const page =1;
        const pageSize = 10;
       const data = this.contactsRepository.aggregate([
        {
            $lookup: {
                from: "contact_logs_errors",  // Join with the contact_logs_errors collection
                localField: "rawFileId",      // Match contacts rawFileId with contact_logs_errors rawFileId
                foreignField: "rawFileId",    // Match based on rawFileId
                as: "contactLogsErrors"      // Name the resulting array field as contactLogsErrors
            }
        },
        {
            $project: {
                _id: 1,
                name: 1,
                email: 1,
                phone: 1,
                address: 1,
                rawFileId: 1,
                createdAt: 1,
                updatedAt: 1,
                contactLogsErrors: 1  // Include the contactLogsErrors array
            }
        },
        {
            $addFields: {
                combinedData: {
                    $concatArrays: [
                        { $ifNull: ["$contactLogsErrors", []] }, // Ensure contactLogsErrors is an array
                        [{
                            _id: "$_id",
                            name: "$name",
                            email: "$email",
                            phone: "$phone",
                            address: "$address",
                            rawFileId: "$rawFileId",
                            createdAt: "$createdAt",
                            updatedAt: "$updatedAt",
                            status: "success"  // Mark status as success for contacts
                        }]
                    ]
                }
            }
        },
        {
            $unwind: {
                path: "$combinedData",  // Flatten the combined data (contacts and errors)
                preserveNullAndEmptyArrays: true  // Keep documents even if no data exists in either collection
            }
        },
        {
            $addFields: {
                status: {
                    $cond: {
                        if: { $eq: [{ $type: "$combinedData.errorType" }, "missing"] },  // Check if it's a contact (no errorType)
                        then: "$combinedData.status",  // If it's a contact, keep "success"
                        else: "fail"  // If it's from the contactLogsErrors, mark as "fail"
                    }
                }
            }
        },
        {
            $sort: {
                "combinedData.createdAt": 1  // Sort by createdAt in ascending order for the combined data
            }
        },
        {
            $skip: (page - 1) * pageSize  // Skip the appropriate number of documents for pagination
        },
        {
            $limit: pageSize  // Limit to the page size
        },
        {
            $project: {
                _id: "$combinedData._id", 
                name: "$combinedData.name",
                email: "$combinedData.email",
                phone: "$combinedData.phone",
                address: "$combinedData.address",
                rawFileId: "$combinedData.rawFileId",
                createdAt: "$combinedData.createdAt",
                updatedAt: "$combinedData.updatedAt",
                status: "$status"  // Include status
            }
        },
        {
            $facet: {
                data: [  // Contains the paginated data
                    {
                        $skip: (page - 1) * pageSize  // Skip the appropriate number of documents for pagination
                    },
                    {
                        $limit: pageSize  // Limit to the page size
                    }
                ],
                totalCount: [  // Total count for pagination
                    {
                        $count: "total"
                    }
                ]
            }
        },
        {
            $project: {
                data: 1,
                totalCount: { $arrayElemAt: ["$totalCount.total", 0] }  // Get the total count of documents
            }
        }
    ]);
    return data;  
    }

    async bulkOperationStatsDetailsById(actionId: string){
        // create aggregation to fetch successfull/failed/skipped entity stat by actionId
        const data = await this.rawFileRepository.aggregate([
            {
              // Step 1: Match to find the rawFile with the given rawFileId
              $match: {
                _id:new Types.ObjectId(actionId)  // Match based on the rawFileId
                // status: { $in: [FileStatus.PENDING, FileStatus.COMPELTED] },  // Example, adjust as needed
              },
            },
            {
            //   // Step 2: Lookup contacts that have the rawFileId
              $lookup: {
                from: 'contacts',  // 'contacts' collection
                localField: '_id',  // RawFile _id
                foreignField: 'rawFileId',  // Contact rawFileId field
                as: 'contacts',  // Alias for the result of the join
              },
            },
            {
              // Step 3: Lookup contactLogsError that also have the rawFileId
              $lookup: {
                from: ContactLogsErrorModel.collection.name,  // 'contactLogsError' collection
                localField: '_id',  // RawFile _id
                foreignField: 'rawFileId',  // ContactLogsError rawFileId field
                as: 'contactLogsError',  // Alias for the result of the join
              },
            },
            {
              // Step 4: Project to create necessary fields for counting
              $project: {
                totalContacts: { $size: '$contacts' },  // Count of contacts associated with the rawFile
                failedContacts: {
                  $size: {
                    $filter: {
                      input: '$contactLogsError',
                      as: 'log',
                      cond: { $eq: ['$$log.errorType', 1] },  // Assuming '1' is an error code for failure
                    },
                  },
                },
                skippedContacts: {
                  $size: {
                    $filter: {
                      input: '$contactLogsError',
                      as: 'log',
                      cond: { $eq: ['$$log.errorType', 2] },  // Assuming '2' is an error code for skipped contacts
                    },
                  },
                },
              },
            },
            {
              // Step 5: Group the results by rawFileId and get the counts
              $group: {
                _id: '$_id',
                totalContacts: { $first: '$totalContacts' },
                failedContacts: { $first: '$failedContacts' },
                skippedContacts: { $first: '$skippedContacts' },
              },
            },
          ]);

          return data;
    }

    parseActionData(data:any){
        for(let item of data){
        item.status = FileStatusConst[`${item.status}`];
        item.actionType = FileActions[`${item.actionType}`];
        item.fileType = FileType[`${item.fileType}`];
        }
        return data;
    }
}


