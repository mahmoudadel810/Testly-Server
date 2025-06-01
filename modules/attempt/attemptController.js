import Exam from '../../DB/models/exam.model.js';
import Attempt from '../../DB/models/attempt.model.js';
import { asyncHandler, AppError } from '../../utils/errorHandling.js';
import logger from '../../utils/logger.js';




//========================= Start a new exam attempt===================================
export const startExam = asyncHandler(async (req, res, next) =>
{
    const { examId } = req.body;
    const userId = req.user._id; // the user who signed in 

    // Check if exam exists
    const exam = await Exam.findById(examId);
    if (!exam)
    {
        return next(new AppError('Exam not found', 404));
    }

    // Check if user has an ongoing attempt , user in the Exam .
    const ongoingAttempt = await Attempt.findOne({
        examId,
        userId,
        isCompleted: false
    });

    if (ongoingAttempt)
    {
        return res.status(200).json({
            success: true,
            data: ongoingAttempt,
            message: 'Ongoing exam attempt found'
        });
    }

    // Check if user has already completed this exam
    const completedAttempt = await Attempt.findOne({
        examId,
        userId,
        isCompleted: true
    });

    if (completedAttempt)
    {
        return next(new AppError('You have already completed this exam', 400));
    }

    // Create a new attempt after finishing the exam , and get him results
    const totalPoints = exam.calculateTotalPoints(); // function in the model ()
    const attempt = await Attempt.create({
        examId,
        userId,
        userRole: req.user.role, // Set the user's role
        teacherId: exam.createdBy, // Set the teacher ID from the exam
        totalPoints,
        startTime: new Date()
    });

    // Log successful start of exam attempt
    logger.info('Exam attempt started successfully', { userId: userId, examId: examId, attemptId: attempt._id });
    res.status(201).json({
        success: true,
        data: attempt,
        message: 'Exam attempt started successfully'
    });
});








// ===================Submit exam answers======================================================
export const submitExam = asyncHandler(async (req, res, next) =>
{
    const { attemptId, answers } = req.body;
    const userId = req.user._id;

    // Find the attempt first 
    const attempt = await Attempt.findOne({
        _id: attemptId,
        userId,
        isCompleted: false
    });

    if (!attempt)
    {
        return next(new AppError('Exam attempt not found or already completed', 404));
    }

    // Find the exam
    const exam = await Exam.findById(attempt.examId);
    if (!exam)
    {
        return next(new AppError('Associated exam not found', 404));
    }

    // Process answers and calculate exam score 
    let score = 0; // initial 
    const processedAnswers = [];

    // Process each answer
    for (const answer of answers)
    {
        const question = exam.questions.id(answer.questionId);

        // Skip if question answer not found
        if (!question)
        {
            console.log(`Question answer with ID ${answer.questionId} not found in exam , NO Answer Provided `);
            continue;
        }
        const isCorrect = question.correctAnswer === answer.selectedOption;

        if (isCorrect)
        {
            score += question.points;
        }

        processedAnswers.push({ //push to answers array 
            questionId: answer.questionId,
            selectedOption: answer.selectedOption,
            isCorrect,
            points: isCorrect ? question.points : 0
        });
    }

    // Calculate if passed in the test 
    const percentageScore = (score / attempt.totalPoints) * 100;
    const passed = percentageScore >= exam.passingScore;

    // Update the attempt
    attempt.answers = processedAnswers;
    attempt.score = score;
    attempt.passed = passed;
    attempt.endTime = new Date();
    attempt.isCompleted = true;

    await attempt.save();

    // Log successful submission of exam
    logger.info('Exam submitted successfully', { userId: userId, examId: attempt.examId, attemptId: attempt._id });
    res.status(200).json({
        success: true,
        data: attempt,
        message: 'Exam submitted successfully'
    });
});



//user attempts to check time they took the test 

//=======================Get user's attempt history=================================

export const getAttempts = asyncHandler(async (req, res, next) =>
{
    const userId = req.user._id;

    const attempts = await Attempt.find({ userId, isCompleted: true })
        .populate('userId', 'username name email')
        .populate('examId', 'title description')
        .sort({ createdAt: -1 });

    logger.info('User attempt history retrieved successfully', { userId: userId });
    res.status(200).json({
        success: true,
        data: attempts,
        message: 'User attempt history retrieved successfully'
    });
});



//wich exam ?

//======================= Get details of a specific attempt=============================
export const getAttempt = asyncHandler(async (req, res, next) =>
{
    const attemptId = req.params.id;
    const userId = req.user._id;

    const attempt = await Attempt.findOne({
        _id: attemptId,
        userId
    })
        .populate('userId', 'username name email')
        .populate('examId');

    if (!attempt)
    {
        return next(new AppError('Exam attempt not found', 404));
    }

    logger.info('Attempt details retrieved successfully', { userId: userId, attemptId: attempt._id });
    res.status(200).json({
        success: true,
        data: attempt,
        message: 'Attempt details retrieved successfully'
    });
});

//======================= Get attempts by teacher ID =============================
export const getAttemptsByTeacher = asyncHandler(async (req, res, next) =>
{
    const teacherId = req.user._id;

    const attempts = await Attempt.find({
        teacherId,
        isCompleted: true
    })
        .populate('userId', 'username name email')
        .populate('examId', 'title description')
        .sort({ createdAt: -1 });

    logger.info('Teacher attempts retrieved successfully', { teacherId: teacherId });
    res.status(200).json({
        success: true,
        data: attempts,
        message: 'Teacher attempts retrieved successfully'
    });
});

//======================= Get attempts by exam ID =============================
export const getAttemptsByExam = asyncHandler(async (req, res, next) =>
{
    const { examId } = req.params;
    const teacherId = req.user._id;

    // Verify the exam belongs to this teacher
    const exam = await Exam.findOne({
        _id: examId,
        createdBy: teacherId
    });

    if (!exam)
    {
        return next(new AppError('Exam not found or you do not have permission to view its attempts', 404));
    }

    const attempts = await Attempt.find({
        examId,
        isCompleted: true
    })
        .populate('userId', 'username name email')
        .sort({ createdAt: -1 });

    logger.info('Exam attempts retrieved successfully', { teacherId: teacherId, examId: examId });
    res.status(200).json({
        success: true,
        data: attempts,
        message: 'Exam attempts retrieved successfully'
    });
});
