import express from 'express';
import { protect, authorize } from '../../middelWares/auth.js';
import * as contactController from './contactController.js';
import { validation } from '../../middelWares/validation.js';
import { contactValidation } from './contactValidations.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Contact
 *   description: Contact form and message management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Contact:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - message
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the contact message
 *         name:
 *           type: string
 *           description: Name of the person contacting
 *         email:
 *           type: string
 *           description: Email of the person contacting
 *         subject:
 *           type: string
 *           description: Subject of the message
 *         message:
 *           type: string
 *           description: The contact message content
 *         status:
 *           type: string
 *           description: Status of the contact message
 *           enum: [pending, read, replied]
 *           default: pending
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the message was created
 *       example:
 *         name: John Doe
 *         email: john@example.com
 *         subject: Question about the platform
 *         message: I have a question about how to use the quiz feature
 *         status: pending
 *     
 *     ContactSubmission:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - message
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the person contacting
 *         email:
 *           type: string
 *           description: Email of the person contacting
 *         subject:
 *           type: string
 *           description: Subject of the message
 *         message:
 *           type: string
 *           description: The contact message content
 *       example:
 *         name: John Doe
 *         email: john@example.com
 *         subject: Question about the platform
 *         message: I have a question about how to use the quiz feature
 */

/**
 * @swagger
 * /api/contact/submit:
 *   post:
 *     summary: Submit a contact form message
 *     tags: [Contact]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ContactSubmission'
 *     responses:
 *       201:
 *         description: Contact message submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Message sent successfully
 *                 data:
 *                   $ref: '#/components/schemas/Contact'
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Server error
 */
// Public route for contact form submission
router.post('/submit', validation({ body: contactValidation.createContactSchema }),
    contactController.createContact
);

/**
 * @swagger
 * /api/contact/admin/messages:
 *   get:
 *     summary: Get all contact messages (Admin only)
 *     tags: [Contact]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all contact messages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Contact'
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.get(
    '/admin/messages',
    protect,
    authorize('admin'),
    contactController.getAllContacts
);

/**
 * @swagger
 * /api/contact/admin/messages/{id}:
 *   get:
 *     summary: Get a specific contact message by ID (Admin only)
 *     tags: [Contact]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The contact message ID
 *     responses:
 *       200:
 *         description: Contact message retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Contact'
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Contact message not found
 *       500:
 *         description: Server error
 */
router.get(
    '/admin/messages/:id',
    protect,
    authorize('admin'),
    contactController.getContactById
);

/**
 * @swagger
 * /api/contact/admin/messages/{id}:
 *   put:
 *     summary: Update contact message status (Admin only)
 *     tags: [Contact]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The contact message ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, read, replied]
 *                 description: New status for the message
 *             example:
 *               status: read
 *     responses:
 *       200:
 *         description: Contact message status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Contact message status updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Contact'
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Contact message not found
 *       500:
 *         description: Server error
 */
router.put(
    '/admin/messages/:id',
    protect,
    authorize('admin'),
    contactController.updateContactStatus
);

/**
 * @swagger
 * /api/contact/admin/messages/{id}:
 *   delete:
 *     summary: Delete a contact message (Admin only)
 *     tags: [Contact]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The contact message ID
 *     responses:
 *       200:
 *         description: Contact message deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Contact message deleted successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Contact message not found
 *       500:
 *         description: Server error
 */
router.delete(
    '/admin/messages/:id',
    protect,
    authorize('admin'),
    contactController.deleteContact
);

export default router;
