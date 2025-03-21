import userModel, { IUser } from '../models/users.model';
import { BaseRepository } from './base.repository';

export class ContactLogsRepository extends BaseRepository<IUser> {
    constructor() {
        // Pass the ContactModel, not a string
        super(userModel, 'cms_db');
    }
}
