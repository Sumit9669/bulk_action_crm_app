
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
    /**
     * This function retrieves a list of bulk operations for a specific account and parses the action data.
     * @param {string} accountId - The `accountId` parameter is a string that represents the unique
     * identifier of the account for which you want to retrieve the bulk operation list.
     * @returns The `getBulkOperationList` function returns a list of bulk operations for a specific
     * account, after retrieving the data from the raw file repository, parsing the action data, and
     * sorting it by creation date in descending order.
     */
    async getBulkOperationList(accountId: string) {

        let data = await this.rawFileRepository.getAll({ accountId }, { currentDataIndex: 0, filePath: 0 }, { createdAt: -1 });
        data = await this.parseActionData(data);
        return data;
    }

    /**
     * The function `bulkOperationDetailById` retrieves aggregated data for contacts and error logs based
     * on a specified action ID and account ID, with pagination support.
     * @param {string} actionId - The `actionId` parameter is a string representing the ID of the bulk
     * operation for which you want to retrieve details.
     * @param {string} accountId - The `accountId` parameter is used to filter the contacts based on the
     * account to which they belong. It helps narrow down the search to only retrieve contacts associated
     * with a specific account.
     * @param {number} page - The `page` parameter in the `bulkOperationDetailById` function represents the
     * page number of the paginated results that you want to retrieve. It is used to calculate the
     * appropriate number of documents to skip and limit in order to display the data in a paginated
     * manner.
     * @returns The `bulkOperationDetailById` function returns paginated data for a bulk operation detail
     * based on the provided `actionId`, `accountId`, and `page` parameters. The returned data includes
     * information about contacts and any associated errors, with additional fields like status and
     * logType. The data is structured and sorted for display, and the function returns a paginated result
     * along with the total count of documents for
     */
    async bulkOperationDetailById(actionId: string, accountId: string, page: number) {
        const pageSize = 10;
        const data = await this.contactsRepository.aggregate([
            {
                $match: {
                    accountId,
                    rawFileId: { $eq: new Types.ObjectId(actionId) }
                }
            },
            {
                $lookup: {
                    from: "contact_error_logs",  // Join with the contact_logs_errors collection
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
                    accountId: 1,
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
                                accountId: "$accountId",
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
                    },
                    logType: {
                        $cond: {
                            if: { $eq: [{ $type: "$combinedData.errorType" }, "missing"] },  // Check if it's a contact (no errorType)
                            then: 1,  // If it's a contact, keep "success"
                            else: 2  // If it's from the contactLogsErrors, mark as "fail"
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
                $project: {
                    _id: "$combinedData._id",
                    name: "$combinedData.name",
                    email: "$combinedData.email",
                    phone: "$combinedData.phone",
                    address: "$combinedData.address",
                    rawFileId: "$combinedData.rawFileId",
                    accountId: "$combinedData.accountId",
                    createdAt: "$combinedData.createdAt",
                    updatedAt: "$combinedData.updatedAt",
                    status: "$status",  // Include status
                    logType: "$logType"
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
    /**
     * The function `bulkOperationStatsDetailsById` aggregates and calculates statistics for successful,
     * failed, and skipped contacts associated with a given actionId.
     * @param {string} actionId - The `bulkOperationStatsDetailsById` function is designed to fetch
     * statistics details for a bulk operation based on the provided `actionId`. The function performs an
     * aggregation pipeline on the `rawFileRepository` collection to calculate the total number of
     * contacts, failed contacts, and skipped contacts associated with the given `
     * @returns The `bulkOperationStatsDetailsById` function is returning an object with the following
     * properties:
     */

    async bulkOperationStatsDetailsById(actionId: string) {
        // create aggregation to fetch successfull/failed/skipped entity stat by actionId
        const data = await this.rawFileRepository.aggregate([
            {
                // Step 1: Match to find the rawFile with the given rawFileId
                $match: {
                    _id: new Types.ObjectId(actionId)  // Match based on the rawFileId
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
                    totalSuccessContacts: { $first: '$totalContacts' },
                    failedContacts: { $first: '$failedContacts' },
                    skippedContacts: { $first: '$skippedContacts' },
                },
            },
        ]);

        return {
            actionId: data[0]._id,
            totalRecords: data[0].totalSuccessContacts + data[0].failedContacts + data[0].skippedContacts,
            totalSuccessContacts: data[0].totalSuccessContacts,
            failedContacts: data[0].failedContacts,
            skippedContacts: data[0].skippedContacts
        };
    }
    /**
     * The function `parseActionData` takes an array of objects and converts specific properties to their
     * corresponding values from predefined constants.
     * @param {any} data - The `data` parameter in the `parseActionData` function seems to be an array of
     * objects. Each object in the array contains properties like `status`, `actionType`, and `fileType`
     * that are being transformed using constants like `FileStatusConst`, `FileActions`, and `FileType
     * @returns The `parseActionData` function is returning the `data` object after modifying the `status`,
     * `actionType`, and `fileType` properties of each item in the data array. The properties are being
     * updated by mapping them to corresponding values from the `FileStatusConst`, `FileActions`, and
     * `FileType` objects respectively.
     */

    parseActionData(data: any) {
        for (let item of data) {
            item.status = FileStatusConst[`${item.status}`];
            item.actionType = FileActions[`${item.actionType}`];
            item.fileType = FileType[`${item.fileType}`];
        }
        return data;
    }
}


