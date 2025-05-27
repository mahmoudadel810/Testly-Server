import express from 'express';
import { protect, authorize } from "../../middelWares/auth.js";
import * as adminController from '../admin/adminController.js';


const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.route('/exams')
    .get(protect, adminController.getAllExams) //u may seperate them , gpt why they connected in2
    .post(protect, adminController.createExam); //only admin can get or create the exams 


router.route('/exams/:id')
    .get(protect, adminController.getExamById)
    .put(protect, adminController.updateExam)
    .delete(protect, adminController.deleteExam);

router.get('/attempts', protect, adminController.getAllAttempts);
router.get('/attempts/:id', adminController.getAttemptById);

// Teacher approval routes
router.get('/teachers/pending', adminController.getPendingTeachers);
router.get('/teachers/pending/count', adminController.getPendingTeachersCount);
router.put('/teachers/:id/approve', adminController.approveTeacher);
router.delete('/teachers/:id/reject', adminController.rejectTeacher);

export default router;
