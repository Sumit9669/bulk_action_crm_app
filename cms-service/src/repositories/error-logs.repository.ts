import { BaseRepository } from './base.repository';
import ErrorLogsModel, { IErrorLogs } from '../models/error-logs.model';

export class ErrorLogsRepository extends BaseRepository<IErrorLogs> {
    constructor() {
        
        super(ErrorLogsModel, 'cms_db');
    }
}
