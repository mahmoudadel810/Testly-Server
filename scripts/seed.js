// Seed demo data: an admin, approved teachers, confirmed students, exams and completed attempts.
//
//   npm run seed            -> refuses to run if the database already has exams
//   npm run seed -- --reset -> wipes users, teachers, exams, attempts and contacts first
//
// Passwords come from SEED_ADMIN_PASSWORD / SEED_DEMO_PASSWORD, or are generated and printed once.
import { config } from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import mongoose from 'mongoose';
import User from '../DB/models/user.model.js';
import Teacher from '../DB/models/teacher.model.js';
import Exam from '../DB/models/exam.model.js';
import Attempt from '../DB/models/attempt.model.js';
import Contact from '../DB/models/contact.model.js';
import { hashFunction } from '../utils/generateHash.js';
import { admin, teachers, students, EMAIL_DOMAIN } from './seed-data/people.js';
import { exams } from './seed-data/exams.js';

config({ path: path.resolve('config/.env') });

const DAY = 24 * 60 * 60 * 1000;
const reset = process.argv.includes('--reset');

// Deterministic generator so every run produces the same attempt history.
const createRandom = (seed) => () =>
{
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const random = createRandom(20261006);
const shuffle = (items) => items.map((item) => [random(), item]).sort((a, b) => a[0] - b[0]).map(([, item]) => item);

const generatePassword = () => `Ts-${crypto.randomBytes(6).toString('base64url')}9!`;

const run = async () =>
{
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set (config/.env)');
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });

    if (reset)
    {
        await Promise.all([User, Teacher, Exam, Attempt, Contact].map((model) => model.deleteMany({})));
        console.log('Reset: cleared users, teachers, exams, attempts, contacts');
    } else if (await Exam.estimatedDocumentCount() > 0)
    {
        throw new Error('Database already has exams; re-run with --reset to replace them');
    }

    const adminPassword = process.env.SEED_ADMIN_PASSWORD || generatePassword();
    const demoPassword = process.env.SEED_DEMO_PASSWORD || generatePassword();
    const adminHash = hashFunction({ payload: adminPassword });
    const demoHash = hashFunction({ payload: demoPassword });

    await User.create({ ...admin, password: adminHash, role: 'admin', isConfirmed: true, status: 'Active' });

    const teacherDocs = {};
    for (const { key, ...teacher } of teachers)
    {
        teacherDocs[key] = await Teacher.create({
            ...teacher,
            email: `${key}@${EMAIL_DOMAIN}`,
            password: demoHash,
            isConfirmed: true,
            confirmedAsTeacher: true,
            status: 'Active',
            role: 'teacher'
        });
    }

    const studentDocs = await User.insertMany(students.map((handle) => ({
        username: handle,
        email: `${handle}@${EMAIL_DOMAIN}`,
        password: demoHash,
        role: 'student',
        isConfirmed: true,
        status: 'Active'
    })));

    const examDocs = [];
    for (const { teacher, ...exam } of exams)
    {
        const owner = teacherDocs[teacher]._id;
        examDocs.push(await Exam.create({ ...exam, createdBy: owner, teacherId: owner }));
    }

    // Each student completes 3–5 exams over the last 30 days; ability varies per student.
    const attempts = [];
    for (const student of studentDocs)
    {
        const ability = 0.45 + random() * 0.45;
        const taken = shuffle(examDocs).slice(0, 3 + Math.floor(random() * 3));
        for (const exam of taken)
        {
            const startTime = new Date(Date.now() - (1 + random() * 29) * DAY);
            const totalPoints = exam.questions.reduce((sum, q) => sum + q.points, 0);
            const answers = exam.questions.map((q) =>
            {
                const isCorrect = random() < ability;
                const wrong = q.options.map((_, i) => i).filter((i) => i !== q.correctAnswer);
                const selectedOption = isCorrect ? q.correctAnswer : wrong[Math.floor(random() * wrong.length)];
                return { questionId: q._id, selectedOption, isCorrect, points: isCorrect ? q.points : 0 };
            });
            const score = answers.reduce((sum, a) => sum + a.points, 0);
            attempts.push({
                userRole: 'student',
                userModel: 'User',
                userId: student._id,
                examId: exam._id,
                teacherId: exam.createdBy,
                startTime,
                endTime: new Date(startTime.getTime() + (0.4 + random() * 0.5) * exam.duration * 60 * 1000),
                answers,
                score,
                totalPoints,
                isCompleted: true,
                passed: (score / totalPoints) * 100 >= exam.passingScore
            });
        }
    }
    await Attempt.insertMany(attempts);

    console.log(`Seeded: 1 admin, ${teachers.length} teachers, ${studentDocs.length} students, ${examDocs.length} exams, ${attempts.length} attempts`);
    console.log(`Admin:    ${admin.email}`);
    console.log(`Teachers: ${teachers.map((t) => `${t.key}@${EMAIL_DOMAIN}`).join(', ')}`);
    console.log(`Students: ${students.map((s) => `${s}@${EMAIL_DOMAIN}`).join(', ')}`);
    if (!process.env.SEED_ADMIN_PASSWORD) console.log(`Admin password (generated): ${adminPassword}`);
    if (!process.env.SEED_DEMO_PASSWORD) console.log(`Teacher/student password (generated): ${demoPassword}`);
};

run()
    .catch((error) =>
    {
        console.error('Seed failed:', error.message);
        process.exitCode = 1;
    })
    .finally(() => mongoose.disconnect());
