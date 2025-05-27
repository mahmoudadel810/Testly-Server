import mongoose from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     Answer:
 *       type: object
 *       required:
 *         - questionId
 *         - selectedOption
 *         - isCorrect
 *         - points
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the answer
 *         questionId:
 *           type: string
 *           description: ID of the question being answered
 *         selectedOption:
 *           type: number
 *           description: Index of the selected option
 *         isCorrect:
 *           type: boolean
 *           description: Whether the answer is correct
 *         points:
 *           type: number
 *           description: Points earned for this answer
 *
 *     Attempt:
 *       type: object
 *       required:
 *         - userId
 *         - examId
 *         - totalPoints
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the attempt
 *         userId:
 *           type: string
 *           description: ID of the user making the attempt
 *         examId:
 *           type: string
 *           description: ID of the exam being attempted
 *         startTime:
 *           type: string
 *           format: date-time
 *           description: Time when the attempt started
 *         endTime:
 *           type: string
 *           format: date-time
 *           description: Time when the attempt ended (if completed)
 *         answers:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Answer'
 *           description: List of answers for each question
 *         score:
 *           type: number
 *           description: Total score achieved
 *           default: 0
 *         isCompleted:
 *           type: boolean
 *           description: Whether the attempt is completed
 *           default: false
 *         totalPoints:
 *           type: number
 *           description: Total possible points for the exam
 *         passed:
 *           type: boolean
 *           description: Whether the user passed the exam
 *           default: false
 *         percentageScore:
 *           type: number
 *           description: Score as a percentage of total points
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the attempt was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the attempt was last updated
 *       example:
 *         userId: "60d0fe4f5311236168a109ca"
 *         examId: "60d0fe4f5311236168a109cb"
 *         startTime: "2023-01-01T12:00:00Z"
 *         endTime: "2023-01-01T13:00:00Z"
 *         answers: [
 *           {
 *             questionId: "60d0fe4f5311236168a109cc",
 *             selectedOption: 1,
 *             isCorrect: true,
 *             points: 2
 *           }
 *         ]
 *         score: 8
 *         isCompleted: true
 *         totalPoints: 10
 *         passed: true
 */
const answerSchema = new mongoose.Schema({
    questionId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    selectedOption: {
        type: Number,
        required: true
    },
    isCorrect: {
        type: Boolean,
        required: true
    },
    points: {
        type: Number,
        required: true
    }
});

const attemptSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    examId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam',
        required: true
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: false
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: {
        type: Date
    },
    answers: [answerSchema],
    score: {
        type: Number,
        default: 0
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    totalPoints: {
        type: Number,
        required: true
    },
    passed: {
        type: Boolean,
        default: false
    },
    percentageScore: {
        type: Number,
        get()
        {
            return this.totalPoints ? (this.score / this.totalPoints) * 100 : 0;
        }
    }
},
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    });

const Attempt = mongoose.model('Attempt', attemptSchema);
export default Attempt;
