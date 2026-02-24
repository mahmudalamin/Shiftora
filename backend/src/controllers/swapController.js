const { SwapRequest, User, Rota, Shift, Notification, sequelize } = require('../models');
const { Op } = require('sequelize');

const includeOptions = [
  { model: User, as: 'requester', attributes: ['id', 'name', 'email'] },
  { model: User, as: 'target', attributes: ['id', 'name', 'email'] },
  {
    model: Rota,
    as: 'requesterRota',
    include: [{ model: Shift, as: 'shift' }]
  },
  {
    model: Rota,
    as: 'targetRota',
    include: [{ model: Shift, as: 'shift' }]
  }
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

exports.getAll = async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};

    if (status) {
      where.status = status;
    }

    // Admin sees all, staff sees only their own
    if (req.user.role !== 'admin') {
      where[Op.or] = [
        { requester_id: req.user.id },
        { target_id: req.user.id }
      ];
    }

    const swapRequests = await SwapRequest.findAll({
      where,
      include: includeOptions,
      order: [['created_at', 'DESC']]
    });

    res.json({ swapRequests });
  } catch (error) {
    console.error('Get swap requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getById = async (req, res) => {
  try {
    const swapRequest = await SwapRequest.findByPk(req.params.id, {
      include: includeOptions
    });

    if (!swapRequest) {
      return res.status(404).json({ message: 'Swap request not found' });
    }

    // Check access for staff
    if (req.user.role !== 'admin' &&
        swapRequest.requester_id !== req.user.id &&
        swapRequest.target_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({ swapRequest });
  } catch (error) {
    console.error('Get swap request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.create = async (req, res) => {
  try {
    const { target_id, requester_rota_id, target_rota_id, reason } = req.body;

    // Verify the requester owns the requester_rota
    const requesterRota = await Rota.findByPk(requester_rota_id);
    if (!requesterRota || requesterRota.user_id !== req.user.id) {
      return res.status(400).json({ message: 'Invalid requester rota' });
    }

    // Verify the target owns the target_rota
    const targetRota = await Rota.findByPk(target_rota_id);
    if (!targetRota || targetRota.user_id !== target_id) {
      return res.status(400).json({ message: 'Invalid target rota' });
    }

    // Check if there's already a pending swap for these rotas
    const existingSwap = await SwapRequest.findOne({
      where: {
        [Op.or]: [
          { requester_rota_id, status: 'pending' },
          { target_rota_id, status: 'pending' }
        ]
      }
    });

    if (existingSwap) {
      return res.status(400).json({
        message: 'One of these shifts already has a pending swap request'
      });
    }

    const swapRequest = await SwapRequest.create({
      requester_id: req.user.id,
      target_id,
      requester_rota_id,
      target_rota_id,
      reason
    });

    // Notify target user
    await createNotification(
      target_id,
      'New Swap Request',
      `${req.user.name} wants to swap shifts with you`,
      'swap_request',
      { swapRequestId: swapRequest.id }
    );

    const fullSwapRequest = await SwapRequest.findByPk(swapRequest.id, {
      include: includeOptions
    });

    res.status(201).json({
      message: 'Swap request created successfully',
      swapRequest: fullSwapRequest
    });
  } catch (error) {
    console.error('Create swap request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.respond = async (req, res) => {
  try {
    const { response } = req.body; // 'accepted' or 'declined'

    const swapRequest = await SwapRequest.findByPk(req.params.id);

    if (!swapRequest) {
      return res.status(404).json({ message: 'Swap request not found' });
    }

    // Only target can respond
    if (swapRequest.target_id !== req.user.id) {
      return res.status(403).json({ message: 'Only the target can respond' });
    }

    if (swapRequest.target_response !== 'pending') {
      return res.status(400).json({ message: 'Already responded' });
    }

    await swapRequest.update({
      target_response: response,
      status: response === 'declined' ? 'rejected' : 'pending'
    });

    // Notify requester
    const statusText = response === 'accepted' ? 'accepted' : 'declined';
    await createNotification(
      swapRequest.requester_id,
      'Swap Response',
      `${req.user.name} has ${statusText} your swap request`,
      'swap_response',
      { swapRequestId: swapRequest.id }
    );

    // If accepted, notify admins
    if (response === 'accepted') {
      const admins = await User.findAll({ where: { role: 'admin' } });
      for (const admin of admins) {
        await createNotification(
          admin.id,
          'Swap Awaiting Approval',
          'A swap request needs your approval',
          'swap_approval_needed',
          { swapRequestId: swapRequest.id }
        );
      }
    }

    const fullSwapRequest = await SwapRequest.findByPk(swapRequest.id, {
      include: includeOptions
    });

    res.json({
      message: `Swap request ${statusText}`,
      swapRequest: fullSwapRequest
    });
  } catch (error) {
    console.error('Respond to swap error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.approve = async (req, res) => {
  try {
    const { response } = req.body; // 'approved' or 'rejected'

    const swapRequest = await SwapRequest.findByPk(req.params.id, {
      include: includeOptions
    });

    if (!swapRequest) {
      return res.status(404).json({ message: 'Swap request not found' });
    }

    if (swapRequest.target_response !== 'accepted') {
      return res.status(400).json({
        message: 'Target must accept first'
      });
    }

    if (swapRequest.admin_response !== 'pending') {
      return res.status(400).json({ message: 'Already processed' });
    }

    const transaction = await sequelize.transaction();

    try {
      await swapRequest.update({
        admin_response: response,
        status: response
      }, { transaction });

      // If approved, actually swap the shifts
      if (response === 'approved') {
        const requesterRota = await Rota.findByPk(swapRequest.requester_rota_id);
        const targetRota = await Rota.findByPk(swapRequest.target_rota_id);

        // Check if same date (swap shift_ids) or different dates (swap dates)
        if (requesterRota.date === targetRota.date) {
          // Same date: swap the shift_ids (users keep their date, but exchange shifts)
          const tempShiftId = requesterRota.shift_id;
          await requesterRota.update({ shift_id: targetRota.shift_id }, { transaction });
          await targetRota.update({ shift_id: tempShiftId }, { transaction });
        } else {
          // Different dates: swap dates and shifts together
          // Use raw SQL to avoid unique constraint issues during swap
          const tempDate = requesterRota.date;
          const tempShiftId = requesterRota.shift_id;

          // First, temporarily set requester's rota to a placeholder (swap in one step)
          await sequelize.query(
            `UPDATE rotas SET date = :targetDate, shift_id = :targetShiftId WHERE id = :requesterId`,
            {
              replacements: {
                targetDate: targetRota.date,
                targetShiftId: targetRota.shift_id,
                requesterId: requesterRota.id
              },
              transaction
            }
          );

          await sequelize.query(
            `UPDATE rotas SET date = :requesterDate, shift_id = :requesterShiftId WHERE id = :targetId`,
            {
              replacements: {
                requesterDate: tempDate,
                requesterShiftId: tempShiftId,
                targetId: targetRota.id
              },
              transaction
            }
          );
        }
      }

      await transaction.commit();

      // Notify both users
      const statusText = response === 'approved' ? 'approved' : 'rejected';
      await createNotification(
        swapRequest.requester_id,
        `Swap ${response === 'approved' ? 'Approved' : 'Rejected'}`,
        `Your swap request has been ${statusText} by admin`,
        'swap_final',
        { swapRequestId: swapRequest.id }
      );

      await createNotification(
        swapRequest.target_id,
        `Swap ${response === 'approved' ? 'Approved' : 'Rejected'}`,
        `The swap request has been ${statusText} by admin`,
        'swap_final',
        { swapRequestId: swapRequest.id }
      );

      const fullSwapRequest = await SwapRequest.findByPk(swapRequest.id, {
        include: includeOptions
      });

      res.json({
        message: `Swap request ${statusText}`,
        swapRequest: fullSwapRequest
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Approve swap error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.cancel = async (req, res) => {
  try {
    const swapRequest = await SwapRequest.findByPk(req.params.id);

    if (!swapRequest) {
      return res.status(404).json({ message: 'Swap request not found' });
    }

    // Only requester can cancel
    if (swapRequest.requester_id !== req.user.id) {
      return res.status(403).json({ message: 'Only requester can cancel' });
    }

    if (swapRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot cancel processed request' });
    }

    await swapRequest.update({ status: 'cancelled' });

    res.json({ message: 'Swap request cancelled' });
  } catch (error) {
    console.error('Cancel swap error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
