import express from 'express';
import { createStudent, createTeacher, getMe, editProfile } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
import { parseSignupForm } from '../middleware/upload.js';

const router = express.Router();

router.post('/create-student', parseSignupForm, createStudent);
router.post('/create-teacher', parseSignupForm, createTeacher);
router.get('/me', protect, getMe);
router.patch('/edit-profile/:id', protect, editProfile);

export default router;
