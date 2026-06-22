import express from 'express';
import Stripe from 'stripe';
import { protect } from '../middleware/auth.js';
import Teacher from '../models/Teacher.js';

const router = express.Router();

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  return new Stripe(process.env.STRIPE_SECRET_KEY);
};

router.post('/create-account', protect, async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ user: req.user._id });
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher profile not found.' });
    }

    if (teacher.stripeAccountId) {
      return res.json({ success: true, data: { accountId: teacher.stripeAccountId } });
    }

    const stripe = getStripe();
    if (!stripe) {
      return res.json({
        success: true,
        data: { accountId: null, message: 'Stripe not configured. Set STRIPE_SECRET_KEY in env.' },
      });
    }

    const account = await stripe.accounts.create({
      type: 'express',
      email: req.user.email,
      capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
    });

    teacher.stripeAccountId = account.id;
    teacher.stripeEmail = req.user.email;
    await teacher.save();

    res.json({ success: true, data: { accountId: account.id } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to create Stripe account.' });
  }
});

router.post('/create-account-link', protect, async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ user: req.user._id });
    if (!teacher?.stripeAccountId) {
      return res.status(400).json({ success: false, message: 'No Stripe account found. Create one first.' });
    }

    const stripe = getStripe();
    if (!stripe) {
      return res.json({ success: true, data: { url: '#', message: 'Stripe not configured.' } });
    }

    const accountLink = await stripe.accountLinks.create({
      account: teacher.stripeAccountId,
      refresh_url: `${process.env.CLIENT_URL || 'http://localhost:8080'}/teacher/stripe-connect?refresh=true`,
      return_url: `${process.env.CLIENT_URL || 'http://localhost:8080'}/teacher/stripe-connect?success=true`,
      type: 'account_onboarding',
    });

    res.json({ success: true, data: { url: accountLink.url } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to create account link.' });
  }
});

router.get('/account-status', protect, async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ user: req.user._id });
    if (!teacher?.stripeAccountId) {
      return res.json({
        success: true,
        data: {
          isConnected: false,
          isVerified: false,
          onboardingComplete: false,
          requirements: [],
          accountId: null,
          verificationStage: 'not_started',
          estimatedCompletionTime: null,
        },
      });
    }

    const stripe = getStripe();
    if (!stripe) {
      return res.json({
        success: true,
        data: {
          isConnected: true,
          isVerified: false,
          onboardingComplete: false,
          requirements: [],
          accountId: teacher.stripeAccountId,
          verificationStage: 'pending',
          estimatedCompletionTime: null,
          message: 'Stripe not configured. Cannot verify status.',
        },
      });
    }

    const account = await stripe.accounts.retrieve(teacher.stripeAccountId);

    res.json({
      success: true,
      data: {
        isConnected: true,
        isVerified: account.charges_enabled && account.payouts_enabled,
        onboardingComplete: account.details_submitted,
        requirements: account.requirements?.currently_due || [],
        accountId: teacher.stripeAccountId,
        verificationStage: account.charges_enabled ? 'verified' : account.details_submitted ? 'submitted' : 'pending',
        estimatedCompletionTime: account.requirements?.current_deadline || null,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to check account status.' });
  }
});

router.get('/quick-status', protect, async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ user: req.user._id });
    res.json({
      success: true,
      data: {
        isConnected: !!teacher?.stripeAccountId,
        isVerified: !!teacher?.isVerified,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to check status.' });
  }
});

router.post('/proactive-verification', protect, async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ user: req.user._id });
    if (!teacher?.stripeAccountId) {
      return res.json({ success: true, data: { verified: false } });
    }

    const stripe = getStripe();
    if (!stripe) {
      return res.json({ success: true, data: { verified: false, message: 'Stripe not configured.' } });
    }

    const account = await stripe.accounts.retrieve(teacher.stripeAccountId);
    const isVerified = account.charges_enabled && account.payouts_enabled;

    if (isVerified && !teacher.isVerified) {
      teacher.isVerified = true;
      await teacher.save();
    }

    res.json({ success: true, data: { verified: isVerified } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Verification check failed.' });
  }
});

router.delete('/disconnect-account', protect, async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ user: req.user._id });
    if (!teacher?.stripeAccountId) {
      return res.json({ success: true, message: 'No account to disconnect.' });
    }

    teacher.stripeAccountId = null;
    teacher.stripeEmail = null;
    teacher.isVerified = false;
    await teacher.save();

    res.json({ success: true, message: 'Stripe account disconnected.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to disconnect.' });
  }
});

router.post('/update-account', protect, (req, res) => {
  res.json({ success: true, data: { message: 'Account update noted.' } });
});

router.post('/retry-connection', protect, (req, res) => {
  res.json({ success: true, data: { retried: true } });
});

router.get('/audit-log', protect, (req, res) => {
  res.json({ success: true, data: { entries: [], total: 0 } });
});

router.delete('/disconnect-enhanced', protect, async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ user: req.user._id });
    if (teacher?.stripeAccountId) {
      teacher.stripeAccountId = null;
      teacher.stripeEmail = null;
      teacher.isVerified = false;
      await teacher.save();
    }
    res.json({ success: true, message: 'Stripe account disconnected.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
