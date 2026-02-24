const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const userRoutes = require('./users');
const shiftRoutes = require('./shifts');
const rotaRoutes = require('./rotas');
const swapRoutes = require('./swaps');
const notificationRoutes = require('./notifications');
const cancellationRoutes = require('./cancellations');
const agencyRoutes = require('./agencies');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/shifts', shiftRoutes);
router.use('/rotas', rotaRoutes);
router.use('/swaps', swapRoutes);
router.use('/notifications', notificationRoutes);
router.use('/cancellations', cancellationRoutes);
router.use('/agencies', agencyRoutes);

module.exports = router;
