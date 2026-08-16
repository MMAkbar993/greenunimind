import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  generateInvoice,
  getInvoiceByTransaction,
  getInvoicePdf,
  getStudentInvoices,
  getTeacherInvoices,
  resendInvoiceEmail,
  getTeacherInvoiceStats,
  bulkGenerateInvoices,
  getInvoicePreferences,
  updateInvoicePreferences,
} from '../controllers/invoiceController.js';

const router = express.Router();

router.post('/generate/:transactionId', protect, generateInvoice);
router.get('/transaction/:transactionId', protect, getInvoiceByTransaction);
router.get('/preferences/:teacherId', protect, getInvoicePreferences);
router.put('/preferences/:teacherId', protect, updateInvoicePreferences);
router.get('/:transactionId/pdf', protect, getInvoicePdf);
router.get('/student/:studentId', protect, getStudentInvoices);
router.get('/teacher/:teacherId', protect, getTeacherInvoices);
router.post('/resend/:transactionId', protect, resendInvoiceEmail);
router.get('/stats/teacher/:teacherId', protect, getTeacherInvoiceStats);
router.post('/bulk-generate', protect, bulkGenerateInvoices);

export default router;
