const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

// All routes require admin
router.use(authenticate, authorize('admin'));

router.get('/', userController.getAll);

router.get(
  '/:id',
  [param('id').isUUID().withMessage('Invalid user ID')],
  validate,
  userController.getById
);

router.post(
  '/',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').notEmpty().withMessage('Name required'),
    body('role').optional().isIn(['admin', 'staff']).withMessage('Invalid role')
  ],
  validate,
  userController.create
);

router.put(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid user ID'),
    body('email').optional().isEmail().withMessage('Valid email required'),
    body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('role').optional().isIn(['admin', 'staff']).withMessage('Invalid role')
  ],
  validate,
  userController.update
);

router.delete(
  '/:id',
  [param('id').isUUID().withMessage('Invalid user ID')],
  validate,
  userController.delete
);

module.exports = router;
