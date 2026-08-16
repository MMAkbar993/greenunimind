import Invoice from '../models/Invoice.js';
import Transaction from '../models/Transaction.js';
import Teacher from '../models/Teacher.js';
import { generateInvoicePDF } from '../utils/invoicePdfGenerator.js';
import { sendInvoiceEmail } from '../utils/email.js';

const TRANSACTION_TO_INVOICE_STATUS = {
  completed: 'paid',
  pending: 'pending',
  failed: 'failed',
  refunded: 'refunded',
};

// Creates the Invoice record for a transaction if one doesn't exist yet.
// Invoices are generated lazily the first time anyone looks at a transaction,
// so every completed purchase ends up with one without needing a separate
// batch job.
export const ensureInvoiceForTransaction = async (transactionId) => {
  let invoice = await Invoice.findOne({ transaction: transactionId });
  if (invoice) return invoice;

  const transaction = await Transaction.findById(transactionId);
  if (!transaction) return null;

  invoice = await Invoice.create({
    transaction: transaction._id,
    invoiceNumber: `INV-${transaction._id.toString().slice(-8).toUpperCase()}`,
    student: transaction.student,
    teacher: transaction.teacher,
    course: transaction.course,
    amount: transaction.amount,
    currency: transaction.currency,
    status: TRANSACTION_TO_INVOICE_STATUS[transaction.status] || 'pending',
  });

  return invoice;
};

const formatInvoice = (invoice, { course, student, teacher }) => ({
  id: invoice._id,
  transactionId: invoice.transaction,
  invoiceId: invoice.invoiceNumber,
  invoiceUrl: `/invoices/${invoice.transaction}/pdf`,
  pdfUrl: `/invoices/${invoice.transaction}/pdf`,
  status: invoice.status,
  amount: invoice.amount,
  courseTitle: course?.title || 'Unknown course',
  studentName: student ? `${student.name?.firstName || ''} ${student.name?.lastName || ''}`.trim() : 'Unknown student',
  studentEmail: student?.email || '',
  teacherName: teacher ? `${teacher.name?.firstName || ''} ${teacher.name?.lastName || ''}`.trim() : '',
  created: invoice.createdAt,
});

/**
 * POST /api/invoices/generate/:transactionId
 */
export const generateInvoice = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }

    const isOwner =
      transaction.student.toString() === req.user._id.toString() ||
      transaction.teacher.toString() === req.user._id.toString();
    if (!isOwner) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const invoice = await ensureInvoiceForTransaction(transactionId);
    res.status(201).json({
      success: true,
      data: { invoiceId: invoice.invoiceNumber, transactionId, status: invoice.status },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to generate invoice.' });
  }
};

/**
 * GET /api/invoices/transaction/:transactionId
 */
export const getInvoiceByTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const transaction = await Transaction.findById(transactionId)
      .populate('course', 'title')
      .populate('student', 'name email')
      .populate('teacher', 'name email');
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }

    const isOwner =
      transaction.student._id.toString() === req.user._id.toString() ||
      transaction.teacher._id.toString() === req.user._id.toString();
    if (!isOwner) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const invoice = await ensureInvoiceForTransaction(transactionId);
    res.json({
      success: true,
      data: formatInvoice(invoice, {
        course: transaction.course,
        student: transaction.student,
        teacher: transaction.teacher,
      }),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch invoice.' });
  }
};

/**
 * Streams the actual PDF - kept separate from the JSON metadata endpoint so
 * the frontend can fetch it as a blob (same pattern as certificate download).
 * GET /api/invoices/:transactionId/pdf
 */
export const getInvoicePdf = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const transaction = await Transaction.findById(transactionId)
      .populate('course', 'title')
      .populate('student', 'name email')
      .populate('teacher', 'name email');
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }

    const isOwner =
      transaction.student._id.toString() === req.user._id.toString() ||
      transaction.teacher._id.toString() === req.user._id.toString();
    if (!isOwner) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const invoice = await ensureInvoiceForTransaction(transactionId);
    const teacherProfile = await Teacher.findOne({ user: transaction.teacher._id }).lean();

    const studentName = `${transaction.student.name?.firstName || ''} ${transaction.student.name?.lastName || ''}`.trim();
    const teacherName = `${transaction.teacher.name?.firstName || ''} ${transaction.teacher.name?.lastName || ''}`.trim();

    const pdfBuffer = await generateInvoicePDF({
      invoiceNumber: invoice.invoiceNumber,
      issuedDate: invoice.createdAt,
      studentName,
      studentEmail: transaction.student.email,
      teacherName,
      courseTitle: transaction.course?.title || 'Course',
      amount: invoice.amount,
      currency: invoice.currency,
      status: invoice.status,
      businessName: teacherProfile?.invoicePreferences?.businessName || undefined,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${invoice.invoiceNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to generate invoice PDF.' });
  }
};

/**
 * GET /api/invoices/student/:studentId
 */
export const getStudentInvoices = async (req, res) => {
  try {
    const { studentId } = req.params;
    if (req.user._id.toString() !== studentId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const transactions = await Transaction.find({ student: studentId, status: 'completed' })
      .populate('course', 'title')
      .populate('student', 'name email')
      .populate('teacher', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    const data = [];
    for (const transaction of transactions) {
      const invoice = await ensureInvoiceForTransaction(transaction._id);
      if (invoice) {
        data.push(
          formatInvoice(invoice, {
            course: transaction.course,
            student: transaction.student,
            teacher: transaction.teacher,
          })
        );
      }
    }

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch invoices.' });
  }
};

/**
 * GET /api/invoices/teacher/:teacherId
 */
export const getTeacherInvoices = async (req, res) => {
  try {
    const { teacherId } = req.params;
    if (req.user._id.toString() !== teacherId || req.user.role !== 'teacher') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const transactions = await Transaction.find({ teacher: teacherId })
      .populate('course', 'title')
      .populate('student', 'name email')
      .populate('teacher', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    const data = [];
    for (const transaction of transactions) {
      const invoice = await ensureInvoiceForTransaction(transaction._id);
      if (invoice) {
        data.push(
          formatInvoice(invoice, {
            course: transaction.course,
            student: transaction.student,
            teacher: transaction.teacher,
          })
        );
      }
    }

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch invoices.' });
  }
};

/**
 * POST /api/invoices/resend/:transactionId
 */
export const resendInvoiceEmail = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const transaction = await Transaction.findById(transactionId)
      .populate('course', 'title')
      .populate('student', 'name email')
      .populate('teacher', 'name email');
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }

    const isOwner =
      transaction.student._id.toString() === req.user._id.toString() ||
      transaction.teacher._id.toString() === req.user._id.toString();
    if (!isOwner) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const invoice = await ensureInvoiceForTransaction(transactionId);

    await sendInvoiceEmail(transaction.student.email, {
      invoiceNumber: invoice.invoiceNumber,
      courseTitle: transaction.course?.title || 'Course',
      amount: invoice.amount,
      currency: invoice.currency,
    });

    invoice.emailSentCount += 1;
    invoice.lastEmailSentAt = new Date();
    await invoice.save();

    res.json({ success: true, data: { message: 'Invoice email sent.' } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to resend invoice email.' });
  }
};

/**
 * GET /api/invoices/stats/teacher/:teacherId
 */
export const getTeacherInvoiceStats = async (req, res) => {
  try {
    const { teacherId } = req.params;
    if (req.user._id.toString() !== teacherId || req.user.role !== 'teacher') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const period = req.query.period || '30d';
    const days = parseInt(period, 10) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const invoices = await Invoice.find({ teacher: teacherId, createdAt: { $gte: since } }).lean();
    const totalInvoices = invoices.length;
    const totalAmount = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const averageAmount = totalInvoices > 0 ? totalAmount / totalInvoices : 0;
    const sent = invoices.filter((inv) => inv.emailSentCount > 0).length;

    res.json({
      success: true,
      data: { totalInvoices, totalAmount, averageAmount, generated: totalInvoices, sent, period },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch invoice stats.' });
  }
};

/**
 * POST /api/invoices/bulk-generate
 */
export const bulkGenerateInvoices = async (req, res) => {
  try {
    const { transactions } = req.body;
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.json({ success: true, data: { generated: 0, message: 'No transactions provided.' } });
    }

    let generated = 0;
    for (const transactionId of transactions) {
      const transaction = await Transaction.findById(transactionId);
      if (!transaction) continue;
      const isOwner =
        transaction.student.toString() === req.user._id.toString() ||
        transaction.teacher.toString() === req.user._id.toString();
      if (!isOwner) continue;

      await ensureInvoiceForTransaction(transactionId);
      generated += 1;
    }

    res.json({ success: true, data: { generated, message: 'Bulk generation complete.' } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to bulk-generate invoices.' });
  }
};

/**
 * GET /api/invoices/preferences/:teacherId
 */
export const getInvoicePreferences = async (req, res) => {
  try {
    const { teacherId } = req.params;
    if (req.user._id.toString() !== teacherId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const teacher = await Teacher.findOne({ user: teacherId }).lean();
    res.json({
      success: true,
      data: {
        autoGenerate: teacher?.invoicePreferences?.autoGenerate ?? true,
        emailNotificationsEnabled: teacher?.invoicePreferences?.emailNotificationsEnabled ?? true,
        businessName: teacher?.invoicePreferences?.businessName || '',
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch invoice preferences.' });
  }
};

/**
 * PUT /api/invoices/preferences/:teacherId
 */
export const updateInvoicePreferences = async (req, res) => {
  try {
    const { teacherId } = req.params;
    if (req.user._id.toString() !== teacherId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const { autoGenerate, emailNotificationsEnabled, businessName } = req.body;
    const update = {};
    if (autoGenerate !== undefined) update['invoicePreferences.autoGenerate'] = !!autoGenerate;
    if (emailNotificationsEnabled !== undefined)
      update['invoicePreferences.emailNotificationsEnabled'] = !!emailNotificationsEnabled;
    if (businessName !== undefined) update['invoicePreferences.businessName'] = String(businessName).slice(0, 100);

    const teacher = await Teacher.findOneAndUpdate(
      { user: teacherId },
      { $set: update },
      { new: true }
    ).lean();

    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher profile not found.' });
    }

    res.json({
      success: true,
      data: {
        autoGenerate: teacher.invoicePreferences?.autoGenerate ?? true,
        emailNotificationsEnabled: teacher.invoicePreferences?.emailNotificationsEnabled ?? true,
        businessName: teacher.invoicePreferences?.businessName || '',
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to update invoice preferences.' });
  }
};
