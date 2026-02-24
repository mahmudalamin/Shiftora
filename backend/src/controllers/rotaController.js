const { Rota, User, Shift, Agency } = require('../models');
const { Op } = require('sequelize');

const includeOptions = [
  { model: User, as: 'user', attributes: ['id', 'name', 'email', 'position', 'department'] },
  { model: Shift, as: 'shift' },
  { model: User, as: 'creator', attributes: ['id', 'name'] },
  { model: Agency, as: 'agency' }
];

exports.getAll = async (req, res) => {
  try {
    const { start_date, end_date, user_id } = req.query;

    const where = {};

    if (start_date && end_date) {
      where.date = {
        [Op.between]: [start_date, end_date]
      };
    } else if (start_date) {
      where.date = { [Op.gte]: start_date };
    } else if (end_date) {
      where.date = { [Op.lte]: end_date };
    }

    if (user_id) {
      where.user_id = user_id;
    }

    const rotas = await Rota.findAll({
      where,
      include: includeOptions,
      order: [['date', 'ASC']]
    });

    res.json({ rotas });
  } catch (error) {
    console.error('Get rotas error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMyRota = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    const where = { user_id: req.user.id };

    if (start_date && end_date) {
      where.date = {
        [Op.between]: [start_date, end_date]
      };
    }

    const rotas = await Rota.findAll({
      where,
      include: [{ model: Shift, as: 'shift' }],
      order: [['date', 'ASC']]
    });

    res.json({ rotas });
  } catch (error) {
    console.error('Get my rota error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getTeamRota = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    const where = {};

    if (start_date && end_date) {
      where.date = {
        [Op.between]: [start_date, end_date]
      };
    }

    const rotas = await Rota.findAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'position', 'department'] },
        { model: Shift, as: 'shift' },
        { model: Agency, as: 'agency' }
      ],
      order: [['date', 'ASC'], ['user_id', 'ASC']]
    });

    res.json({ rotas });
  } catch (error) {
    console.error('Get team rota error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getById = async (req, res) => {
  try {
    const rota = await Rota.findByPk(req.params.id, {
      include: includeOptions
    });

    if (!rota) {
      return res.status(404).json({ message: 'Rota entry not found' });
    }

    res.json({ rota });
  } catch (error) {
    console.error('Get rota error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.create = async (req, res) => {
  try {
    const { user_id, agency_id, shift_id, date, notes } = req.body;

    // Must have either user_id or agency_id
    if (!user_id && !agency_id) {
      return res.status(400).json({ message: 'Either user or agency is required' });
    }

    // Check if user exists (if provided)
    if (user_id) {
      const user = await User.findByPk(user_id);
      if (!user) {
        return res.status(400).json({ message: 'User not found' });
      }

      // Check for existing rota on same date for same user
      const existingRota = await Rota.findOne({
        where: { user_id, date, status: 'active' }
      });

      if (existingRota) {
        return res.status(400).json({
          message: 'User already has a shift assigned on this date'
        });
      }
    }

    // Check if agency exists (if provided)
    if (agency_id) {
      const agency = await Agency.findByPk(agency_id);
      if (!agency) {
        return res.status(400).json({ message: 'Agency not found' });
      }
    }

    // Check if shift exists
    const shift = await Shift.findByPk(shift_id);
    if (!shift) {
      return res.status(400).json({ message: 'Shift not found' });
    }

    const rota = await Rota.create({
      user_id: user_id || null,
      agency_id: agency_id || null,
      shift_id,
      date,
      notes,
      created_by: req.user.id
    });

    const fullRota = await Rota.findByPk(rota.id, {
      include: includeOptions
    });

    res.status(201).json({
      message: 'Rota entry created successfully',
      rota: fullRota
    });
  } catch (error) {
    console.error('Create rota error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createBulk = async (req, res) => {
  try {
    const { entries } = req.body; // Array of { user_id, shift_id, date, notes }

    const createdRotas = [];
    const errors = [];

    for (const entry of entries) {
      const { user_id, shift_id, date, notes } = entry;

      const existingRota = await Rota.findOne({
        where: { user_id, date }
      });

      if (existingRota) {
        errors.push({ user_id, date, message: 'Already assigned' });
        continue;
      }

      const rota = await Rota.create({
        user_id,
        shift_id,
        date,
        notes,
        created_by: req.user.id
      });

      createdRotas.push(rota);
    }

    res.status(201).json({
      message: `Created ${createdRotas.length} entries`,
      created: createdRotas.length,
      errors
    });
  } catch (error) {
    console.error('Create bulk rota error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.update = async (req, res) => {
  try {
    const rota = await Rota.findByPk(req.params.id);

    if (!rota) {
      return res.status(404).json({ message: 'Rota entry not found' });
    }

    const { shift_id, date, notes } = req.body;

    if (date && date !== rota.date) {
      const existingRota = await Rota.findOne({
        where: {
          user_id: rota.user_id,
          date,
          id: { [Op.ne]: rota.id }
        }
      });

      if (existingRota) {
        return res.status(400).json({
          message: 'User already has a shift on this date'
        });
      }
    }

    await rota.update({
      shift_id: shift_id || rota.shift_id,
      date: date || rota.date,
      notes: notes !== undefined ? notes : rota.notes
    });

    const fullRota = await Rota.findByPk(rota.id, {
      include: includeOptions
    });

    res.json({
      message: 'Rota entry updated successfully',
      rota: fullRota
    });
  } catch (error) {
    console.error('Update rota error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.delete = async (req, res) => {
  try {
    const rota = await Rota.findByPk(req.params.id);

    if (!rota) {
      return res.status(404).json({ message: 'Rota entry not found' });
    }

    await rota.destroy();

    res.json({ message: 'Rota entry deleted successfully' });
  } catch (error) {
    console.error('Delete rota error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin cancel shift
exports.cancelShift = async (req, res) => {
  try {
    const rota = await Rota.findByPk(req.params.id);

    if (!rota) {
      return res.status(404).json({ message: 'Rota entry not found' });
    }

    if (rota.status === 'cancelled') {
      return res.status(400).json({ message: 'Shift is already cancelled' });
    }

    await rota.update({ status: 'cancelled' });

    const fullRota = await Rota.findByPk(rota.id, {
      include: includeOptions
    });

    res.json({
      message: 'Shift cancelled successfully',
      rota: fullRota
    });
  } catch (error) {
    console.error('Cancel shift error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin restore cancelled shift
exports.restoreShift = async (req, res) => {
  try {
    const rota = await Rota.findByPk(req.params.id);

    if (!rota) {
      return res.status(404).json({ message: 'Rota entry not found' });
    }

    if (rota.status !== 'cancelled') {
      return res.status(400).json({ message: 'Shift is not cancelled' });
    }

    await rota.update({ status: 'active' });

    const fullRota = await Rota.findByPk(rota.id, {
      include: includeOptions
    });

    res.json({
      message: 'Shift restored successfully',
      rota: fullRota
    });
  } catch (error) {
    console.error('Restore shift error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
