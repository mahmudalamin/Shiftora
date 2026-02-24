const express = require('express');
const { param } = require('express-validator');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(authenticate);

router.get('/', notificationController.getAll);

router.put(
  '/:id/read',
  [param('id').isUUID().withMessage('Invalid notification ID')],
  validate,
  notificationController.markAsRead
);

router.put('/read-all', notificationController.markAllAsRead);

router.delete(
  '/:id',
  [param('id').isUUID().withMessage('Invalid notification ID')],
  validate,
  notificationController.delete
);

module.exports = router;
