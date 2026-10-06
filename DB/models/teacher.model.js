import { timeStamp } from "console";
import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    nationalId: {
        type: String,
        required: true,
        unique: true,
        minlength: 14,
        maxlength: 14,
    },
    isConfirmed: {
        type: Boolean,
        default: false,
    },
    isLoggedIn: {
        type: Boolean,
        default: false,
    },
    confirmedAsTeacher: {
        type: Boolean,
        default: false,
    },
    status: {
        type: String,
        enum: ["Active", "In-Active"],
        default: "Active",
    },
    role: {
        type: String,
        enum: ["teacher", "admin"],
        default: "teacher",
    },
    code: {
        type: String, // password reset code
    }
},
    {
        timestamps: true
    });

const Teacher = mongoose.model("Teacher", teacherSchema);

export default Teacher;