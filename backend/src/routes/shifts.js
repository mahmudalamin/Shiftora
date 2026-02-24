const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const shiftController = require('../controllers/shiftController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(authenticate);

// Anyone can view shifts
router.get('/', shiftController.getAll);
router.get(
  '/:id',
  [param('id').isUUID().withMessage('Invalid shift ID')],
  validate,
  shiftController.getById
);

// Only admin can create/update/delete
router.post(
  '/',
  authorize('admin'),
  [
    body('name').notEmpty().withMessage('Name required'),
    body('start_time').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid start time (HH:MM)'),
    body('end_time').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid end time (HH:MM)'),
    body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid color hex')
  ],
  validate,
  shiftController.create
);

router.put(
  '/:id',
  authorize('admin'),
  [
    param('id').isUUID().withMessage('Invalid shift ID'),
    body('start_time').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid start time'),
    body('end_time').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid end time'),
    body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid color hex')
  ],
  validate,
  shiftController.update
);

router.delete(
  '/:id',
  authorize('admin'),
  [param('id').isUUID().withMessage('Invalid shift ID')],
  validate,
  shiftController.delete
);

module.exports = router;
