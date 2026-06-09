import { Response } from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import prisma from '../config/db';

const keyId = process.env.RAZORPAY_KEY_ID || '';
const keySecret = process.env.RAZORPAY_KEY_SECRET || '';

let razorpay: Razorpay | null = null;
if (keyId && keySecret) {
  razorpay = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

const pricing = {
  MONTHLY: 29,
  YEARLY: 290,
};

// Create a Razorpay Order or trigger Sandbox bypass
export async function createOrder(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const email = req.user?.email;

    if (!userId || !email) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { plan, customAmount } = req.body;
    if (plan !== 'MONTHLY' && plan !== 'YEARLY') {
      return res.status(400).json({ error: 'Invalid plan. Choose MONTHLY or YEARLY' });
    }

    // Determine amount (default or custom for testing: 1, 2, or 3 rupees)
    let finalAmount = plan === 'MONTHLY' ? pricing.MONTHLY : pricing.YEARLY;
    if (customAmount !== undefined) {
      const parsedAmount = parseFloat(customAmount);
      if (![1, 2, 3].includes(parsedAmount)) {
        return res.status(400).json({ error: 'Custom testing amount must be 1, 2, or 3 rupees' });
      }
      finalAmount = parsedAmount;
    }

    // Sandbox Fallback: If Razorpay keys are not configured, auto-grant subscription
    if (!razorpay) {
      console.warn('RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET not set. Operating in SANDBOX mode (auto-granting)...');
      
      const now = new Date();
      const nextBillingDate = new Date();
      if (plan === 'MONTHLY') {
        nextBillingDate.setMonth(now.getMonth() + 1);
      } else {
        nextBillingDate.setFullYear(now.getFullYear() + 1);
      }

      // Deactivate any active subscriptions first
      await prisma.subscription.updateMany({
        where: { userId, status: 'ACTIVE' },
        data: { status: 'EXPIRED' },
      });

      const mockSub = await prisma.subscription.create({
        data: {
          userId,
          plan,
          status: 'ACTIVE',
          amount: finalAmount,
          stripeCustomerId: 'cus_razorpay_sandbox',
          stripeSubscriptionId: 'sub_razorpay_sandbox_' + Math.random().toString(36).substring(7),
          startDate: now,
          endDate: nextBillingDate,
        },
      });

      return res.status(200).json({
        sandbox: true,
        message: 'Sandbox subscription activated successfully (Razorpay keys not configured).',
        subscription: mockSub,
      });
    }

    // Standard Razorpay Integration: Create Order
    const options = {
      amount: Math.round(finalAmount * 100), // in paise
      currency: 'INR',
      receipt: `receipt_razorpay_${userId.substring(0, 8)}_${Date.now()}`,
      notes: {
        userId,
        plan,
        amount: finalAmount.toString(),
      },
    };

    const order = await razorpay.orders.create(options);

    res.json({
      sandbox: false,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: keyId,
    });
  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ error: error.message || 'Razorpay order creation failed' });
  }
}

// Verify payment and activate subscription
export async function verifyPayment(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
      plan,
      amount,
    } = req.body;

    if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature || !plan || !amount) {
      return res.status(400).json({ error: 'Missing payment details for verification' });
    }

    if (!keySecret) {
      return res.status(500).json({ error: 'Razorpay secret key not configured on server' });
    }

    // Verify signature
    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (generatedSignature !== razorpaySignature) {
      return res.status(400).json({ error: 'Invalid signature. Payment verification failed.' });
    }

    // Deactivate previous active subscriptions
    await prisma.subscription.updateMany({
      where: { userId, status: 'ACTIVE' },
      data: { status: 'EXPIRED' },
    });

    const now = new Date();
    const nextBillingDate = new Date();
    if (plan === 'MONTHLY') {
      nextBillingDate.setMonth(now.getMonth() + 1);
    } else {
      nextBillingDate.setFullYear(now.getFullYear() + 1);
    }

    const subscription = await prisma.subscription.create({
      data: {
        userId,
        plan,
        status: 'ACTIVE',
        amount: parseFloat(amount),
        stripeCustomerId: 'cus_razorpay_' + userId,
        stripeSubscriptionId: razorpayPaymentId, // use payment ID as the unique sub identifier
        startDate: now,
        endDate: nextBillingDate,
      },
    });

    res.json({
      message: 'Razorpay payment verified & subscription activated successfully.',
      subscription,
    });
  } catch (error: any) {
    console.error('Error verifying Razorpay payment:', error);
    res.status(500).json({ error: error.message || 'Payment verification failed' });
  }
}

// Get the user's active subscription from the database
export async function getActiveSubscription(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ subscription });
  } catch (error: any) {
    console.error('Error fetching active subscription:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch active subscription' });
  }
}

// Cancel user's active subscription
export async function cancelSubscription(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
      },
    });

    if (!subscription) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    const updatedSub = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'CANCELLED',
      },
    });

    res.json({
      message: 'Subscription cancelled successfully.',
      subscription: updatedSub,
    });
  } catch (error: any) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: error.message || 'Failed to cancel subscription' });
  }
}
