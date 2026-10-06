import User from '../../DB/models/user.model.js';
import jwt from 'jsonwebtoken';
import { sendEmail, trySendEmail } from '../../services/sendEmail.js';
import { compareFuncion, hashFunction } from "../../utils/generateHash.js";
import { tokenFunction } from '../../utils/tokenFunction.js';
import { nanoid } from 'nanoid';
import Teacher from '../../DB/models/teacher.model.js';
import { asyncHandler, AppError } from '../../utils/errorHandling.js';
import logger from '../../utils/logger.js';
import cacheManager from '../../utils/cache.js';







// Confirmation links stay valid for 7 days
const CONFIRMATION_TOKEN_TTL = 60 * 60 * 24 * 7;
// Sign-in sessions last 24 hours (long enough to finish any exam)
const LOGIN_TOKEN_TTL = 60 * 60 * 24;

// Sends the confirmation email; returns false (never throws) when the email service is unavailable
const sendConfirmationEmail = (user) =>
{
    const token = tokenFunction({
        payload: { _id: user._id, email: user.email },
        expiresIn: CONFIRMATION_TOKEN_TTL
    });

    // The component made by FE to confirm email after user click mail
    const confirmationLink = `${process.env.FRONTEND_URL || 'https://testly-sand.vercel.app'}/confirm-email/${token}`;
    return trySendEmail({
        to: user.email,
        subject: 'confirmationEmail',
        message: `<div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 20px auto; padding: 30px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #007bff; text-align: center; margin-bottom: 25px; padding-bottom: 10px; border-bottom: 1px solid #eee;">Confirm Your Email Address</h2>
        <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 15px;">Hi ${user.username},</p>
        <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 25px;">Thank you for registering with Testly! Please click the button below to verify your email address:</p>
               <div style="text-align: center; margin: 30px 0;">
           <a href="${confirmationLink}" style="background-color: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 17px; transition: background-color 0.3s ease;">Confirm Email</a>
             </div>
        <p style="font-size: 14px; color: #777; margin-top: 30px; text-align: center;">If you didn't create an account, you can safely ignore this email.</p>
        <p style="font-size: 12px; color: #aaa; margin-top: 25px; text-align: center;">&copy; ${new Date().getFullYear()} Testly. All rights reserved.</p>
      </div>`
    });
};

//============================== Register user=================================
export const register = asyncHandler(async (req, res, next) =>
{
    const { username, email, password, cpass } = req.body;

    // Check if user exists
    if (email)
    {
        const user = await User.findOne({ email });
        if (user && user.isConfirmed)
        {
            return next(new AppError('A user with this email address already exists', 400));
        }

        // One email = one account: a teacher account owns this address
        if (await Teacher.exists({ email }))
        {
            return next(new AppError('This email address is already registered as a teacher account', 400));
        }

        // An unconfirmed registration (e.g. expired link) is replaced by the new one
        if (user)
        {
            await User.deleteOne({ _id: user._id, isConfirmed: false });
            logger.info('Replacing unconfirmed registration', { userId: user._id });
        }
    }

    const hashedPass = hashFunction({ payload: password });

    // Create a new user object with all required fields
    const newUser = new User({
        username,
        email,
        password: hashedPass,
    });

    const emailed = await sendConfirmationEmail(newUser);

    // If the confirmation email cannot be delivered, activate the account directly
    // instead of leaving the user unable to ever sign in.
    if (!emailed)
    {
        newUser.isConfirmed = true;
        logger.warn('Confirmation email not sent; account activated without email confirmation', { userId: newUser._id });
    }

    await newUser.save();

    // Log successful user registration
    logger.info('User registered successfully', { userId: newUser._id, email: newUser.email });

    res.status(201).json({
        success: true,
        message: emailed
            ? 'User registered successfully! Please check your email to confirm your account.'
            : 'User registered successfully! Your account is active, you can sign in now.'
    });
});

//============================== Resend confirmation email =================================
export const resendConfirmation = asyncHandler(async (req, res, next) =>
{
    const { email } = req.body;
    const genericMessage = 'If an unconfirmed account exists for this email, a new confirmation link has been sent.';

    const user = await User.findOne({ email, isConfirmed: false });
    if (!user)
    {
        // Same answer for unknown and already-confirmed emails
        return res.status(200).json({ success: true, message: genericMessage });
    }

    const emailed = await sendConfirmationEmail(user);

    // Same policy as register: without a working email service, activate the account directly
    if (!emailed)
    {
        await User.updateOne({ _id: user._id }, { $set: { isConfirmed: true } });
        logger.warn('Confirmation email not resent; account activated without email confirmation', { userId: user._id });
        return res.status(200).json({
            success: true,
            message: 'The confirmation email could not be sent, so your account has been activated. You can sign in now.'
        });
    }

    logger.info('Confirmation email resent', { userId: user._id });
    res.status(200).json({ success: true, message: genericMessage });
});

//================= Teacher registration endpoint===============
export const registerTeacher = asyncHandler(async (req, res, next) =>
{
    const { name, email, password, phone, address, nationalId } = req.body;

    // Check if teacher already exists with this email
    if (email)
    {
        const existingTeacher = await Teacher.findOne({ email });
        if (existingTeacher)
        {
            return next(new AppError('A teacher with this email address already exists', 400));
        }

        // One email = one account: a student/admin account owns this address
        if (await User.exists({ email }))
        {
            return next(new AppError('This email address is already registered as a student account', 400));
        }
    }

    // Check if teacher already exists with this national ID
    if (nationalId)
    {
        const existingTeacher = await Teacher.findOne({ nationalId });
        if (existingTeacher)
        {
            return next(new AppError('A teacher with this National ID is already registered', 400));
        }
    }

    const hashedPass = hashFunction({ payload: password });

    // Create a new teacher with all required fields
    const newTeacher = new Teacher({
        name,
        email,
        password: hashedPass,
        phone,
        address,
        nationalId,
        isConfirmed: true, // Email is confirmed
        confirmedAsTeacher: false, // Not yet approved as teacher
        isLoggedIn: false,
        status: 'Active'
    });

    await newTeacher.save();

    if (cacheManager && typeof cacheManager.del === 'function')
    {
        try
        {
            await Promise.all([
                cacheManager.del('admin:pending_teachers'),
                cacheManager.del('admin:pending_teachers_count')
            ]);
        } catch (error)
        {
            // Silently handle cache errors - don't affect the API behavior
            logger.warn('Failed to invalidate teacher cache', { error: error.message });
        }
    }

    // Log successful teacher registration
    logger.info('Teacher registered successfully and pending approval', { teacherId: newTeacher._id, email: newTeacher.email });

    res.status(201).json({
        success: true,
        message: 'Your teacher application has been submitted successfully. We will contact you soon after review.'
    });
});

// Get all confirmed teachers for student selection
export const getConfirmedTeachers = asyncHandler(async (req, res, next) =>
{

    const confirmedTeachers = await Teacher.find({
        confirmedAsTeacher: true,
        status: 'Active'
    }).select('_id name');

    logger.info('Confirmed teachers retrieved directly from database');

    res.status(200).json({
        success: true,
        data: confirmedTeachers,
        message: 'Confirmed teachers retrieved successfully'
    });
});



//===========================ConfirmEmail===============================================

export const confirmEmail = asyncHandler(async (req, res, next) =>
{
    const { token } = req.params;

    const decode = tokenFunction({ payload: token, generate: false });

    if (!decode?._id)
    {
        return next(new AppError('Invalid or expired confirmation token', 400));
    }

    const user = await User.findOneAndUpdate(
        { _id: decode._id, isConfirmed: false },
        { $set: { isConfirmed: true } }
    );

    if (!user)
    {
        return res.status(200).json({
            success: true,
            message: "Email address has already been confirmed. You can now log in."
        });
    }

    res.status(200).json({
        success: true,
        message: "Email confirmed successfully! You can now log in to your account."
    });
});

//=======================================LogIn=============================================

export const logIn = asyncHandler(async (req, res, next) =>
{
    const { email, password } = req.body;

    if (!email || !password)
    {
        return next(new AppError('Please provide both email and password', 400));
    }

    // Check if SIGNATURE environment variable is available 
    if (!process.env.SIGNATURE)
    {
        console.error("ERROR: JWT SIGNATURE environment variable is not defined");
        return next(new AppError('Server configuration error - Authentication service unavailable', 500));
    }

    // First check if it's a regular user (always read from the database: the password hash is never cached)
    const userCheck = await User.findOne({ email, isConfirmed: true });

    if (userCheck)
    {
        const match = compareFuncion({ payload: password, referenceData: userCheck.password });

        if (!match)
        {
            return next(new AppError('Invalid email or password', 401));
        }

        const token = tokenFunction({
            payload: {
                id: userCheck._id,
                email: userCheck.email,
                username: userCheck.username,
                role: userCheck.role
            },
            expiresIn: LOGIN_TOKEN_TTL
        });

        if (!token)
        {
            return next(new AppError('Authentication token generation failed', 500));
        }

        // Store session in Redis - Redis caching addition
        const sessionData = {
            userId: userCheck._id,
            username: userCheck.username,
            email: userCheck.email,
            role: userCheck.role,
            loginTime: new Date(),
            lastActivity: new Date(),
            isActive: true
        };
        await cacheManager.setSession(token, sessionData);

        await User.findOneAndUpdate(
            { email },
            { $set: { isLoggedIn: true, status: "Active" } }
        );

        // Invalidate cached user data to reflect the login status change
        await cacheManager.invalidateUser(userCheck._id.toString());

        // Log successful user login
        logger.info('User logged in successfully', { userId: userCheck._id, email: userCheck.email });

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            token: token,
            user: {
                id: userCheck._id,
                username: userCheck.username,
                email: userCheck.email,
                role: userCheck.role
            }
        });
    }

    // If not a regular user, check if it's a teacher
    const teacherCheck = await Teacher.findOne({
        email,
        isConfirmed: true,
        confirmedAsTeacher: true // Only allow confirmed teachers to log in
    });

    if (teacherCheck)
    {
        const match = compareFuncion({ payload: password, referenceData: teacherCheck.password });

        if (!match)
        {
            return next(new AppError('Invalid email or password', 401));
        }

        const token = tokenFunction({
            payload: {
                id: teacherCheck._id,
                email: teacherCheck.email,
                name: teacherCheck.name,
                role: teacherCheck.role
            },
            expiresIn: LOGIN_TOKEN_TTL
        });

        if (!token)
        {
            return next(new AppError('Authentication token generation failed', 500));
        }

        // Store session in Redis for teacher - Redis caching addition
        const sessionData = {
            userId: teacherCheck._id,
            name: teacherCheck.name,
            email: teacherCheck.email,
            role: teacherCheck.role,
            loginTime: new Date(),
            lastActivity: new Date(),
            isActive: true,
            isTeacher: true
        };
        await cacheManager.setSession(token, sessionData);

        await Teacher.findOneAndUpdate(
            { email },
            { $set: { isLoggedIn: true, status: "Active" } }
        );

        return res.status(200).json({
            success: true,
            message: 'Teacher login successful',
            token: token,
            user: {
                id: teacherCheck._id,
                name: teacherCheck.name,
                email: teacherCheck.email,
                role: teacherCheck.role,
                isTeacher: true
            }
        });
    }
    return next(new AppError('Invalid email or password, or account not confirmed', 401));
});

//======================== Get current logged in user=============================================

export const getMe = asyncHandler(async (req, res, next) =>
{
    const userId = req.user.id;

    // Redis caching addition (non-destructive) - Try to get from cache first
    let cachedUser;
    if (cacheManager && typeof cacheManager.getUserProfile === 'function')
    {
        try
        {
            cachedUser = await cacheManager.getUserProfile(userId.toString());

            if (cachedUser)
            {
                // Never return secrets, even from an entry cached by an older version
                const { password, code, ...safeProfile } = cachedUser;
                logger.debug('User profile retrieved from cache', { userId });
                return res.status(200).json({
                    success: true,
                    data: safeProfile,
                    message: 'User information retrieved successfully'
                });
            }
        } catch (error)
        {
            // Silently handle cache errors - don't affect the API behavior
            logger.warn('Failed to get user from cache', { error: error.message });
        }
    }

    // Teachers live in their own collection; protect() already loaded req.user from the right model
    const isTeacher = req.user.role === 'teacher' || req.user.constructor?.modelName === 'Teacher';
    const UserModel = isTeacher ? Teacher : User;
    const user = await UserModel.findById(userId).select('-password -code');

    if (!user)
    {
        return next(new AppError('User not found', 404));
    }

    // Redis caching addition (non-destructive) - Cache the user profile
    if (cacheManager && typeof cacheManager.setUserProfile === 'function')
    {
        try
        {
            await cacheManager.setUserProfile(userId.toString(), user);
        } catch (error)
        {
            // Silently handle cache errors - don't affect the API behavior
            logger.warn('Failed to cache user profile', { error: error.message });
        }
    }

    res.status(200).json({
        success: true,
        data: user,
        message: 'User information retrieved successfully'
    });
});

//Iwill send tokens in header later 

const sendTokenResponse = (user, statusCode, res) =>
{
    // Create token
    const token = tokenFunction({ payload: { id: user._id, email: user.email, username: user.username, role: user.role } });

    res.status(statusCode).json({
        success: true,
        token,
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role
        }
    });
};



//======================reset User Password===========================================

export const resetPassword = asyncHandler(async (req, res, next) =>
{
    const { email } = req.body;

    // Students/admins and teachers can both reset their password
    const user = await User.findOne({ email }) || await Teacher.findOne({ email });
    if (!user)
    {
        return next(new AppError('No user found with this email address', 404));
    }

    const code = nanoid(6);

    // Store the code before emailing it, so a code that reaches the user always works
    await user.constructor.updateOne({ _id: user._id }, { $set: { code } });

    const emailed = await sendEmail({
        to: email,
        subject: 'Reset your Password',
        message: `<div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 20px auto; padding: 30px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #dc3545; text-align: center; margin-bottom: 25px; padding-bottom: 10px; border-bottom: 1px solid #eee;">Password Reset Request</h2>
        <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 15px;">Hello,</p>
        <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 25px;">We received a request to reset your password for your Testly account. Please use the following code to complete the reset process:</p>
               <div style="text-align: center; margin: 30px 0; padding: 15px 25px; background-color: #f8f9fa; border: 1px dashed #ced4da; border-radius: 5px;">
           <p style="font-size: 24px; font-weight: bold; color: #dc3545; margin: 0;">${code}</p>
             </div>
        <p style="font-size: 14px; color: #777; margin-top: 30px; text-align: center;">If you did not request a password reset, please ignore this email.</p>
        <p style="font-size: 12px; color: #aaa; margin-top: 25px; text-align: center;">&copy; ${new Date().getFullYear()} Testly. All rights reserved.</p>
      </div>`
    });

    if (!emailed)
    {
        return next(new AppError('Failed to send password reset email. Please try again later.', 503));
    }

    res.status(200).json({
        success: true,
        message: 'Password reset code sent successfully to your email.'
    });
});

//===================verify User Password================================

export const verifyReset = asyncHandler(async (req, res, next) =>
{
    const { code, newPassword, confirmNewPassword } = req.body;

    // Find user (student/admin or teacher) by code
    const user = await User.findOne({ code }) || await Teacher.findOne({ code });
    if (!user)
    {
        return next(new AppError('Invalid or expired reset code', 400));
    }

    // Hash new password and update user in its own collection
    const hashedPassword = hashFunction({ payload: newPassword });
    await user.constructor.findOneAndUpdate(
        { _id: user._id },
        {
            $set: { password: hashedPassword, code: nanoid() } // Invalidate code after use
        },
        { new: true }
    );

    res.status(200).json({
        success: true,
        message: "Password updated successfully. You can now log in with your new password."
    });
});

//===================================logOut==================================

export const logOut = asyncHandler(async (req, res, next) =>
{
    // Get user from the authenticated request
    const user = req.user; // Use the user object provided by the protect middleware
    const token = req.headers.authorization?.split(process.env.BAREAR)[1];

    // The protect middleware should handle the case where req.user is not found,
    // but adding a check here for safety, although it should theoretically not be reached.
    if (!user)
    {
        return next(new AppError('Authentication failed. User not found in request.', 401));
    }

    // Determine the correct model based on user role
    const UserModel = user.role === 'teacher' ? Teacher : User;

    if (user.isLoggedIn === false)
    {
        logger.info('User is already logged out', { userId: user._id, role: user.role });
        return res.status(200).json({
            success: true,
            message: "User is already logged out"
        });
    }

    // Update user to set isLoggedIn to false using the correct model
    // For teachers, we only update isLoggedIn, not status
    const updateFields = { isLoggedIn: false };

    // Only set status to "In-Active" for regular users (students), not for teachers
    if (user.role !== 'teacher')
    {
        updateFields.status = "In-Active";
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
        user._id,
        { $set: updateFields },
        { new: true }
    );

    if (!updatedUser)
    {
        // This case is unlikely if findByIdAndUpdate was called on the correct model with a valid ID
        return next(new AppError('Failed to update user logout status', 500));
    }

    // Redis caching addition (non-destructive)
    if (cacheManager && typeof cacheManager.deleteSession === 'function' && token)
    {
        try
        {
            // Remove session from Redis using the token
            await cacheManager.deleteSession(token);

            // Invalidate user cache using the user ID (valid for both User and Teacher)
            if (typeof cacheManager.invalidateUser === 'function')
            {
                await cacheManager.invalidateUser(user._id.toString());
            }
        } catch (error)
        {
            // Silently handle cache errors - don't affect the API behavior
            logger.warn('Failed to clear Redis session data', { error: error.message });
        }
    }

    // Log successful logout with user ID and role
    logger.info('User logged out successfully', { userId: user._id, role: user.role });

    res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    });
});

//===================================getUserById==================================

export const getUserById = asyncHandler(async (req, res, next) =>
{
    const userId = req.params.id;


    if (req.user.role !== 'admin' && req.user._id.toString() !== userId)
    {
        return next(new AppError('Not authorized to access this user data', 403));
    }

    const user = await User.findById(userId);
    if (!user)
    {
        return next(new AppError('User not found', 404));
    }

    res.status(200).json({
        success: true,
        data: user,
        message: 'User details retrieved successfully'
    });
});

export const validateToken = asyncHandler(async (req, res, next) =>
{
    // You should have middleware that sets req.user from the token
    if (!req.user)
    {
        return next(new AppError('Invalid or expired token', 401));
    }

    // Return user role and id for additional checks on the frontend
    res.status(200).json({
        success: true,
        valid: true,
        role: req.user.role,
        id: req.user._id,
        isTeacher: req.user.role === 'teacher',
        message: 'Token is valid'
    });
});
