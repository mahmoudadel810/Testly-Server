import mongoose from 'mongoose';


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
 *           format: email
 *         password:
 *           type: string
 *           description: The password of the user (stored as hash)
 *         role:
 *           type: string
 *           description: The role of the user
 *           enum: [student, admin]
 *           default: student
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
 *           enum: [Active, In-Active]
 *           default: Active
 *         code:
 *           type: string
 *           description: The reset code for password reset (if any)
 *        
 */
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Please add a name'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
    },
    role: {
        type: String,
        enum: ['student', 'admin'],
        default: 'student'
    },
    isConfirmed: {
        type: Boolean,
        default: false

    },
    isLoggedIn: {
        type: Boolean,
        default: false

    },
    status: {
        type: String,
        enum: ['Active', 'In-Active'],
        default: 'Active'
    },
    code: {
        type: String,
        // default: null  if it's null , maybe the user type null 
    }

},
    {
        timestamps: true
    });
//pre saving the password  here or in thr api 
// Encrypt password using bcrypt
// userSchema.pre('save', async function (next)
// {
//     if (!this.isModified('password'))
//     {
//         next();
//     }
//     const salt = await bcrypt.genSalt(10);
//     this.password = await bcrypt.hash(this.password, salt);
// });

// Sign JWT and return
// userSchema.methods.getSignedJwtToken = function ()
// {
//     return jwt.sign(
//         { id: this._id },
//         process.env.JWT_SECRET || 'your-default-secret',
//         { expiresIn: process.env.JWT_EXPIRE || '30d' }
//     );
// };

// // Match user entered password to hashed password in database
// userSchema.methods.matchPassword = async function (enteredPassword)
// {
//     return await bcrypt.compare(enteredPassword, this.password);
// };

const User = mongoose.model('User', userSchema);
export default User;
