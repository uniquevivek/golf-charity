import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import router from './routes';
import { handleStripeWebhook } from './controllers/stripe.controller';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Stripe Webhook (MUST be registered before express.json() to capture raw body)
app.post(
  '/api/subscriptions/webhook',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
);

// 2. Global Security & Utility Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false, // Allows loading images from Cloudinary directly
}));

// CORS Configuration
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3001',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS policy'));
    }
  },
  credentials: true,
}));

app.use(morgan('dev'));

// JSON Body Parser for all other endpoints
app.use(express.json());

// 3. Mount Main API Router
app.use('/api', router);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// 4. Catch-all for undefined routes
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: `Not found: ${req.method} ${req.url}` });
});

// 5. Global Error Handling Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error occurred',
  });
});

// Start listening
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
});
