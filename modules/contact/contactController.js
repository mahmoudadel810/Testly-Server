import Contact from '../../DB/models/contact.model.js';
import { asyncHandler, AppError } from '../../utils/errorHandling.js';
import logger from '../../utils/logger.js';




 
//====================== create contact ======================
export const createContact = asyncHandler(async (req, res, next) =>
{
    const { name, email, subject, message } = req.body;

    // Create new contact entry
    const contact = await Contact.create({
        name,
        email,
        subject,
        message
    });

    res.status(201).json({
        success: true,
        message: 'Thank you for your message! We will get back to you soon.',
        data: contact
    });
});

//====================== get all contacts ======================
export const getAllContacts = asyncHandler(async (req, res, next) =>
{
    // Allow filtering by status if provided in query
    const filter = req.query.status ? { status: req.query.status } : {};

    const contacts = await Contact.find(filter)
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        data: contacts,
        message: 'Contacts retrieved successfully'
    });
});

//====================== get contact by id ======================
export const getContactById = asyncHandler(async (req, res, next) =>
{
    const contact = await Contact.findById(req.params.id);

    if (!contact)
    {
        return next(new AppError('Contact message not found', 404));
    }

    logger.info(`Contact message with ID ${req.params.id} retrieved successfully`);

    res.status(200).json({
        success: true,
        data: contact,
        message: 'Contact retrieved successfully'
    });
});

//====================== update contact status ======================
export const updateContactStatus = asyncHandler(async (req, res, next) =>
{
    const { status } = req.body;

    if (!['new', 'in-progress', 'resolved'].includes(status))
    {
        return next(new AppError('Invalid status value. Must be "new", "in-progress", or "resolved"', 400));
    }

    const contact = await Contact.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true, runValidators: true }
    );

    if (!contact)
    {
        return next(new AppError('Contact message not found', 404));
    }

    logger.info(`Contact status updated successfully for contact ID ${req.params.id}`);

    res.status(200).json({
        success: true,
        message: 'Contact status updated successfully',
        data: contact
    });
});

//====================== delete contact ======================
export const deleteContact = asyncHandler(async (req, res, next) =>
{
    const contact = await Contact.findByIdAndDelete(req.params.id);

    if (!contact)
    {
        return next(new AppError('Contact message not found', 404));
    }

    logger.info(`Contact message with ID ${req.params.id} deleted successfully`);

    res.status(200).json({
        success: true,
        message: 'Contact deleted successfully'
    });
});
