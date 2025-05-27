import Exam from "../../DB/models/exam.model.js";
import Attempt from "../../DB/models/attempt.model.js";
import User from "../../DB/models/user.model.js";
import Teacher from "../../DB/models/teacher.model.js";
import { asyncHandler, AppError } from '../../utils/errorHandling.js';
import logger from '../../utils/logger.js';
import cacheManager from '../../utils/cache.js';

//================getlengthofExams==================

export const getlengthOfExams = asyncHandler(async (req, res, next) =>
{
    // Try to get from cache first
    const cacheKey = 'exam_count';
    const cachedCount = await cacheManager.get(cacheKey);

    if (cachedCount !== null)
    {
        logger.debug('Exam count retrieved from cache');
        return res.status(200).json({
            success: true,
            data: cachedCount,
            message: 'Exam count retrieved successfully'
        });
    }

    // Get from database if not in cache
    const exams = await Exam.find()
        .select('title description duration passingScore createdAt')
        .sort({ createdAt: -1 });

    const length = exams.length;

    // Cache the result for 10 minutes
    await cacheManager.set(cacheKey, length, 600);

    // Log successful retrieval of exam count
    logger.info('Exam count retrieved successfully', { count: length });
    res.status(200).json({
        success: true,
        data: length,
        message: 'Exam count retrieved successfully'
    });
});



//=================getAllExams(for student view)===============================

export const getExams = asyncHandler(async (req, res, next) =>
{
    // This endpoint is no longer used in the user side
    // Returning  a message indicating that a teacher must be selected
    return next(new AppError('Please select a specific teacher to view their exams', 400));
});


//==================getSingleExam with ID ====================================

export const getExam = asyncHandler(async (req, res, next) =>
{
    const examId = req.params.id;

    // Try to get from cache first
    const cachedExam = await cacheManager.getExam(examId);

    if (cachedExam)
    {
        logger.debug('Exam retrieved from cache', { examId });
        // Log successful retrieval of single exam
        logger.info('Exam retrieved successfully from cache', { examId });
        return res.status(200).json({
            success: true,
            data: cachedExam,
            message: 'Exam retrieved successfully'
        });
    }

    // Get from database if not in cache
    const exam = await Exam.findById(examId)
        .select('title description duration passingScore createdAt questions');

    if (!exam)
    {
        return next(new AppError('Exam not found', 404));
    }

    // Cache the exam for 1 hour
    await cacheManager.setExam(examId, exam);

    // Log successful retrieval of single exam
    logger.info('Exam retrieved successfully from database', { examId });
    res.status(200).json({
        success: true,
        data: exam,
        message: 'Exam retrieved successfully'
    });
});
//===========================getExamQuestions======================================

export const getExamQuestions = asyncHandler(async (req, res, next) =>
{
    const examId = req.params.id;

    // Try to get from cache first
    const cachedQuestions = await cacheManager.getExamQuestions(examId);

    if (cachedQuestions)
    {
        logger.debug('Exam questions retrieved from cache', { examId });
        logger.info('Exam questions retrieved successfully from cache', { examId });
        return res.status(200).json({
            success: true,
            data: cachedQuestions,
            message: 'Exam questions retrieved successfully'
        });
    }

    // Get from database if not in cache
    const exam = await Exam.findById(examId);

    if (!exam)
    {
        return next(new AppError('Exam not found. Please try again later.', 404));
    }

    // Modify questions to hide correct answers
    const sanitizedQuestions = exam.questions.map(q => ({
        _id: q._id,
        text: q.text,
        options: q.options,
        points: q.points
    }));

    const questionData = {
        _id: exam._id,
        title: exam.title,
        description: exam.description,
        duration: exam.duration,
        questions: sanitizedQuestions
    };

    // Cache the sanitized questions for 30 minutes
    await cacheManager.setExamQuestions(examId, questionData);

    logger.info('Exam questions retrieved successfully from database', { examId });

    res.status(200).json({
        success: true,
        data: questionData,
        message: 'Exam questions retrieved successfully'
    });
});


//========================checkAttempt Status ========================

export const checkAttemptStatus = asyncHandler(async (req, res, next) =>
{
    const { examId } = req.params;
    const userId = req.user._id;

    // This data changes frequently, so we use a shorter cache time
    const cacheKey = `attempt_status:${userId}:${examId}`;
    const cachedStatus = await cacheManager.get(cacheKey);

    if (cachedStatus !== null)
    {
        logger.debug('Attempt status retrieved from cache', { userId, examId });
        return res.status(200).json({
            success: true,
            data: cachedStatus,
            message: 'Attempt status retrieved successfully'
        });
    }

    // Find completed attempts by this user for this exam
    const completedAttempt = await Attempt.findOne({
        examId,
        userId,
        isCompleted: true //completed means the user finished the exam
    });

    // Find an ongoing attempt where user still not finish
    const ongoingAttempt = await Attempt.findOne({
        examId,
        userId,
        isCompleted: false,
        endTime: { $exists: false } //something happened to the user and he didn't finish the exam
    });

    const statusData = {
        hasCompleted: !!completedAttempt,
        hasOngoing: !!ongoingAttempt,
        attemptId: ongoingAttempt ? ongoingAttempt._id : null
    };

    // Cache for 5 minutes (short time as this data changes frequently)
    await cacheManager.set(cacheKey, statusData, 300);

    logger.info('Attempt status retrieved successfully from database', { userId, examId });

    res.status(200).json({
        success: true,
        data: statusData,
        message: 'Attempt status retrieved successfully'
    });
});

//=======================getTeacherExams========================

export const getTeacherExams = asyncHandler(async (req, res, next) =>
{
    const teacherId = req.user._id;

    // Try to get from cache first
    const cachedExams = await cacheManager.getExamsByTeacher(teacherId);

    if (cachedExams)
    {
        logger.debug('Teacher exams retrieved from cache', { teacherId });
        logger.info('Teacher exams retrieved successfully from cache', { teacherId, count: cachedExams.length });
        return res.status(200).json({
            success: true,
            data: cachedExams,
            message: 'Teacher exams retrieved successfully'
        });
    }

    // Find exams created by this teacher (check both createdBy and teacherId fields)
    const exams = await Exam.find({
        $or: [
            { createdBy: teacherId },
            { teacherId: teacherId }
        ]
    })
        .select('title description duration passingScore createdAt questions')
        .sort({ createdAt: -1 });

    // Cache the exams for 30 minutes
    await cacheManager.setExamsByTeacher(teacherId, exams);

    console.log(`Found ${exams.length} exams for teacher ${teacherId}`);
    // Log successful retrieval of teacher's exams
    logger.info('Teacher exams retrieved successfully from database', { teacherId: teacherId, count: exams.length });
    res.status(200).json({
        success: true,
        data: exams,
        message: 'Teacher exams retrieved successfully'
    });
});

//=======================getExamsByTeacher========================

export const getExamsByTeacher = asyncHandler(async (req, res, next) =>
{
    const { teacherId } = req.params;

    // Try to get from cache first
    const cachedExams = await cacheManager.getExamsByTeacher(teacherId);

    if (cachedExams)
    {
        logger.debug('Exams by teacher retrieved from cache', { teacherId });
        logger.info('Exams by teacher retrieved successfully from cache', { teacherId: teacherId, count: cachedExams.length });
        return res.status(200).json({
            success: true,
            data: cachedExams,
            message: 'Exams by teacher retrieved successfully'
        });
    }

    // Find exams created by this teacher
    const exams = await Exam.find({
        $or: [
            { createdBy: teacherId },
            { teacherId: teacherId }
        ]
    })
        .select('title description duration passingScore createdAt questions')
        .sort({ createdAt: -1 });

    // Cache the exams for 30 minutes
    await cacheManager.setExamsByTeacher(teacherId, exams);

    logger.info('Exams by teacher retrieved successfully from database', { teacherId: teacherId, count: exams.length });

    res.status(200).json({
        success: true,
        data: exams,
        message: 'Exams by teacher retrieved successfully'
    });
});


