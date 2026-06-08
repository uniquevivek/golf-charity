import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware';
import * as scoresController from '../controllers/scores.controller';
import * as charityController from '../controllers/charity.controller';
import * as stripeController from '../controllers/stripe.controller';
import * as drawController from '../controllers/draw.controller';
import * as winnerController from '../controllers/winner.controller';
import * as adminController from '../controllers/admin.controller';
import { upload } from '../services/cloudinary.service';

const router = Router();

// ==========================================
// Authentication & User Profile Check
// ==========================================
router.get('/auth/me', requireAuth, (req: any, res) => {
  res.json(req.user);
});

// ==========================================
// Golf Scores Routes
// ==========================================
router.get('/scores', requireAuth, scoresController.getScores);
router.post('/scores', requireAuth, scoresController.addScore);
router.delete('/scores/:id', requireAuth, scoresController.deleteScore);

// ==========================================
// Charity Routes
// ==========================================
// Public
router.get('/charities', charityController.getCharities);
router.get('/charities/:id', charityController.getCharityById);

// User charity preferences
router.post('/charities/select', requireAuth, charityController.selectCharity);
router.post('/charities/percentage', requireAuth, charityController.updateDonationPercentage);

// Admin Charity CRUD
router.post('/charities', requireAuth, requireAdmin, charityController.createCharity);
router.put('/charities/:id', requireAuth, requireAdmin, charityController.updateCharity);
router.delete('/charities/:id', requireAuth, requireAdmin, charityController.deleteCharity);

// ==========================================
// Stripe Subscription Billing Routes
// ==========================================
router.post('/subscriptions/checkout', requireAuth, stripeController.createCheckoutSession);
router.post('/subscriptions/cancel', requireAuth, stripeController.cancelSubscription);
// Note: Webhook is mounted directly on the App in server.ts to preserve raw body signature check.

// ==========================================
// Draw Routes
// ==========================================
// Public (published only)
router.get('/draws', drawController.getPublishedDraws);
router.get('/draws/:id', drawController.getDrawById);

// Admin Draw Operations
router.post('/draws/generate-numbers', requireAuth, requireAdmin, drawController.generateDrawNumbers);
router.post('/draws/simulate', requireAuth, requireAdmin, drawController.simulateDraw);
router.post('/draws/execute', requireAuth, requireAdmin, drawController.executeDraw);
router.post('/draws/:id/publish', requireAuth, requireAdmin, drawController.publishDraw);

// ==========================================
// Winner Winnings & Proof Upload Routes
// ==========================================
router.get('/winners/me', requireAuth, winnerController.getMyWinnings);
router.post(
  '/winners/:id/proof',
  requireAuth,
  upload.single('proofImage'),
  winnerController.uploadWinnerProof
);

// ==========================================
// Admin Dashboard & User Management Routes
// ==========================================
router.get('/admin/analytics', requireAuth, requireAdmin, adminController.getAnalytics);
router.get('/admin/users', requireAuth, requireAdmin, adminController.getUsers);
router.put('/admin/users/:id', requireAuth, requireAdmin, adminController.updateUser);
router.delete('/admin/users/:id', requireAuth, requireAdmin, adminController.deleteUser);

// Admin Winner Management
router.get('/admin/winners', requireAuth, requireAdmin, winnerController.getAllWinners);
router.post('/admin/winners/:id/approve', requireAuth, requireAdmin, winnerController.approveWinner);
router.post('/admin/winners/:id/reject', requireAuth, requireAdmin, winnerController.rejectWinner);
router.post('/admin/winners/:id/pay', requireAuth, requireAdmin, winnerController.payWinner);

export default router;
