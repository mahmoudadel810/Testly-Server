import mongoose from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     Question:
 *       type: object
 *       required:
 *         - text
 *         - options
 *         - correctAnswer
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the question
 *         text:
 *           type: string
 *           description: The text of the question
 *         options:
 *           type: array
 *           description: List of possible answers
 *           items:
 *             type: string
 *         correctAnswer:
 *           type: number
 *           description: Index of the correct answer in the options array
 *           minimum: 0
 *         points:
 *           type: number
 *           description: Points awarded for the correct answer
 *           default: 1
 *           minimum: 1
 *
 *     Exam:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - questions
 *         - createdBy
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the exam
 *         title:
 *           type: string
 *           description: The title of the exam
 *         description:
 *           type: string
 *           description: Description of the exam content
 *         duration:
 *           type: number
 *           description: Duration of the exam in minutes
 *           default: 60
 *           minimum: 5
 *         passingScore:
 *           type: number
 *           description: Passing score percentage
 *           default: 60
 *           minimum: 0
 *         questions:
 *           type: array
 *           description: List of questions in the exam
 *           items:
 *             $ref: '#/components/schemas/Question'
 *         createdBy:
 *           type: string
 *           description: User ID of the exam creator
 *         teacherId:
 *           type: string
 *           description: Teacher ID of the exam creator
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the exam was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the exam was last updated
 *       example:
 *         title: "Introduction to JavaScript"
 *         description: "Test your knowledge of JavaScript basics"
 *         duration: 60
 *         passingScore: 70
 *         questions: [
 *           {
 *             text: "What is JavaScript?",
 *             options: ["A programming language", "A markup language", "A database", "A hardware component"],
 *             correctAnswer: 0,
 *             points: 2
 *           }
 *         ]
 *         createdBy: "60d0fe4f5311236168a109ca"
 */
const questionSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
        trim: true
    },
    options: {
        type: [String],
        required: true,
        validate: {
            validator: function (options)
            {
                return options.length >= 2;
            },
            message: 'A question must have at least 2 options'
        }
    },
    correctAnswer: {
        type: Number,
        required: true,
        min: 0,
        validate: {
            validator: function (value)
            {
                return value < this.options.length;
            },
            message: 'Correct answer index must be less than the number of options'
        }
    },
    points: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    }
});




const examSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    duration: {
        type: Number,
        required: true,
        min: 5,
        default: 60 // Default to 60 minutes
    },
    passingScore: {
        type: Number,
        required: true,
        min: 0,
        default: 60 // Default to 60%
    },
    questions: {
        type: [questionSchema],
        required: true,
        validate: {
            validator: function (questions)
            {
                return questions.length > 0;
            },
            message: 'An exam must have at least 1 question'
        }
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher'
    }
},
    {
        timestamps: true
    });

// Method to calculate total points in an exam
examSchema.methods.calculateTotalPoints = function ()
{
    return this.questions.reduce((total, question) => total + question.points, 0);
};

const Exam = mongoose.model('Exam', examSchema);

export default Exam;
