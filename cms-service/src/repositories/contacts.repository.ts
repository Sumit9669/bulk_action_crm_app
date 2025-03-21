import { BaseRepository } from './base.repository';
import ContactModel, { IContact } from '../models/contacts.model';

export class ContactsRepository extends BaseRepository<IContact> {
    constructor() {
        // Pass the ContactModel, not a string
        super(ContactModel, 'cms_db');
    }
}
