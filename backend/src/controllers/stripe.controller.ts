import { Request, Response } from 'express';
import Stripe from 'stripe';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import prisma from '../config/db';

const stripeSecret = process.env.STRIPE_SECRET_KEY || '';
const stripe = new Stripe(stripeSecret, {
  apiVersion: '2023-10-16' as any,
});

const pricing = {
  MONTHLY: {
    priceId: process.env.STRIPE_PRICE_MONTHLY || 'price_monthly_placeholder',
    amount: 29.00,
  },
  YEARLY: {
    priceId: process.env.STRIPE_PRICE_YEARLY || 'price_yearly_placeholder',
    amount: 290.00,
  },
};

// Create a Stripe checkout session or use sandbox bypass
export async function createCheckoutSession(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const email = req.user?.email;

    if (!userId || !email) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const plan = req.body.plan as 'MONTHLY' | 'YEARLY';
    if (plan !== 'MONTHLY' && plan !== 'YEARLY') {
      return res.status(400).json({ error: 'Invalid plan. Choose MONTHLY or YEARLY' });
    }

    // Check if user already has an active subscription
    const existingActiveSub = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
      },
    });

    if (existingActiveSub) {
      return res.status(400).json({ error: 'You already have an active subscription' });
    }

    // Fallback: Sandbox Bypass Mode
    if (!process.env.STRIPE_SECRET_KEY) {
      console.warn('STRIPE_SECRET_KEY not set. Operating in SANDBOX mode (auto-granting subscription)...');
      
      const now = new Date();
      const nextBillingDate = new Date();
      if (plan === 'MONTHLY') {
        nextBillingDate.setMonth(now.getMonth() + 1);
      } else {
        nextBillingDate.setFullYear(now.getFullYear() + 1);
      }

      const mockSub = await prisma.subscription.create({
        data: {
          userId,
          plan,
          status: 'ACTIVE',
          amount: pricing[plan].amount,
          stripeCustomerId: 'cus_sandbox_' + Math.random().toString(36).substring(7),
          stripeSubscriptionId: 'sub_sandbox_' + Math.random().toString(36).substring(7),
          startDate: now,
          endDate: nextBillingDate,
        },
      });

      return res.status(200).json({
        sandbox: true,
        message: 'Sandbox subscription activated successfully.',
        subscription: mockSub,
      });
    }

    // Standard Stripe Integration
    const redirectUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    // Look up or create customer
    let stripeCustomerId: string | null = null;
    const previousSub = await prisma.subscription.findFirst({
      where: { userId },
      select: { stripeCustomerId: true },
    });

    if (previousSub?.stripeCustomerId) {
      stripeCustomerId = previousSub.stripeCustomerId;
    } else {
      const customer = await stripe.customers.create({
        email,
        name: req.user?.fullName || undefined,
        metadata: { userId },
      });
      stripeCustomerId = customer.id;
    }

    // Generate Stripe session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: pricing[plan].priceId,
          quantity: 1,
        },
      ],
      success_url: `${redirectUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${redirectUrl}/dashboard/settings`,
      metadata: {
        userId,
        plan,
        amount: pricing[plan].amount.toString(),
      },
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message || 'Stripe Session generation failed' });
  }
}

// User: Cancel subscription
export async function cancelSubscription(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
      },
    });

    if (!subscription) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    // Bypass in sandbox mode
    if (!subscription.stripeSubscriptionId || subscription.stripeSubscriptionId.startsWith('sub_sandbox_')) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'CANCELLED',
        },
      });
      return res.json({ message: 'Sandbox subscription cancelled successfully.' });
    }

    // Cancel Stripe Subscription at period end
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    // Mark status locally
    const updatedSub = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'CANCELLED',
      },
    });

    res.json({
      message: 'Subscription will cancel at the end of the current billing cycle',
      subscription: updatedSub,
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
}

// Webhook: Handle events from Stripe
export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  let event: Stripe.Event;

  try {
    // If webhook secret is not set, skip signature validation (unsafe for production, warning printed)
    if (!webhookSecret) {
      console.warn('STRIPE_WEBHOOK_SECRET is not configured. Webhook security disabled.');
      event = req.body;
    } else {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    }
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan as any;
        const amount = parseFloat(session.metadata?.amount || '0');
        const stripeSubscriptionId = session.subscription as string;
        const stripeCustomerId = session.customer as string;

        if (userId && plan) {
          const now = new Date();
          const nextBilling = new Date();
          if (plan === 'MONTHLY') {
            nextBilling.setMonth(now.getMonth() + 1);
          } else {
            nextBilling.setFullYear(now.getFullYear() + 1);
          }

          // Check if active subscription exists already
          await prisma.subscription.upsert({
            where: { stripeSubscriptionId },
            create: {
              userId,
              plan,
              status: 'ACTIVE',
              amount,
              stripeCustomerId,
              stripeSubscriptionId,
              startDate: now,
              endDate: nextBilling,
            },
            update: {
              status: 'ACTIVE',
              startDate: now,
              endDate: nextBilling,
            },
          });
        }
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const stripeSubscriptionId = invoice.subscription as string;

        if (stripeSubscriptionId) {
          const subscription = await prisma.subscription.findUnique({
            where: { stripeSubscriptionId },
          });

          if (subscription) {
            const nextBilling = new Date();
            if (subscription.plan === 'MONTHLY') {
              nextBilling.setMonth(nextBilling.getMonth() + 1);
            } else {
              nextBilling.setFullYear(nextBilling.getFullYear() + 1);
            }

            await prisma.subscription.update({
              where: { stripeSubscriptionId },
              data: {
                status: 'ACTIVE',
                startDate: new Date(),
                endDate: nextBilling,
              },
            });
          }
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const stripeSub = event.data.object as Stripe.Subscription;
        const stripeSubscriptionId = stripeSub.id;

        await prisma.subscription.update({
          where: { stripeSubscriptionId },
          data: {
            status: 'EXPIRED',
          },
        }).catch((err) => {
          console.warn('Could not update subscription on delete (might not exist in local db):', err.message);
        });
        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error handling stripe webhook event:', error);
    res.status(500).json({ error: 'Internal server webhook processing error' });
  }
}
