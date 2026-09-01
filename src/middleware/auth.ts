import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin';
import { config } from '../config/config';
import logger from './logger';

export interface AuthRequest extends Request {
  user?: any;
  token?: string;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: { code: 'UNAUTHORIZED' },
      });
      return;
    }

    const token = authHeader.substring(7);
    req.token = token;

    try {
      const decoded = jwt.verify(token, config.jwtSecret) as any;
      
      const admin = await Admin.findOne({
        _id: decoded.id,
        status: 'active',
      }).select('-passwordHash');

      if (!admin) {
        res.status(401).json({
          success: false,
          message: 'User not found or inactive',
          error: { code: 'UNAUTHORIZED' },
        });
        return;
      }

      req.user = admin;
      next();
    } catch (jwtError) {
      logger.error('JWT verification failed:', jwtError);
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
        error: { code: 'UNAUTHORIZED' },
      });
      return;
    }
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};
