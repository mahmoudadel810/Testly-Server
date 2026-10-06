import joi from 'joi';

export const contactValidation = {
    createContactSchema: joi.object({
        name: joi.string().min(2).required().messages({
            'string.empty': 'Name is required',
            'string.min': 'Name must be at least 2 characters',
            'any.required': 'Name is required'
        }),
        email: joi.string().email({ tlds: { allow: false } }).required().messages({
            'string.empty': 'Email is required',
            'string.email': 'Please enter a valid email address',
            'any.required': 'Email is required'
        }),
        subject: joi.string().required().messages({
            'string.empty': 'Subject is required',
            'any.required': 'Subject is required'
        }),
        message: joi.string().min(5).required().messages({
            'string.empty': 'Message is required',
            'string.min': 'Message must be at least 5 characters',
            'any.required': 'Message is required'
        })
    })
};
