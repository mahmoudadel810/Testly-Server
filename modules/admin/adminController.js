import Exam from "../../DB/models/exam.model.js";
import Attempt from '../../DB/models/attempt.model.js';
import User from '../../DB/models/user.model.js';
import Teacher from "../../DB/models/teacher.model.js";
import { sendEmail } from "../../services/sendEmail.js";
import { asyncHandler, AppError } from '../../utils/errorHandling.js';
import logger from '../../utils/logger.js';
import cacheManager from '../../utils/cache.js';


//TODO -  =============================Get All exams for admin===================
// name changed to username in DB 
export const getAllExams = asyncHandler(async (req, res, next) =>
{


    // Get exams with populated user references directly from database
    let exams = await Exam.find()
        .populate('createdBy', 'username email role')
        .populate('teacherId', 'name email')
        .sort({ createdAt: -1 });

    // For exams with null createdBy, check if the ID exists in the Teacher collection
    const processedExams = await Promise.all(exams.map(async (exam) =>
    {
        const examObj = exam.toObject();

        // If createdBy is null but we have an ID, try to find in Teacher collection
        if (!examObj.createdBy && exam.createdBy)
        {
            try
            {
                const teacher = await Teacher.findById(exam.createdBy);
                if (teacher)
                {
                    examObj.createdBy = {
                        _id: teacher._id.toString(),
                        username: teacher.name, // Use teacher name as username
                        email: teacher.email,
                        role: 'teacher'
                    };
                }
            } catch (error)
            {
                console.error(`Error finding teacher for exam ${exam._id}:`, error);
            }
        }

        return examObj;
    }));

    // Log successful retrieval of all exams
    logger.info('All exams retrieved directly from database by admin', { adminId: req.user ? req.user._id : 'unknown', count: exams.length });

    res.status(200).json({
        success: true,
        data: processedExams,
        message: 'All exams retrieved successfully'
    });
});



//TODO - =======================Create New Exam =================================

export const createExam = asyncHandler(async (req, res, next) =>
{
    // Set createdBy to the current user's ID
    req.body.createdBy = req.user._id;

    // If the user is a teacher, also set the teacherId
    if (req.user.role === 'teacher')
    {
        req.body.teacherId = req.user._id;
    }

    const exam = await Exam.create(req.body);

    // Get the populated exam data
    const populatedExam = await Exam.findById(exam._id)
        .populate('createdBy', 'username email role')
        .populate('teacherId', 'name email');

    // Invalidate ALL exam-related caches to ensure fresh data
    await Promise.all([
        cacheManager.del('admin:all_exams'),
        cacheManager.del('exam_count'),
        cacheManager.invalidateTeacherLists(),
        cacheManager.invalidateExam(exam._id),
        cacheManager.invalidateTeacherData(req.user._id)
    ]);

    // Log successful creation of exam
    logger.info('Exam created successfully by admin/teacher', { userId: req.user._id, examId: exam._id });

    res.status(201).json({
        success: true,
        message: "Exam created successfully",
        data: populatedExam
    });
});


//===============================get Exam By ID=================================

export const getExamById = asyncHandler(async (req, res, next) =>
{
    const examId = req.params.id;



    // Get directly from database to ensure real-time data
    //ممكن اغيرها بعدين وانا بضيف الكاش
    const exam = await Exam.findById(examId)
        .populate('createdBy', 'username email role')
        .populate('teacherId', 'name email');

    if (!exam)
    {
        return next(new AppError('Exam not found with this ID', 404));
    }

    // Convert to plain object for modification
    const examObj = exam.toObject();

    // If createdBy is null but we have an ID, try to find in Teacher collection
    if (!examObj.createdBy && exam.createdBy)
    {
        try
        {
            const teacher = await Teacher.findById(exam.createdBy);
            if (teacher)
            {
                examObj.createdBy = {
                    _id: teacher._id.toString(),
                    username: teacher.name, // Use teacher name as username
                    email: teacher.email,
                    role: 'teacher'
                };
            }
        } catch (error)
        {
            console.error(`Error finding teacher for exam ${exam._id}:`, error);
        }
    }

    // Log successful retrieval of a single exam by admin
    logger.info('Exam retrieved directly from database by admin', { adminId: req.user._id, examId: exam._id });

    res.status(200).json({
        success: true,
        data: examObj,
        message: 'Exam retrieved successfully'
    });
});



//===================UpdateExam============================

export const updateExam = asyncHandler(async (req, res, next) =>
{
    const examId = req.params.id;
    const exam = await Exam.findById(examId);

    if (!exam)
    {
        return next(new AppError('Exam not found', 404));
    }

    const updatedExam = await Exam.findByIdAndUpdate(
        examId,
        req.body, // update with coming in body , FE takes it 
        { new: true, runValidators: true }
    );

    // Invalidate exam-related caches
    await Promise.all([
        cacheManager.invalidateExam(examId),
        cacheManager.del('admin:all_exams'),
        cacheManager.del('exam_count'),
        cacheManager.invalidateTeacherLists()
    ]);

    // Log successful update of exam by admin
    logger.info('Exam updated successfully by admin/teacher', { userId: req.user._id, examId: updatedExam._id });

    res.status(200).json({
        success: true,
        data: updatedExam,
        message: 'Exam updated successfully'
    });
});

//=======================DeleteExam=========================================

export const deleteExam = asyncHandler(async (req, res, next) =>
{
    const examId = req.params.id;
    const exam = await Exam.findById(examId);

    if (!exam)
    {
        return next(new AppError('Exam not found', 404));
    }

    // Delete all attempts associated with this exam
    await Attempt.deleteMany({ examId: exam._id });

    // Then delete the exam itself
    await exam.deleteOne();

    // Invalidate all related caches
    await Promise.all([
        cacheManager.invalidateExam(examId),
        cacheManager.del('admin:all_exams'),
        cacheManager.del('exam_count'),
        cacheManager.invalidateTeacherLists(),
        cacheManager.invalidateTeacherData(exam.createdBy || exam.teacherId)
    ]);

    // Log successful deletion of exam by admin
    logger.info('Exam deleted successfully by admin/teacher', { userId: req.user._id, examId: exam._id });

    res.status(200).json({
        success: true,
        message: 'Exam and all associated attempts deleted successfully'
    });
});

//===========================get all attempts to the exam
export const getAllAttempts = asyncHandler(async (req, res, next) =>
{
    // NOTE: This endpoint intentionally bypasses cache to ensure real-time data
    // for the admin dashboard. DO NOT add caching here without addressing
    // the real-time data requirements.

    // Get directly from database to ensure real-time data
    const attempts = await Attempt.find()
        .populate('userId', 'username name email') // Include name for teachers
        .populate('examId', 'title')
        .sort({ createdAt: -1 });

    // Log successful retrieval of all attempts by admin
    logger.info('All attempts retrieved directly from database by admin', { adminId: req.user ? req.user._id : 'unknown', count: attempts.length });

    res.status(200).json({
        success: true,
        data: attempts,
        message: 'All attempts retrieved successfully'
    });
});


//=====================get attempt by ID Only== for admin view=====================

export const getAttemptById = asyncHandler(async (req, res, next) =>
{
    const attemptId = req.params.id;

    // NOTE: This endpoint intentionally bypasses cache to ensure real-time data
    // for the admin dashboard. DO NOT add caching here without addressing
    // the real-time data requirements.

    // Get directly from database to ensure real-time data
    const attempt = await Attempt.findById(attemptId)
        .populate('userId', 'username name email') // Include name for teachers
        .populate('examId');

    if (!attempt)
    {
        return next(new AppError('Attempt not found', 404));
    }

    // Log successful retrieval of a single attempt by admin
    logger.info('Attempt retrieved directly from database by admin', { adminId: req.user._id, attemptId: attempt._id });

    res.status(200).json({
        success: true,
        data: attempt,
        message: 'Attempt retrieved successfully'
    });
});

// Get all pending teachers
export const getPendingTeachers = asyncHandler(async (req, res, next) =>
{
    // NOTE: This endpoint intentionally bypasses cache to ensure real-time data
    // for the admin dashboard. DO NOT add caching here without addressing
    // the real-time data requirements.

    // Get directly from database to ensure real-time data
    const pendingTeachers = await Teacher.find({ confirmedAsTeacher: false })
        .sort({ createdAt: -1 });

    logger.info('Pending teachers retrieved directly from database by admin', { adminId: req.user ? req.user._id : 'unknown', count: pendingTeachers.length });

    res.status(200).json({
        success: true,
        data: pendingTeachers,
        message: 'Pending teachers retrieved successfully'
    });
});

// Get count of pending teachers
export const getPendingTeachersCount = asyncHandler(async (req, res, next) =>
{
    // NOTE: This endpoint intentionally bypasses cache to ensure real-time data
    // for the admin dashboard. DO NOT add caching here without addressing
    // the real-time data requirements.

    // Get directly from database to ensure real-time data
    const count = await Teacher.countDocuments({ confirmedAsTeacher: false });

    // Log successful retrieval of pending teachers count
    logger.info('Pending teachers count retrieved directly from database by admin', { adminId: req.user ? req.user._id : 'unknown', count: count });

    res.status(200).json({
        success: true,
        data: { count },
        message: 'Pending teachers count retrieved successfully'
    });
});

// Approve teacher
export const approveTeacher = asyncHandler(async (req, res, next) =>
{
    const { id } = req.params;

    // Find the teacher by ID
    const teacher = await Teacher.findById(id);

    if (!teacher)
    {
        return next(new AppError('Teacher not found', 404));
    }

    // Update teacher status
    teacher.confirmedAsTeacher = true;
    teacher.status = 'Active';
    await teacher.save();

    // Invalidate teacher-related caches
    await Promise.all([
        cacheManager.del('admin:pending_teachers'),
        cacheManager.del('admin:pending_teachers_count'),
        cacheManager.invalidateTeacherLists()
    ]);

    // Send approval email
    const approvalEmail = await sendEmail({
        to: teacher.email,
        subject: 'Teacher Account Approved',
        message: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #4CAF50; text-align: center;">Your Teacher Account Has Been Approved!</h2>
            <p>Dear ${teacher.name},</p>
            <p>We are pleased to inform you that your application to become a teacher on our platform has been approved.</p>
            <p>You can now log in to your account and start creating exams for your students.</p>
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
            <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.FRONTEND_URL || 'https://testly-sand.vercel.app'}/login" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login to Your Account</a>
            </div>
            <p style="margin-top: 30px; text-align: center; color: #666;">Thank you for joining our teaching community!</p>
        </div>`
    });

    logger.info(`Teacher ${id} approved successfully by admin ${req.user._id}`);

    res.status(200).json({
        success: true,
        message: 'Teacher approved successfully'
    });
});

// Reject teacher
export const rejectTeacher = asyncHandler(async (req, res, next) =>
{
    const { id } = req.params;

    const teacher = await Teacher.findById(id);

    if (!teacher)
    {
        return next(new AppError('Teacher not found', 404));
    }

    // Send rejection email
    const rejectionEmailSent = await sendEmail({
        to: teacher.email,
        subject: 'Teacher Application Status',
        message: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #4a6bff; text-align: center;">Teacher Application Status</h2>
            <p style="font-size: 16px; line-height: 1.5; color: #333;">Dear ${teacher.name},</p>
            <p style="font-size: 16px; line-height: 1.5; color: #333;">We regret to inform you that your teacher application did not meet our current requirements.</p>
            <p style="font-size: 16px; line-height: 1.5; color: #333;">If you believe this was in error, please contact our support team.</p>
            <p style="font-size: 14px; color: #666; margin-top: 30px;">Thank you for your interest in Testly.</p>
          </div>`
    });

    // Delete the teacher from database after sending email
    await Teacher.findByIdAndDelete(id);

    // Invalidate teacher-related caches
    await Promise.all([
        cacheManager.del('admin:pending_teachers'),
        cacheManager.del('admin:pending_teachers_count'),
        cacheManager.invalidateTeacherLists()
    ]);

    // Log successful teacher rejection
    logger.info('Teacher application rejected successfully by admin', { adminId: req.user._id, teacherId: teacher._id });

    if (!rejectionEmailSent)
    {
        return res.status(200).json({
            success: true,
            message: 'Teacher application rejected successfully, but notification email failed to send'
        });
    }

    res.status(200).json({
        success: true,
        message: 'Teacher application rejected successfully and notification email sent'
    });
});

