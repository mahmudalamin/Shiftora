const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const swapController = require('../controllers/swapController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(authenticate);

router.get('/', swapController.getAll);

router.get(
  '/:id',
  [param('id').isUUID().withMessage('Invalid swap request ID')],
  validate,
  swapController.getById
);

// Staff creates swap request
router.post(
  '/',
  [
    body('target_id').isUUID().withMessage('Valid target user ID required'),
    body('requester_rota_id').isUUID().withMessage('Valid requester rota ID required'),
    body('target_rota_id').isUUID().withMessage('Valid target rota ID required'),
    body('reason').optional().isString()
  ],
  validate,
  swapController.create
);

// Target staff responds (accept/decline)
router.put(
  '/:id/respond',
  [
    param('id').isUUID().withMessage('Invalid swap request ID'),
    body('response').isIn(['accepted', 'declined']).withMessage('Response must be accepted or declined')
  ],
  validate,
  swapController.respond
);

// Admin approves/rejects
router.put(
  '/:id/approve',
  authorize('admin'),
  [
    param('id').isUUID().withMessage('Invalid swap request ID'),
    body('response').isIn(['approved', 'rejected']).withMessage('Response must be approved or rejected')
  ],
  validate,
  swapController.approve
);

// Requester cancels
router.put(
  '/:id/cancel',
  [param('id').isUUID().withMessage('Invalid swap request ID')],
  validate,
  swapController.cancel
);

module.exports = router;
