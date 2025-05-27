import express from 'express';
import { protect, authorize } from '../../middelWares/auth.js';
import * as contactController from './contactController.js';
import { validation } from '../../middelWares/validation.js';
import { contactValidation } from './contactValidations.js';

const router = express.Router();

// Public route for contact form submission
router.post('/submit',validation(contactValidation.createContactSchema),
    contactController.createContact
);

router.get(
    '/admin/messages',
    protect,
    authorize('admin'),
    contactController.getAllContacts
);

router.get(
    '/admin/messages/:id',
    protect,
    authorize('admin'),
    contactController.getContactById
);

router.put(
    '/admin/messages/:id',
    protect,
    authorize('admin'),
    contactController.updateContactStatus
);

router.delete(
    '/admin/messages/:id',
    protect,
    authorize('admin'),
    contactController.deleteContact
);

export default router;
