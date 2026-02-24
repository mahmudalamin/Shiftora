const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const agencyController = require('../controllers/agencyController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(authenticate);

// Get all agencies
router.get('/', agencyController.getAll);

// Get agency by ID
router.get(
  '/:id',
  [param('id').isUUID().withMessage('Invalid agency ID')],
  validate,
  agencyController.getById
);

// Create agency (admin only)
router.post(
  '/',
  authorize('admin'),
  [
    body('name').notEmpty().withMessage('Agency name is required'),
    body('email').optional().isEmail().withMessage('Invalid email format'),
    body('phone').optional().isString()
  ],
  validate,
  agencyController.create
);

// Update agency (admin only)
router.put(
  '/:id',
  authorize('admin'),
  [
    param('id').isUUID().withMessage('Invalid agency ID'),
    body('name').optional().notEmpty().withMessage('Agency name cannot be empty'),
    body('email').optional().isEmail().withMessage('Invalid email format')
  ],
  validate,
  agencyController.update
);

// Delete agency (admin only)
router.delete(
  '/:id',
  authorize('admin'),
  [param('id').isUUID().withMessage('Invalid agency ID')],
  validate,
  agencyController.delete
);

module.exports = router;
