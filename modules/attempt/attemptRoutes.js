import express from 'express';
import { protect } from '../../middelWares/auth.js';
import * as attemptController from '../../modules/attempt/attemptController.js';

const router = express.Router();

// Protected routes for students
router.post('/startExam', protect, attemptController.startExam);

router.post('/submitExam', protect, attemptController.submitExam);

router.get('/getAllAttempts', protect, attemptController.getAttempts);

router.get('/getAttempt/:id', protect, attemptController.getAttempt);

export default router;
