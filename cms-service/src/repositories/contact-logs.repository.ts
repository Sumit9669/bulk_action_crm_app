import { BaseRepository } from './base.repository';
import ContactLogsModel, { IContactLogsError } from '../models/contact-logs-error.model';

export class ContactLogsRepository extends BaseRepository<IContactLogsError> {
    constructor() {
        // Pass the ContactModel, not a string
        super(ContactLogsModel, 'cms_db');
    }
}
