import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        minLength: [2, 'Name must be at least 2 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, 'Please enter a valid email address']
    },
    subject: {
        type: String,
        required: [true, 'Subject is required']
    },
    message: {
        type: String,
        required: [true, 'Message is required'],
        minLength: [5, 'Message must be at least 5 characters']
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['new', 'in-progress', 'resolved'],
        default: 'new'
    }
});

const Contact = mongoose.model('Contact', contactSchema);

export default Contact; 