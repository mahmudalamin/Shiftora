const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const cancellationController = require('../controllers/cancellationController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(authenticate);

// Get all cancellations
router.get('/', cancellationController.getAll);

// Get user's cancellation history
router.get('/history/:userId?', cancellationController.getUserHistory);

// Staff requests cancellation
router.post(
  '/',
  [
    body('rota_id').isUUID().withMessage('Valid rota ID required'),
    body('reason').isIn(['sick', 'emergency', 'personal', 'other']).withMessage('Invalid reason'),
    body('reason_details').optional().isString()
  ],
  validate,
  cancellationController.requestCancellation
);

// Admin responds to cancellation
router.put(
  '/:id/respond',
  authorize('admin'),
  [
    param('id').isUUID().withMessage('Invalid cancellation ID'),
    body('response').isIn(['approved', 'rejected']).withMessage('Response must be approved or rejected')
  ],
  validate,
  cancellationController.respond
);

module.exports = router;
