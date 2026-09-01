import express from 'express';
import {
  createClient,
  getClients,
  getClient,
  updateClient,
  deleteClient,
  activateClient,
  deactivateClient,
  regenerateUrl,
  resetClient,
} from '../controllers/clientController';
import { authenticate } from '../middleware/auth';
import { requireRole, requirePermission } from '../middleware/rbac';
import { clientValidators, validate, idValidator } from '../middleware/validation';
import { clientLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// Public client access (for client browser)
router.get('/public/:code', clientLimiter, async (req, res) => {
  // Public access for client browser
  // This will be handled in clientController with a public method
  // For now, redirect to a public handler
  const { getClientByCode } = await import('../controllers/clientPublicController');
  await getClientByCode(req, res);
});

// Protected admin routes
router.use(authenticate);

router.get('/', requireRole(['master_admin', 'admin', 'operator']), getClients);
router.get('/:id', requireRole(['master_admin', 'admin', 'operator']), getClient);
router.post('/', 
  requireRole(['master_admin', 'admin']),
  requirePermission('client:create'),
  validate(clientValidators.create),
  createClient
);
router.patch('/:id',
  requireRole(['master_admin', 'admin']),
  requirePermission('client:edit'),
  validate(idValidator),
  validate(clientValidators.update),
  updateClient
);
router.delete('/:id',
  requireRole(['master_admin']),
  requirePermission('client:delete'),
  validate(idValidator),
  deleteClient
);

// Client actions
router.post('/:id/activate',
  requireRole(['master_admin', 'admin']),
  requirePermission('client:activate'),
  validate(idValidator),
  activateClient
);
router.post('/:id/deactivate',
  requireRole(['master_admin', 'admin']),
  requirePermission('client:deactivate'),
  validate(idValidator),
  deactivateClient
);
router.post('/:id/regenerate-url',
  requireRole(['master_admin', 'admin']),
  requirePermission('client:regenerate'),
  validate(idValidator),
  regenerateUrl
);
router.post('/:id/reset',
  requireRole(['master_admin']),
  validate(idValidator),
  resetClient
);

export default router;
