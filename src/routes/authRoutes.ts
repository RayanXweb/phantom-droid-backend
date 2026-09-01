import express from 'express';
import { login, logout, refreshToken, getMe, register } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { authValidators, validate } from '../middleware/validation';
import { authLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// Public routes
router.post('/login', authLimiter, validate(authValidators.login), login);
router.post('/refresh', refreshToken);

// Protected routes
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.post('/register', 
  authenticate,
  requireRole(['master_admin']),
  validate(authValidators.register),
  register
);

export default router;
