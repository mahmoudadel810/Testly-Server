import jwt from 'jsonwebtoken';
import User from '../DB/models/user.model.js';
import Teacher from '../DB/models/teacher.model.js';
import { asyncHandler, AppError } from '../utils/errorHandling.js';

// Protect routes - verify token middleware
export const protect = asyncHandler(async (req, res, next) =>
{
    let token;
    console.log("Auth header:", req.headers.authorization);

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith(process.env.BAREAR)
    )
    {
        token = req.headers.authorization.split(process.env.BAREAR)[1];
        console.log("Extracted token:", token ? token.substring(0, 10) + "..." : "null");
    }

    if (!token)
    {
        return next(new AppError('Access denied. Not authorized to access this route', 401));
    }

    // Verify token decode it make sure yr name and mail in the token
    const decoded = jwt.verify(token, process.env.SIGNATURE);
    console.log("Token verified successfully:", decoded);

    let user;

    // Check if the token contains the id property
    if (decoded.id)
    {
        // Check if it's a teacher token (has name but no username)
        if (decoded.role === 'teacher' || (decoded.name && !decoded.username))
        {
            user = await Teacher.findById(decoded.id).select('-password');

        } else
        {
            // Otherwise try to find a regular user
            user = await User.findById(decoded.id).select('-password');
        }
    }

    if (!user)
    {
        return next(new AppError('Authentication failed. User associated no longer exists', 401));
    }

    // Set user in request
    req.user = user;
    next();
});

// Role-based authorization middleware
export const authorize = (...roles) =>
{
    return (req, res, next) =>
    {
        if (!req.user)
        {
            return next(new AppError('Authentication required to access this resource', 401));
        }

        if (!roles.includes(req.user.role))
        {
            return next(new AppError(`Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`, 403));
        }
        next();
    };
};
