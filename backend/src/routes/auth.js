const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required')
  ],
  validate,
  authController.login
);

router.post(
  '/register',
  authenticate,
  authorize('admin'),
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').notEmpty().withMessage('Name required'),
    body('role').optional().isIn(['admin', 'staff']).withMessage('Invalid role')
  ],
  validate,
  authController.register
);

router.post(
  '/refresh',
  [body('refreshToken').notEmpty().withMessage('Refresh token required')],
  validate,
  authController.refresh
);

router.get('/me', authenticate, authController.me);

module.exports = router;
