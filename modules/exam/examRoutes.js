import { Router } from "express";
import * as examController from './examController.js';
import * as attemptController from '../attempt/attemptController.js';
import * as adminController from '../admin/adminController.js';
import { protect, authorize } from '../../middelWares/auth.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Exams
 *   description: Exam management endpoints
 */

/**
 * @swagger
 * /api/exam/exams:
 *   get:
 *     summary: Get all available exams for the user
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of exams retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Exam'
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router.get('/exams', protect, examController.getExams);

/**
 * @swagger
 * /api/exam/exams/{id}:
 *   get:
 *     summary: Get a specific exam by ID
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The exam ID
 *     responses:
 *       200:
 *         description: Exam details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Exam'
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Exam not found
 *       500:
 *         description: Server error
 */
router.get('/exams/:id', protect, examController.getExam);

/**
 * @swagger
 * /api/exam/exams/{examId}/attempt-status:
 *   get:
 *     summary: Check if user has attempted an exam
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
 *         schema:
 *           type: string
 *         required: true
 *         description: The exam ID
 *     responses:
 *       200:
 *         description: Attempt status retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hasAttempted:
 *                   type: boolean
 *                 attempt:
 *                   $ref: '#/components/schemas/Attempt'
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router.get('/exams/:examId/attempt-status', protect, examController.checkAttemptStatus);

/**
 * @swagger
 * tags:
 *   name: Attempts
 *   description: Exam attempt endpoints
 */

/**
 * @swagger
 * /api/exam/attempt/startExam:
 *   post:
 *     summary: Start a new exam attempt
 *     tags: [Attempts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - examId
 *             properties:
 *               examId:
 *                 type: string
 *                 description: ID of the exam to start
 *     responses:
 *       201:
 *         description: Exam attempt started successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Attempt'
 *       400:
 *         description: Invalid request or exam already attempted
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Exam not found
 *       500:
 *         description: Server error
 */
router.post('/attempt/startExam', protect, attemptController.startExam);

/**
 * @swagger
 * /api/exam/attempts/submit:
 *   post:
 *     summary: Submit an exam attempt
 *     tags: [Attempts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - attemptId
 *               - answers
 *             properties:
 *               attemptId:
 *                 type: string
 *                 description: ID of the attempt to submit
 *               answers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - questionId
 *                     - selectedOption
 *                   properties:
 *                     questionId:
 *                       type: string
 *                     selectedOption:
 *                       type: number
 *     responses:
 *       200:
 *         description: Exam submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Attempt'
 *       400:
 *         description: Invalid request or attempt already completed
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Attempt not found
 *       500:
 *         description: Server error
 */
router.post('/attempts/submit', protect, attemptController.submitExam);

/**
 * @swagger
 * /api/exam/attempts:
 *   get:
 *     summary: Get current user's exam attempts
 *     tags: [Attempts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's attempts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Attempt'
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router.get('/attempts', protect, attemptController.getAttempts);

/**
 * @swagger
 * /api/exam/attempts/{id}:
 *   get:
 *     summary: Get a specific attempt by ID
 *     tags: [Attempts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The attempt ID
 *     responses:
 *       200:
 *         description: Attempt retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Attempt'
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Attempt not found
 *       500:
 *         description: Server error
 */
router.get('/attempts/:id', protect, attemptController.getAttempt);

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin-only endpoints
 */

// Admin routes
router.use('/admin', protect, (req, res, next) =>
{
    if (req.user.role !== 'admin')
    {
        return res.status(403).json({ message: 'Not authorized to access this route' });
    }
    next();
});

/**
 * @swagger
 * /api/exam/admin/exams:
 *   post:
 *     summary: Create a new exam
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Exam'
 *     responses:
 *       201:
 *         description: Exam created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Exam'
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden - Not an admin
 *       500:
 *         description: Server error
 */
router.post('/admin/exams', protect, adminController.createExam);

/**
 * @swagger
 * /api/exam/admin/exams/{id}:
 *   put:
 *     summary: Update an existing exam
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The exam ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Exam'
 *     responses:
 *       200:
 *         description: Exam updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Exam'
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden - Not an admin
 *       404:
 *         description: Exam not found
 *       500:
 *         description: Server error
 *   delete:
 *     summary: Delete an exam
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The exam ID
 *     responses:
 *       200:
 *         description: Exam deleted successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden - Not an admin
 *       404:
 *         description: Exam not found
 *       500:
 *         description: Server error
 */
router.put('/admin/exams/:id', protect, adminController.updateExam);
router.delete('/admin/exams/:id', protect, adminController.deleteExam);

/**
 * @swagger
 * /api/exam/admin/attempts:
 *   get:
 *     summary: Get all users' exam attempts (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all attempts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Attempt'
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden - Not an admin
 *       500:
 *         description: Server error
 */
router.get('/admin/attempts', protect, adminController.getAllAttempts);

/**
 * @swagger
 * tags:
 *   name: Teacher
 *   description: Teacher-specific endpoints
 */

/**
 * @swagger
 * /api/exam/teacher/exams:
 *   get:
 *     summary: Get all exams created by the current teacher
 *     tags: [Teacher]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of teacher's exams retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Exam'
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden - Not a teacher
 *       500:
 *         description: Server error
 */
router.get('/teacher/exams', protect, authorize('teacher'), examController.getTeacherExams);

/**
 * @swagger
 * /api/exam/teacher/exams:
 *   post:
 *     summary: Create a new exam (teacher only)
 *     tags: [Teacher]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Exam'
 *     responses:
 *       201:
 *         description: Exam created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Exam'
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden - Not a teacher
 *       500:
 *         description: Server error
 */
router.post('/teacher/exams', protect, authorize('teacher'), adminController.createExam);

/**
 * @swagger
 * /api/exam/teacher/exams/{id}:
 *   put:
 *     summary: Update an existing exam (teacher only)
 *     tags: [Teacher]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The exam ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Exam'
 *     responses:
 *       200:
 *         description: Exam updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Exam'
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden - Not a teacher
 *       404:
 *         description: Exam not found
 *       500:
 *         description: Server error
 */
router.put('/teacher/exams/:id', protect, authorize('teacher'), adminController.updateExam);

/**
 * @swagger
 * /api/exam/teacher/exams/{id}:
 *   delete:
 *     summary: Delete an exam (teacher only)
 *     tags: [Teacher]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The exam ID
 *     responses:
 *       200:
 *         description: Exam deleted successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden - Not a teacher
 *       404:
 *         description: Exam not found
 *       500:
 *         description: Server error
 */
router.delete('/teacher/exams/:id', protect, authorize('teacher'), adminController.deleteExam);

/**
 * @swagger
 * /api/exam/exams/teacher/{teacherId}:
 *   get:
 *     summary: Get all exams created by a specific teacher
 *     tags: [Exams]
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         schema:
 *           type: string
 *         required: true
 *         description: The teacher ID
 *     responses:
 *       200:
 *         description: List of exams created by the specified teacher
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Exam'
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router.get('/exams/teacher/:teacherId', examController.getExamsByTeacher);

/**
 * @swagger
 * /api/exam/teacher/attempts:
 *   get:
 *     summary: Get all attempts for exams created by the current teacher
 *     tags: [Teacher]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of attempts for teacher's exams
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Attempt'
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden - Not a teacher
 *       500:
 *         description: Server error
 */
router.get('/teacher/attempts', protect, authorize('teacher'), attemptController.getAttemptsByTeacher);

/**
 * @swagger
 * /api/exam/teacher/exams/{examId}/attempts:
 *   get:
 *     summary: Get all attempts for a specific exam created by the current teacher
 *     tags: [Teacher]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
 *         schema:
 *           type: string
 *         required: true
 *         description: The exam ID
 *     responses:
 *       200:
 *         description: List of attempts for the specified exam
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Attempt'
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden - Not a teacher
 *       404:
 *         description: Exam not found or not owned by this teacher
 *       500:
 *         description: Server error
 */
router.get('/teacher/exams/:examId/attempts', protect, authorize('teacher'), attemptController.getAttemptsByExam);

/**
 * @swagger
 * /api/exam/teacher/attempts/{id}:
 *   delete:
 *     summary: Delete a student's attempt on one of the current teacher's exams
 *     tags: [Teacher]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The attempt ID
 *     responses:
 *       200:
 *         description: Attempt deleted
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
 *                   example: Attempt deleted
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden - Not a teacher
 *       404:
 *         description: Attempt not found or its exam is not owned by this teacher
 */
router.delete('/teacher/attempts/:id', protect, authorize('teacher'), attemptController.deleteTeacherAttempt);

export default router;