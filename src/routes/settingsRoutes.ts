import express from 'express';
import { getSettings, updateSettings, getSetting } from '../controllers/settingsController';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = express.Router();

router.use(authenticate);

// Public settings (only public ones)
router.get('/public', getSettings);

// Protected settings
router.get('/', requireRole(['master_admin', 'admin']), getSettings);
router.get('/:key', requireRole(['master_admin', 'admin']), getSetting);
router.put('/', requireRole(['master_admin']), updateSettings);

export default router;
