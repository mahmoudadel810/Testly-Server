import User from '../../DB/models/user.model.js';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../../services/sendEmail.js';
import { compareFuncion, hashFunction } from "../../utils/generateHash.js";
import { tokenFunction } from '../../utils/tokenFunction.js';
import { nanoid } from 'nanoid';
import Teacher from '../../DB/models/teacher.model.js';
import { asyncHandler, AppError } from '../../utils/errorHandling.js';
import logger from '../../utils/logger.js';
import cacheManager from '../../utils/cache.js';







//============================== Register user=================================
export const register = asyncHandler(async (req, res, next) =>
{
    const { username, email, password, cpass } = req.body;

    // Check if user exists
    if (email)
    {
        const user = await User.findOne({ email });
        if (user)
        {
            return next(new AppError('A user with this email address already exists', 400));
        }
    }

    const hashedPass = hashFunction({ payload: password });

    // Create a new user object with all required fields
    const newUser = new User({
        username,
        email,
        password: hashedPass,
    });

    const token = tokenFunction({ payload: { _id: newUser._id, email: newUser.email } });
    // console.log("token", token);

    // The component made by FE to confirm email after user click mail
    const confirmationLink = `http://localhost:4200/confirm-email/${token}`;
    const emailed = await sendEmail({
        to: newUser.email,
        subject: 'confirmationEmail',
        message: `<div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 20px auto; padding: 30px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #007bff; text-align: center; margin-bottom: 25px; padding-bottom: 10px; border-bottom: 1px solid #eee;">Confirm Your Email Address</h2>
        <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 15px;">Hi ${username},</p>
        <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 25px;">Thank you for registering with Testly! Please click the button below to verify your email address:</p>
               <div style="text-align: center; margin: 30px 0;">
           <a href="${confirmationLink}" style="background-color: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 17px; transition: background-color 0.3s ease;">Confirm Email</a>
             </div>
        <p style="font-size: 14px; color: #777; margin-top: 30px; text-align: center;">If you didn't create an account, you can safely ignore this email.</p>
        <p style="font-size: 12px; color: #aaa; margin-top: 25px; text-align: center;">&copy; ${new Date().getFullYear()} Testly. All rights reserved.</p>
      </div>`
    });

    if (!emailed)
    {
        return next(new AppError('Registration failed - Unable to send confirmation email. Please try again later.', 503));
    }

    await newUser.save();

    // Log successful user registration
    logger.info('User registered successfully', { userId: newUser._id, email: newUser.email });

    res.status(201).json({
        success: true,
        message: 'User registered successfully! Please check your email to confirm your account.'
    });
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

    // Invalidate pending teachers cache - Redis caching addition (non-destructive)
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
    // Redis caching addition (non-destructive) - Try to get from cache first
    let cachedTeachers;
    if (cacheManager && typeof cacheManager.get === 'function')
    {
        try
        {
            const cacheKey = 'auth:confirmed_teachers';
            cachedTeachers = await cacheManager.get(cacheKey);

            if (cachedTeachers)
            {
                logger.debug('Confirmed teachers retrieved from cache');
                return res.status(200).json({
                    success: true,
                    data: cachedTeachers,
                    message: 'Confirmed teachers retrieved successfully'
                });
            }
        } catch (error)
        {
            // Silently handle cache errors - don't affect the API behavior
            logger.warn('Failed to get teachers from cache', { error: error.message });
        }
    }

    // Get all confirmed teachers and return just their ID and name
    const confirmedTeachers = await Teacher.find({
        confirmedAsTeacher: true,
        status: 'Active'
    }).select('_id name');

    // Redis caching addition (non-destructive) - Cache the result for future requests
    if (cacheManager && typeof cacheManager.set === 'function')
    {
        try
        {
            const cacheKey = 'auth:confirmed_teachers';
            await cacheManager.set(cacheKey, confirmedTeachers, 3600); // Cache for 1 hour
        } catch (error)
        {
            // Silently handle cache errors - don't affect the API behavior
            logger.warn('Failed to cache teachers', { error: error.message });
        }
    }

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

    // Try to get cached user first - Redis caching addition
    const userCacheKey = `user:login:${email}`;
    let userCheck = await cacheManager.get(userCacheKey);

    if (!userCheck)
    {
        // First check if it's a regular user
        userCheck = await User.findOne({ email, isConfirmed: true });

        if (userCheck)
        {
            // Cache the user data for 15 minutes
            await cacheManager.setUser(userCheck._id.toString(), userCheck);
        }
    }

    if (userCheck)
    {
        const match = compareFuncion({ payload: password, referenceData: userCheck.password });
        console.log("password match result:", match);

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
            }
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
            }
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
            { $set: { isLoggedIn: true } }
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
                logger.debug('User profile retrieved from cache', { userId });
                return res.status(200).json({
                    success: true,
                    data: cachedUser,
                    message: 'User information retrieved successfully'
                });
            }
        } catch (error)
        {
            // Silently handle cache errors - don't affect the API behavior
            logger.warn('Failed to get user from cache', { error: error.message });
        }
    }

    const user = await User.findById(userId);

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

    const user = await User.findOne({ email });
    if (!user)
    {
        return next(new AppError('No user found with this email address', 404));
    }

    const code = nanoid(6);

    const emailed = await sendEmail({
        to: email,
        subject: 'Reset your Password',
        message: `Your password reset code is: ${code}`
    });

    if (!emailed)
    {
        return next(new AppError('Failed to send password reset email. Please try again later.', 503));
    }

    try
    {
        user.code = code;
        await user.save();
    } catch (saveError)
    {
        console.log("Failed to save code to user, but email was sent:", saveError);
        // Continue execution as email was sent successfully
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

    // Find user by code
    const user = await User.findOne({ code });
    if (!user)
    {
        return next(new AppError('Invalid or expired reset code', 400));
    }

    // Hash new password and update user
    const hashedPassword = hashFunction({ payload: newPassword });
    await User.findOneAndUpdate(
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
    // Get user ID from the authenticated request
    const userId = req.user.id;
    const token = req.headers.authorization?.split(' ')[1];

    const user = await User.findById(userId);
    if (!user)
    {
        return next(new AppError('User not found', 404));
    }

    if (user.isLoggedIn === false)
    {
        return res.status(200).json({
            success: true,
            message: "User is already logged out"
        });
    }

    // Update user to set isLoggedIn to false
    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: { isLoggedIn: false, status: "In-Active" } },
        { new: true }
    );

    if (!updatedUser)
    {
        return next(new AppError('Failed to update user logout status', 500));
    }

    // Redis caching addition (non-destructive)
    if (cacheManager && typeof cacheManager.deleteSession === 'function' && token)
    {
        try
        {
            // Remove session from Redis
            await cacheManager.deleteSession(token);

            // Invalidate user cache
            if (typeof cacheManager.invalidateUser === 'function')
            {
                await cacheManager.invalidateUser(userId.toString());
            }
        } catch (error)
        {
            // Silently handle cache errors - don't affect the API behavior
            logger.warn('Failed to clear Redis session data', { error: error.message });
        }
    }

    // Log successful logout
    logger.info('User logged out successfully', { userId: userId });

    res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    });
});

//===================================getUserById==================================

export const getUserById = asyncHandler(async (req, res, next) =>
{
    const user = await User.findById(req.params.id);
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
