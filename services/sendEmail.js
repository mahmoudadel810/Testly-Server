import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { AppError } from '../utils/errorHandling.js';

dotenv.config();

export const sendEmail = async ({ to = '', message = '', subject = '' }) =>
{
    // Check if email credentials are available
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass)
    {
        throw new AppError('Email service not configured.', 503);
    }

    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: emailUser,
            pass: emailPass
        },
        tls: {
            rejectUnauthorized: false // Only use this in development
        }
    });

    try
    {
        // Verify transporter configuration
        await transporter.verify();
        console.log('SMTP connection verified successfully');
    } catch (error)
    {
        throw new AppError('Failed to connect to email service.', 503);
    }

    try
    {
        const info = await transporter.sendMail({
            from: `"Testly" <${emailUser}>`,
            to,
            subject,
            html: message,
        });

        console.log('Email sent successfully:', info.messageId);
        console.log('Email accepted recipients:', info.accepted);

        if (!info.accepted.length)
        {
            throw new AppError('Email was not accepted by any recipients', 400);
        }
        return true;
    } catch (error)
    {
        if (error.code === 'EAUTH')
        {
            throw new AppError('Email authentication failed. Please check credentials.', 503);
        } else if (error.code === 'ESOCKET')
        {
            throw new AppError('Network error while sending email. Please check your connection.', 503);
        }

        throw new AppError('Failed to send email. Please try again later.', 503);
    }
};