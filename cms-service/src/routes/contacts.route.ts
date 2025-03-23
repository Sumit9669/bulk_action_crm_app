import { Router } from 'express';
import ContactsController from '../controllers/contacts.controller';

const contactRouter = Router();

// Define the routes and associate them with controller methods
contactRouter.post('/contacts', ContactsController.create);          // Create a new contact
contactRouter.get('/contacts', ContactsController.getAll);           // Get all contacts
contactRouter.get('/contacts/:id', ContactsController.getById);      // Get a contact by ID
contactRouter.put('/contacts/:id/:logType', ContactsController.update);       // Update a contact by ID
contactRouter.delete('/contacts/:id', ContactsController.delete);    // Delete a contact by ID

export default contactRouter;
