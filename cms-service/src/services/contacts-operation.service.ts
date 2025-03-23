
import { ContactsRepository } from '../repositories/contacts.repository';
import { ContactLogsRepository } from '../repositories/contact-logs.repository';
import { CommonMethods } from '../utils/common-methods';

const contactsRepository = new ContactsRepository();
const contactsErrorLogsRepository = new ContactLogsRepository();
const commonMethods = new CommonMethods();
export class ContactOperationService {


    /**
     * The function `updateContactData` asynchronously updates contact data based on a specified log type
     * and performs different actions depending on the validation result.
     * @param {any} payload - The `payload` parameter in the `updateContactData` function likely contains
     * data related to a contact, such as their name, email, phone number, etc. It is used to update
     * contact information in the system.
     * @param {number} logType - The `logType` parameter in the `updateContactData` function is used to
     * determine the type of action to be taken based on its value.
     * @param {string} id - The `id` parameter in the `updateContactData` function is a string that
     * represents the unique identifier of the contact data that is being updated.
     * @returns The `updateContactData` function is returning a boolean value `true`.
     */
    async updateContactData(payload: any, logType: number, id: string) {
        const validationResult = commonMethods.validateEmailAndPhone(payload);
        if (logType === 1) {
            await this.updateContacts(id, payload);
        } else {
            if (validationResult.isValid) {
                await contactsErrorLogsRepository.findOneAndDelete(id);
                await contactsRepository.add(payload);


            } else {
                await this.updateLogs(id, payload);
            }

        }

        return true;
    }
    /**
     * The function `updateLogs` asynchronously updates error logs for a specific contact.
     * @param {string} id - The `id` parameter is a string that represents the unique identifier of the log
     * entry that you want to update in the contacts error logs repository.
     * @param {any} payload - The `payload` parameter in the `updateLogs` function is typically an object
     * containing the data that you want to update in the logs. It could include information such as error
     * messages, timestamps, user IDs, or any other relevant details that you want to store in the logs.
     */
    async updateLogs(id: string, payload: any) {
        await contactsErrorLogsRepository.findOneAndUpdate(id, payload);
        true
    }
    /**
     * The function `updateContacts` asynchronously updates a contact record in a repository based on the
     * provided id and payload.
     * @param {string} id - The `id` parameter in the `updateContacts` function is a string that represents
     * the unique identifier of the contact you want to update in the database.
     * @param {any} payload - The `payload` parameter in the `updateContacts` function likely refers to the
     * data that you want to update for a specific contact identified by the `id` parameter. This data
     * could include information such as the contact's name, phone number, email address, or any other
     * details associated with the contact
     */
    async updateContacts(id: string, payload: any) {
        await contactsRepository.findOneAndUpdate(id, payload);
        true;
    }
}


