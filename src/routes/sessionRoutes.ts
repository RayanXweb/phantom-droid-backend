import express from 'express';
import {
  createSession,
  validateSession,
  refreshSession,
  revokeSession,
} from '../controllers/sessionController';
import { clientLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// Public session routes (for client browser)
router.post('/:code', clientLimiter, createSession);
router.get('/:sessionId/validate', validateSession);
router.post('/:sessionId/refresh', refreshSession);
router.post('/:sessionId/revoke', revokeSession);

export default router;
