import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import prisma from '../config/db';

// Ensure environment variables are loaded
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing in backend auth middleware setup.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'USER' | 'ADMIN';
    fullName?: string | null;
    avatar?: string | null;
    donationPercentage: number;
    selectedCharityId?: string | null;
  };
  token?: string;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization header missing or invalid' });
    }

    const token = authHeader.split(' ')[1];

    // Verify token against Supabase Auth (supports RS256/HS256 automatically)
    const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);
    
    if (error || !supabaseUser || !supabaseUser.email) {
      console.warn('Supabase token verification failed:', error?.message || 'No user found');
      return res.status(401).json({ error: 'Invalid or expired auth token' });
    }

    const userId = supabaseUser.id;
    const email = supabaseUser.email;

    // Auto-sync user with Postgres DB
    let user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      // Extract metadata from Supabase token
      const metadata = supabaseUser.user_metadata || {};
      const fullName = metadata.full_name || metadata.fullName || email.split('@')[0];
      const avatar = metadata.avatar_url || metadata.avatar || null;

      user = await prisma.user.create({
        data: {
          id: userId,
          email,
          fullName,
          avatar,
          role: 'USER', // Default role
          donationPercentage: 10, // Default minimum
        },
      });
    }

    // Attach to request
    (req as AuthenticatedRequest).user = user;
    (req as AuthenticatedRequest).token = token;

    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({ error: 'Internal server authentication error' });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (authReq.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access privileges required' });
  }

  next();
}
