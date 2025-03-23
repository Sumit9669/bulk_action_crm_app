import { Request, Response } from 'express';
import { ContactsRepository } from '../repositories/contacts.repository';
import ContactModel from '../models/contacts.model';
import { ContactOperationService } from '../services/contacts-operation.service';

const contactsRepository = new ContactsRepository();
const contactOpsSvc = new ContactOperationService();
class ContactsController {
    // Create a new contact
    async create(req: Request, res: Response): Promise<void> {
        try {
            const { name, email, phone, address } = req.body;
            const newContact = new ContactModel({
                name,
                email,
                phone,
                address,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            // await newContact.save();
            // Save the new contact to the database
            await newContact.save({ wtimeout: 50000 })  // Timeout of 50 seconds
            .then(() => res.status(201).json({ message: 'Contact created successfully', contact: newContact }))
            .catch((err: any) => res.status(500).json({ message: 'Error creating contact', error: err.message }));
        } catch (error: any) {
            console.log(error);
            res.status(500).json({ message: 'Error creating contact', error: error.message });
        }
    }

    // Get all contacts
    async getAll(__: Request, res: Response): Promise<void> {
        try {
            const contacts = await contactsRepository.getAll();
            res.status(200).json({ contacts });
        } catch (error: any) {
            res.status(500).json({ message: 'Error fetching contacts', error: error.message });
        }
    }

    // Get contact by ID
    async getById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const contact = await contactsRepository.getById(id);

            if (!contact) {
                res.status(404).json({ message: 'Contact not found' });
                return;
            }

            res.status(200).json({ contact });
        } catch (error: any) {
            res.status(500).json({ message: 'Error fetching contact', error: error.message });
        }
    }

    // Update contact by ID
    async update(req: Request, res: Response): Promise<void> {
        try {
            const { id, logType } = req.params;
            const updateData = req.body;

            // Ensure the contact exists before updating
            const existingContact = await contactsRepository.getById(id);
            if (!existingContact) {
                res.status(404).json({ message: 'Contact not found' });
                return;
            }

            await contactOpsSvc.updateContactData(updateData,Number(logType),id);

            res.status(200).json({ message: 'Contact updated successfully' });
        } catch (error: any) {
            res.status(500).json({ message: 'Error updating contact', error: error.message });
        }
    }

    // Delete contact by ID
    async delete(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            // Ensure the contact exists before deleting
            const contact = await contactsRepository.getById(id);
            if (!contact) {
                res.status(404).json({ message: 'Contact not found' });
                return;
            }

            // Delete the contact from the repository
            await contactsRepository.delete(id);

            res.status(200).json({ message: 'Contact deleted successfully' });
        } catch (error: any) {
            res.status(500).json({ message: 'Error deleting contact', error: error.message });
        }
    }
}

export default new ContactsController();
