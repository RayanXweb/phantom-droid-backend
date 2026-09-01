import express from 'express';
import { getAuditLogs, getAuditLogActions } from '../controllers/auditLogController';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = express.Router();

router.use(authenticate);
router.use(requireRole(['master_admin', 'admin']));

router.get('/', getAuditLogs);
router.get('/actions', getAuditLogActions);

export default router;
