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

// Create Razorpay Order for Direct Donation (or trigger Sandbox bypass)
export async function createDonationOrder(req: any, res: Response) {
  try {
    const { charityId, amount } = req.body;
    const userId = req.user?.id || null; // Optional: user might not be logged in or could be guest

    if (!charityId || !amount) {
      return res.status(400).json({ error: 'Charity ID and donation amount are required' });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Donation amount must be a positive number' });
    }

    // Verify charity exists
    const charity = await prisma.charity.findUnique({
      where: { id: charityId },
    });

    if (!charity) {
      return res.status(404).json({ error: 'Selected charity not found' });
    }

    // Sandbox Mode Fallback
    if (!razorpay) {
      console.warn('RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET not set. Registering mock donation...');
      const mockDonation = await prisma.donation.create({
        data: {
          userId,
          charityId,
          amount: parsedAmount,
          paymentId: 'don_sandbox_' + Math.random().toString(36).substring(7),
        },
        include: {
          charity: { select: { name: true } }
        }
      });

      return res.status(200).json({
        sandbox: true,
        message: `Sandbox Mode: Donation of ₹${parsedAmount.toFixed(2)} to ${mockDonation.charity.name} registered successfully.`,
        donation: mockDonation,
      });
    }

    // Standard Razorpay direct checkout
    const options = {
      amount: Math.round(parsedAmount * 100), // paise
      currency: 'INR',
      receipt: `receipt_don_${charityId.substring(0, 8)}_${Date.now()}`,
      notes: {
        userId: userId || '',
        charityId,
        amount: parsedAmount.toString(),
        type: 'DIRECT_DONATION',
      },
    };

    const order = await razorpay.orders.create(options);

    res.json({
      sandbox: false,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
    });
  } catch (error: any) {
    console.error('Error creating donation order:', error);
    res.status(500).json({ error: error.message || 'Donation order creation failed' });
  }
}

// Verify donation payment and record it
export async function verifyDonationPayment(req: any, res: Response) {
  try {
    const {
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
      charityId,
      amount,
    } = req.body;

    const userId = req.user?.id || null;

    if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature || !charityId || !amount) {
      return res.status(400).json({ error: 'Missing donation payment details for verification' });
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

    const parsedAmount = parseFloat(amount);

    const donation = await prisma.donation.create({
      data: {
        userId,
        charityId,
        amount: parsedAmount,
        paymentId: razorpayPaymentId,
      },
      include: {
        charity: { select: { name: true } }
      }
    });

    res.json({
      message: `Thank you! Your donation of ₹${parsedAmount.toFixed(2)} to ${donation.charity.name} has been received.`,
      donation,
    });
  } catch (error: any) {
    console.error('Error verifying donation payment:', error);
    res.status(500).json({ error: error.message || 'Donation payment verification failed' });
  }
}
