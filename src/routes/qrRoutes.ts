import express from 'express';
import {
  generateQR,
  regenerateQR,
  downloadQR,
  getClientQR,
} from '../controllers/qrController';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { validate, idValidator } from '../middleware/validation';

const router = express.Router();

// Public QR access
router.get('/client/:code', getClientQR);

// Protected admin routes
router.use(authenticate);

router.get('/:id', 
  requireRole(['master_admin', 'admin', 'operator']),
  validate(idValidator),
  generateQR
);
router.post('/:id/regenerate',
  requireRole(['master_admin', 'admin']),
  validate(idValidator),
  regenerateQR
);
router.get('/:id/download',
  requireRole(['master_admin', 'admin', 'operator']),
  validate(idValidator),
  downloadQR
);

export default router;
