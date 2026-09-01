import express from 'express';
import { getStats, getRecentActivity } from '../controllers/dashboardController';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = express.Router();

router.use(authenticate);
router.use(requireRole(['master_admin', 'admin', 'operator']));

router.get('/stats', getStats);
router.get('/recent-activity', getRecentActivity);

export default router;
