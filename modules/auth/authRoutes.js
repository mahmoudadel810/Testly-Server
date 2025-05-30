import { Router } from "express";
import { protect } from '../../middelWares/auth.js';
import { validation } from "../../middelWares/validation.js";
import { signUpValidator, loginValidator, verifyReset } from "./authValidation.js";
import * as authController from "./authController.js";
const router = Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - password
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the user
 *         username:
 *           type: string
 *           description: The username of the user
 *         email:
 *           type: string
 *           description: The email of the user
 *         password:
 *           type: string
 *           description: The hashed password of the user
 *         role:
 *           type: string
 *           description: The role of the user
 *           enum: [user, admin]
 *           default: user
 *         isConfirmed:
 *           type: boolean
 *           description: Whether the user has confirmed their email
 *           default: false
 *         isLoggedIn:
 *           type: boolean
 *           description: Whether the user is currently logged in
 *           default: false
 *         status:
 *           type: string
 *           description: The status of the user
 *           enum: [Active, Inactive]
 *           default: Inactive
 *       example:
 *         username: johndoe
 *         email: john@example.com
 *         password: hashedpassword123
 *         role: user
 *         isConfirmed: true
 *         isLoggedIn: false
 *         status: Inactive
 *     
 *     UserSignUp:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - password
 *         - cpass
 *       properties:
 *         username:
 *           type: string
 *           description: The username of the user
 *         email:
 *           type: string
 *           description: The email of the user
 *         password:
 *           type: string
 *           description: The password of the user
 *         cpass:
 *           type: string
 *           description: The password confirmation
 *       example:
 *         username: johndoe
 *         email: john@example.com
 *         password: pass1234
 *         cpass: pass1234
 *     
 *     UserLogin:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           description: The email of the user
 *         password:
 *           type: string
 *           description: The password of the user
 *       example:
 *         email: john@example.com
 *         password: pass1234
 */

/**
 * @swagger
 * /api/auth/signUp:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserSignUp'
 *     responses:
 *       201:
 *         description: User created successfully
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
 *                   example: User Signed Up! Please check your email to confirm your account.
 *       400:
 *         description: User already exists or email could not be sent
 *       500:
 *         description: Error in registration
 */
router.post('/signUp', validation(signUpValidator), authController.register);

/**
 * @swagger
 * /api/auth/teacher/signUp:
 *   post:
 *     summary: Register a new teacher (requires admin approval)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserSignUp'
 *     responses:
 *       201:
 *         description: Teacher registration submitted successfully (pending admin approval)
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
 *                   example: Teacher registration submitted. Please wait for admin approval.
 *       400:
 *         description: Teacher already exists or validation failed
 *       500:
 *         description: Error in teacher registration
 */
// Add teacher registration route
router.post('/teacher/signUp', authController.registerTeacher);

/**
 * @swagger
 * /api/auth/teachers/confirmed:
 *   get:
 *     summary: Get list of confirmed/approved teachers
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: List of confirmed teachers retrieved successfully
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
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: 60d0fe4f5311236168a109ca
 *                       username:
 *                         type: string
 *                         example: teacher_john
 *                       email:
 *                         type: string
 *                         example: john.teacher@example.com
 *                       role:
 *                         type: string
 *                         example: teacher
 *       500:
 *         description: Server error
 */
// Get confirmed teachers for student registration
router.get('/teachers/confirmed', authController.getConfirmedTeachers);

/**
 * @swagger
 * /api/auth/confirmEmail/{token}:
 *   get:
 *     summary: Confirm user email
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: The confirmation token sent to the user's email
 *     responses:
 *       201:
 *         description: Email confirmed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User Confirmed, please go log in Now
 *       200:
 *         description: User already confirmed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User Already Confirmed
 */
router.get('/confirmEmail/:token', authController.confirmEmail);

/**
 * @swagger
 * /api/auth/signIn:
 *   post:
 *     summary: Log in a user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLogin'
 *     responses:
 *       200:
 *         description: Login successful
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
 *                   example: Login Success
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: 60d0fe4f5311236168a109ca
 *                     username:
 *                       type: string
 *                       example: johndoe
 *                     email:
 *                       type: string
 *                       example: john@example.com
 *                     role:
 *                       type: string
 *                       example: user
 *       400:
 *         description: Missing email or password
 *       401:
 *         description: Invalid login credentials
 *       500:
 *         description: Server error during login
 */
router.post('/signIn', validation(loginValidator), authController.logIn);

/**
 * @swagger
 * /api/auth/resetPassword:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 description: The email of the user
 *             example:
 *               email: john@example.com
 *     responses:
 *       200:
 *         description: Reset password email sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Reset password email sent
 *       400:
 *         description: User not found or email not sent
 *       500:
 *         description: Server error
 */
router.post('/resetPassword', authController.resetPassword);

/**
 * @swagger
 * /api/auth/verifyReset:
 *   post:
 *     summary: Verify reset password token and set new password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - resetCode
 *               - newPassword
 *             properties:
 *               resetCode:
 *                 type: string
 *                 description: The reset code sent to the user
 *               newPassword:
 *                 type: string
 *                 description: The new password
 *             example:
 *               resetCode: "123456"
 *               newPassword: "newpass1234"
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password reset successful
 *       400:
 *         description: Invalid reset code
 *       500:
 *         description: Server error
 */
router.post('/verifyReset', validation(verifyReset), authController.verifyReset);

/**
 * @swagger
 * /api/auth/getMe:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router.get('/getMe', protect, authController.getMe);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Log out a user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Logout successful
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router.post('/logout', protect, authController.logOut);

/**
 * @swagger
 * /api/auth/user/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The user ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/user/:id', protect, authController.getUserById);

/**
 * @swagger
 * /api/auth/validateToken:
 *   get:
 *     summary: Validate JWT token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
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
 *                   example: Token is valid
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid or expired token
 *       500:
 *         description: Server error
 */
router.get('/validateToken', protect, authController.validateToken);

export default router;
