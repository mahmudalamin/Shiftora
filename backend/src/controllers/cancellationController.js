const { ShiftCancellation, User, Rota, Shift, Notification } = require('../models');
const { Op } = require('sequelize');

const includeOptions = [
  { model: User, as: 'user', attributes: ['id', 'name', 'email', 'position'] },
  {
    model: Rota,
    as: 'rota',
    include: [{ model: Shift, as: 'shift' }]
  },
  { model: User, as: 'approver', attributes: ['id', 'name'] }
];

const createNotification = async (userId, title, message, type, data = null) => {
  await Notification.create({
    user_id: userId,
    title,
    message,
    type,
    data
  });
};

// Staff requests shift cancellation
exports.requestCancellation = async (req, res) => {
  try {
    const { rota_id, reason, reason_details } = req.body;

    // Verify the rota belongs to the user
    const rota = await Rota.findByPk(rota_id, {
      include: [{ model: Shift, as: 'shift' }]
    });

    if (!rota) {
      return res.status(404).json({ message: 'Shift not found' });
    }

    if (rota.user_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only cancel your own shifts' });
    }

    // Check if already cancelled
    const existingCancellation = await ShiftCancellation.findOne({
      where: { rota_id, status: { [Op.ne]: 'rejected' } }
    });

    if (existingCancellation) {
      return res.status(400).json({ message: 'Cancellation already requested for this shift' });
    }

    const cancellation = await ShiftCancellation.create({
      rota_id,
      user_id: req.user.id,
      reason,
      reason_details,
      original_date: rota.date,
      original_shift_name: rota.shift?.name
    });

    // Notify admins
    const admins = await User.findAll({ where: { role: 'admin' } });
    for (const admin of admins) {
      await createNotification(
        admin.id,
        'Shift Cancellation Request',
        `${req.user.name} requested to cancel their ${rota.shift?.name} shift on ${rota.date}`,
        'cancellation_request',
        { cancellationId: cancellation.id }
      );
    }

    const fullCancellation = await ShiftCancellation.findByPk(cancellation.id, {
      include: includeOptions
    });

    res.status(201).json({
      message: 'Cancellation request submitted',
      cancellation: fullCancellation
    });
  } catch (error) {
    console.error('Request cancellation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all cancellations (admin sees all, staff sees own)
exports.getAll = async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};

    if (status) {
      where.status = status;
    }

    if (req.user.role !== 'admin') {
      where.user_id = req.user.id;
    }

    const cancellations = await ShiftCancellation.findAll({
      where,
      include: includeOptions,
      order: [['created_at', 'DESC']]
    });

    res.json({ cancellations });
  } catch (error) {
    console.error('Get cancellations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin approves/rejects cancellation
exports.respond = async (req, res) => {
  try {
    const { response } = req.body; // 'approved' or 'rejected'

    const cancellation = await ShiftCancellation.findByPk(req.params.id, {
      include: includeOptions
    });

    if (!cancellation) {
      return res.status(404).json({ message: 'Cancellation request not found' });
    }

    if (cancellation.status !== 'pending') {
      return res.status(400).json({ message: 'Already processed' });
    }

    await cancellation.update({
      status: response,
      approved_by: req.user.id,
      approved_at: new Date()
    });

    // If approved, update the rota status to 'cancelled'
    if (response === 'approved' && cancellation.rota) {
      await Rota.update(
        { status: 'cancelled' },
        { where: { id: cancellation.rota_id } }
      );
    }

    // Notify the staff member
    await createNotification(
      cancellation.user_id,
      `Cancellation ${response === 'approved' ? 'Approved' : 'Rejected'}`,
      `Your shift cancellation request for ${cancellation.original_date} has been ${response}`,
      'cancellation_response',
      { cancellationId: cancellation.id }
    );

    const updatedCancellation = await ShiftCancellation.findByPk(cancellation.id, {
      include: includeOptions
    });

    res.json({
      message: `Cancellation ${response}`,
      cancellation: updatedCancellation
    });
  } catch (error) {
    console.error('Respond to cancellation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get cancellation history for a user
exports.getUserHistory = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;

    // Staff can only see their own history
    if (req.user.role !== 'admin' && userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const cancellations = await ShiftCancellation.findAll({
      where: { user_id: userId },
      include: includeOptions,
      order: [['created_at', 'DESC']]
    });

    const stats = {
      total: cancellations.length,
      approved: cancellations.filter(c => c.status === 'approved').length,
      rejected: cancellations.filter(c => c.status === 'rejected').length,
      pending: cancellations.filter(c => c.status === 'pending').length,
      byReason: {
        sick: cancellations.filter(c => c.reason === 'sick').length,
        emergency: cancellations.filter(c => c.reason === 'emergency').length,
        personal: cancellations.filter(c => c.reason === 'personal').length,
        other: cancellations.filter(c => c.reason === 'other').length
      }
    };

    res.json({ cancellations, stats });
  } catch (error) {
    console.error('Get user history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
