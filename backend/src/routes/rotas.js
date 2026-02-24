const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();
const rotaController = require('../controllers/rotaController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(authenticate);

// Staff routes
router.get('/my', rotaController.getMyRota);
router.get('/team', rotaController.getTeamRota);

// Admin routes - get all with filters
router.get('/', authorize('admin'), rotaController.getAll);

router.get(
  '/:id',
  [param('id').isUUID().withMessage('Invalid rota ID')],
  validate,
  rotaController.getById
);

router.post(
  '/',
  authorize('admin'),
  [
    body('user_id').optional().isUUID().withMessage('Valid user ID required'),
    body('agency_id').optional().isUUID().withMessage('Valid agency ID required'),
    body('shift_id').isUUID().withMessage('Valid shift ID required'),
    body('date').isDate().withMessage('Valid date required (YYYY-MM-DD)')
  ],
  validate,
  rotaController.create
);

router.post(
  '/bulk',
  authorize('admin'),
  [
    body('entries').isArray({ min: 1 }).withMessage('Entries array required'),
    body('entries.*.user_id').isUUID().withMessage('Valid user ID required'),
    body('entries.*.shift_id').isUUID().withMessage('Valid shift ID required'),
    body('entries.*.date').isDate().withMessage('Valid date required')
  ],
  validate,
  rotaController.createBulk
);

router.put(
  '/:id',
  authorize('admin'),
  [
    param('id').isUUID().withMessage('Invalid rota ID'),
    body('shift_id').optional().isUUID().withMessage('Valid shift ID required'),
    body('date').optional().isDate().withMessage('Valid date required')
  ],
  validate,
  rotaController.update
);

router.delete(
  '/:id',
  authorize('admin'),
  [param('id').isUUID().withMessage('Invalid rota ID')],
  validate,
  rotaController.delete
);

// Admin cancel shift
router.put(
  '/:id/cancel',
  authorize('admin'),
  [param('id').isUUID().withMessage('Invalid rota ID')],
  validate,
  rotaController.cancelShift
);

// Admin restore cancelled shift
router.put(
  '/:id/restore',
  authorize('admin'),
  [param('id').isUUID().withMessage('Invalid rota ID')],
  validate,
  rotaController.restoreShift
);

module.exports = router;
